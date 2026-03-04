/**
 * Atomic Booking Creation Service
 * 
 * Ensures booking and payment transaction are created atomically
 * with proper rollback on payment failure.
 */

import { supabase } from '@/integrations/supabase/client';
import { paymentService } from '@/services/payment';
import { toast } from '@/hooks/use-toast';
import { CriticalFlows } from '@/lib/performance';

export interface BookingPaymentData {
    parentId: string;
    sitterId: string;
    childId: string;
    startTime: Date;
    endTime: Date;
    hourlyRate: number;
    totalAmount: number;
    notes?: string;
    paymentCard: {
        cardHolderName: string;
        cardNumber: string;
        expireMonth: string;
        expireYear: string;
        cvc: string;
    };
    buyer: {
        id: string;
        name: string;
        surname: string;
        email: string;
        gsmNumber: string;
        identityNumber: string;
        registrationAddress: string;
        city: string;
        country: string;
    };
    sitterSubMerchantKey: string;
}

export interface BookingPaymentResult {
    success: boolean;
    bookingId?: string;
    transactionId?: string;
    error?: string;
}

/**
 * Creates booking with atomic transaction handling
 * Ensures booking and transaction are created together,
 * with rollback if payment fails
 */
export async function createBookingWithPayment(
    data: BookingPaymentData
): Promise<BookingPaymentResult> {
    let bookingId: string | null = null;
    let transactionId: string | null = null;

    try {
        // Step 1: Create booking + transaction atomically
        const { data: result, error: rpcError } = await CriticalFlows.trackBookingCreation(
            () =>
            supabase.rpc(
                    'create_booking_with_transaction' as any,
                    {
                        p_parent_id: data.parentId,
                        p_sitter_id: data.sitterId,
                        p_child_id: data.childId,
                        p_start_time: data.startTime.toISOString(),
                        p_end_time: data.endTime.toISOString(),
                        p_hourly_rate: data.hourlyRate,
                        p_total_amount: data.totalAmount,
                        p_notes: data.notes || null,
                    }
                ),
            {
                parent_id: data.parentId,
                sitter_id: data.sitterId,
            }
        );

        if (rpcError) {
            console.error('Error creating booking with transaction:', rpcError);
            throw new Error(rpcError.message || 'Failed to create booking');
        }

        bookingId = (result as any).booking_id;
        transactionId = (result as any).transaction_id;

        console.log('Booking and transaction created:', {
            bookingId,
            transactionId,
            platformFee: (result as any).platform_fee,
            sitterAmount: (result as any).sitter_amount,
        });

        // Step 2: Process payment
        const paymentResult = await CriticalFlows.trackPaymentProcessing(
            () =>
                paymentService.processPayment(
                    data.totalAmount,
                    bookingId,
                    data.sitterSubMerchantKey,
                    data.paymentCard,
                    data.buyer
                ),
            {
                booking_id: bookingId,
                amount: data.totalAmount.toString(),
            }
        );

        if (!paymentResult.success) {
            // Payment failed - rollback booking
            console.error('Payment failed, rolling back booking:', paymentResult.error);
            await rollbackBooking(bookingId, transactionId, 'payment_failed');

            return {
                success: false,
                error: paymentResult.error || 'Ödeme işlemi başarısız oldu',
            };
        }

        // Step 3: Confirm payment and update statuses
        const { error: confirmError } = await supabase.rpc(
            'confirm_booking_payment' as any,
            {
                p_transaction_id: transactionId,
                p_payment_gateway_id: paymentResult.transactionId || '',
                p_payment_method: 'credit_card',
            }
        );

        if (confirmError) {
            console.error('Error confirming payment:', confirmError);
            // Payment succeeded but confirmation failed - log for manual reconciliation
            // Don't rollback here as money was charged
            toast({
                title: 'Uyarı',
                description: 'Ödeme alındı ancak rezervasyon güncellenemedi. Lütfen destek ile iletişime geçin.',
                variant: 'destructive',
            });
        }

        toast({
            title: 'Rezervasyon oluşturuldu',
            description: 'Ödeme başarıyla alındı ve rezervasyonunuz onaylandı',
        });

        return {
            success: true,
            bookingId,
            transactionId,
        };
    } catch (error) {
        console.error('Error in createBookingWithPayment:', error);

        // Rollback if we have IDs
        if (bookingId && transactionId) {
            try {
                await rollbackBooking(bookingId, transactionId, 'system_error');
            } catch (rollbackError) {
                console.error('Error during rollback:', rollbackError);
            }
        }

        return {
            success: false,
            error: error instanceof Error ? error.message : 'Bir hata oluştu',
        };
    }
}

/**
 * Rolls back booking and transaction when payment fails
 */
async function rollbackBooking(
    bookingId: string,
    transactionId: string,
    reason: string = 'payment_failed'
): Promise<void> {
    const { error } = await supabase.rpc('rollback_booking_payment' as any, {
        p_booking_id: bookingId,
        p_transaction_id: transactionId,
        p_reason: reason,
    });

    if (error) {
        console.error('Rollback failed:', error);
        throw new Error(`Rollback failed: ${error.message}`);
    }

    console.log('Successfully rolled back booking:', bookingId);
}
