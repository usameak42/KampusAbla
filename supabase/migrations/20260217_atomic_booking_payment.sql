-- Atomic Booking and Payment Transaction Creation
-- Date: 2026-02-17
-- Description: Ensures booking and transaction are created atomically with proper rollback

-- RPC function for atomic booking + transaction creation
CREATE OR REPLACE FUNCTION create_booking_with_transaction(
    p_parent_id UUID,
    p_sitter_id UUID,
    p_child_id UUID,
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ,
    p_hourly_rate DECIMAL,
    p_total_amount DECIMAL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_booking_id UUID;
    v_transaction_id UUID;
    v_platform_fee DECIMAL;
    v_sitter_amount DECIMAL;
    v_result JSON;
BEGIN
    -- Calculate fees (10% platform fee)
    v_platform_fee := ROUND(p_total_amount * 0.10, 2);
    v_sitter_amount := p_total_amount - v_platform_fee;
    
    -- Create booking with pending_payment status
    INSERT INTO bookings (
        parent_id,
        sitter_id,
        child_id,
        start_time,
        end_time,
        hourly_rate,
        total_amount,
        status,
        notes
    ) VALUES (
        p_parent_id,
        p_sitter_id,
        p_child_id,
        p_start_time,
        p_end_time,
        p_hourly_rate,
        p_total_amount,
        'pending_payment',
        p_notes
    )
    RETURNING id INTO v_booking_id;
    
    -- Create transaction record linked to booking
    INSERT INTO transactions (
        booking_id,
        parent_id,
        sitter_id,
        amount,
        platform_fee,
        sitter_amount,
        status
    ) VALUES (
        v_booking_id,
        p_parent_id,
        p_sitter_id,
        p_total_amount,
        v_platform_fee,
        v_sitter_amount,
        'pending'
    )
    RETURNING id INTO v_transaction_id;
    
    -- Return both IDs and calculated amounts
    v_result := json_build_object(
        'booking_id', v_booking_id,
        'transaction_id', v_transaction_id,
        'total_amount', p_total_amount,
        'platform_fee', v_platform_fee,
        'sitter_amount', v_sitter_amount
    );
    
    RETURN v_result;
EXCEPTION
    WHEN OTHERS THEN
        -- Rollback happens automatically in PostgreSQL for function errors
        RAISE EXCEPTION 'Failed to create booking with transaction: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to rollback booking after payment failure
CREATE OR REPLACE FUNCTION rollback_booking_payment(
    p_booking_id UUID,
    p_transaction_id UUID,
    p_reason TEXT DEFAULT 'payment_failed'
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Cancel the booking
    UPDATE bookings
    SET 
        status = 'cancelled',
        cancellation_reason = p_reason,
        updated_at = NOW()
    WHERE id = p_booking_id;
    
    -- Mark transaction as failed
    UPDATE transactions
    SET 
        status = 'failed',
        metadata = jsonb_build_object('failure_reason', p_reason),
        updated_at = NOW()
    WHERE id = p_transaction_id;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to rollback booking: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to confirm payment and update statuses
CREATE OR REPLACE FUNCTION confirm_booking_payment(
    p_transaction_id UUID,
    p_payment_gateway_id TEXT,
    p_payment_method TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_booking_id UUID;
BEGIN
    -- Get booking_id from transaction
    SELECT booking_id INTO v_booking_id
    FROM transactions
    WHERE id = p_transaction_id;
    
    IF v_booking_id IS NULL THEN
        RAISE EXCEPTION 'Transaction not found: %', p_transaction_id;
    END IF;
    
    -- Update transaction to completed
    UPDATE transactions
    SET 
        status = 'completed',
        payment_gateway_id = p_payment_gateway_id,
        payment_method = COALESCE(p_payment_method, payment_method),
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_transaction_id;
    
    -- Update booking to confirmed
    UPDATE bookings
    SET 
        status = 'confirmed',
        updated_at = NOW()
    WHERE id = v_booking_id;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to confirm payment: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add indexes if not exist (for performance)
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- Add comments
COMMENT ON FUNCTION create_booking_with_transaction IS 'Atomically creates booking and transaction records to ensure data consistency';
COMMENT ON FUNCTION rollback_booking_payment IS 'Cancels booking and marks transaction as failed when payment processing fails';
COMMENT ON FUNCTION confirm_booking_payment IS 'Updates booking and transaction status when payment is successfully processed';
