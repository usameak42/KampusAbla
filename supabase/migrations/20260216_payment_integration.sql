-- Migration: Payment Integration Database Updates
-- Description: Add columns for iyzico payment provider integration
-- Version: 003
-- Created: 2026-02-16

-- ============================================================================
-- 1. UPDATE SITTERS TABLE FOR SUB-MERCHANT SUPPORT
-- ============================================================================

ALTER TABLE public.sitters
ADD COLUMN IF NOT EXISTS sub_merchant_key VARCHAR(255),
ADD COLUMN IF NOT EXISTS sub_merchant_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS sub_merchant_rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS sub_merchant_created_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_sitters_sub_merchant_key ON public.sitters(sub_merchant_key);
CREATE INDEX IF NOT EXISTS idx_sitters_sub_merchant_status ON public.sitters(sub_merchant_status);

COMMENT ON COLUMN public.sitters.sub_merchant_key IS 'iyzico sub-merchant key for split payments';
COMMENT ON COLUMN public.sitters.sub_merchant_status IS 'Status: pending, active, approved, rejected';

-- ============================================================================
-- 2. UPDATE TRANSACTIONS TABLE FOR PAYMENT PROVIDER DATA
-- ============================================================================

ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(50) DEFAULT 'iyzico',
ADD COLUMN IF NOT EXISTS platform_fee_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS sitter_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS provider_transaction_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS provider_response JSONB;

CREATE INDEX IF NOT EXISTS idx_transactions_provider_id ON public.transactions(provider_transaction_id);
CREATE INDEX IF NOT EXISTS idx_transactions_provider ON public.transactions(payment_provider);

COMMENT ON COLUMN public.transactions.platform_fee_amount IS '10% platform fee deducted from total';
COMMENT ON COLUMN public.transactions.sitter_amount IS '90% amount sent to sitter';
COMMENT ON COLUMN public.transactions.provider_transaction_id IS 'Transaction ID from payment provider (iyzico paymentId)';

-- ============================================================================
-- 3. UPDATE REFUNDS TABLE FOR PROVIDER DATA
-- ============================================================================

ALTER TABLE public.refunds
ADD COLUMN IF NOT EXISTS provider_refund_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS provider_response JSONB;

CREATE INDEX IF NOT EXISTS idx_refunds_provider_id ON public.refunds(provider_refund_id);

-- ============================================================================
-- 4. UPDATE PAYOUTS TABLE FOR PROVIDER DATA
-- ============================================================================

ALTER TABLE public.payouts
ADD COLUMN IF NOT EXISTS provider_payout_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS provider_response JSONB;

CREATE INDEX IF NOT EXISTS idx_payouts_provider_id ON public.payouts(provider_payout_id);

-- ============================================================================
-- 5. ADD PAYMENT_STATUS TO BOOKINGS TABLE
-- ============================================================================

-- Add payment status tracking to bookings
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON public.bookings(payment_status);

COMMENT ON COLUMN public.bookings.payment_status IS 'Status: pending, paid, refunded, failed';
