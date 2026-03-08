import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCorsPreflight, createCorsResponse } from '../_shared/cors.ts'

interface WebhookEvent {
    iyziEventType: string;
    iyziEventTime: number;
    paymentId?: string;
    iyziReferenceCode?: string;
    status?: string;
    [key: string]: any;
}

/**
 * Verify iyzico webhook signature
 * iyzico sends X-IYZ-Signature header with HMAC-SHA256 signature
 */
async function verifyWebhookSignature(
    payload: string,
    receivedSignature: string | null,
    secretKey: string
): Promise<boolean> {
    if (!receivedSignature) {
        console.warn('No signature provided in webhook request');
        return false;
    }

    try {
        const encoder = new TextEncoder();
        const keyData = encoder.encode(secretKey);
        const key = await crypto.subtle.importKey(
            "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
        );
        const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
        const calculatedSignature = Array.from(new Uint8Array(signature))
            .map(b => b.toString(16).padStart(2, '0')).join('');

        // Constant-time comparison to prevent timing attacks
        return calculatedSignature === receivedSignature;
    } catch (error) {
        console.error('Error verifying webhook signature:', error);
        return false;
    }
}

/**
 * Log webhook event for debugging and audit trail
 */
async function logWebhookEvent(
    supabase: any,
    event: WebhookEvent,
    status: 'received' | 'processed' | 'failed',
    errorMessage?: string
) {
    try {
        await supabase
            .from('audit_logs')
            .insert({
                action: 'payment_webhook',
                user_id: null, // System action
                details: {
                    event_type: event.iyziEventType,
                    payment_id: event.paymentId,
                    status,
                    error: errorMessage,
                    timestamp: new Date().toISOString()
                }
            });
    } catch (error) {
        console.error('Failed to log webhook event:', error);
        // Non-critical, continue processing
    }
}

/**
 * Call send-notification function to notify users
 */
async function sendNotification(
    userId: string,
    title: string,
    body: string,
    type: string
) {
    try {
        const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-notification`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            },
            body: JSON.stringify({
                user_ids: [userId],
                title,
                body,
                notification_type: type
            })
        });

        if (!response.ok) {
            console.error('Failed to send notification:', await response.text());
        }
    } catch (error) {
        console.error('Error calling send-notification function:', error);
        // Non-critical, continue processing
    }
}

serve(async (req) => {
    // Handle CORS preflight
    const preflightResponse = handleCorsPreflight(req);
    if (preflightResponse) return preflightResponse;

    const origin = req.headers.get('origin');

    // Read raw body for signature verification
    const rawBody = await req.text();

    try {
        // Parse webhook event
        const event: WebhookEvent = JSON.parse(rawBody);

        console.log('Received iyzico webhook:', event.iyziEventType);

        // Initialize Supabase client with service role (bypass RLS for webhooks)
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Log webhook received
        await logWebhookEvent(supabaseClient, event, 'received');

        // SECURITY: Verify webhook signature
        const signature = req.headers.get('X-IYZ-Signature');
        const secretKey = Deno.env.get('IYZICO_SECRET_KEY') ?? '';

        const isValid = verifyWebhookSignature(rawBody, signature, secretKey);
        if (!isValid) {
            console.error('Invalid webhook signature - possible unauthorized request');
            await logWebhookEvent(supabaseClient, event, 'failed', 'Invalid signature');

            return createCorsResponse(
                { error: 'Invalid signature' },
                401,
                {},
                origin
            );
        }

        // IDEMPOTENCY: Check if this event was already processed
        const eventId = `${event.iyziEventType}_${event.paymentId}_${event.iyziEventTime}`;
        const { data: existingLog } = await supabaseClient
            .from('audit_logs')
            .select('id')
            .eq('action', 'payment_webhook')
            .contains('details', { event_id: eventId, status: 'processed' })
            .single();

        if (existingLog) {
            console.log('Event already processed, skipping:', eventId);
            return createCorsResponse(
                { received: true, message: 'Already processed' },
                200,
                {},
                origin
            );
        }

        // Handle different event types
        let processingResult;
        switch (event.iyziEventType) {
            case 'PAYMENT_SUCCESS':
                processingResult = await handlePaymentSuccess(supabaseClient, event);
                break;

            case 'PAYMENT_FAILURE':
                processingResult = await handlePaymentFailure(supabaseClient, event);
                break;

            case 'REFUND_SUCCESS':
                processingResult = await handleRefundSuccess(supabaseClient, event);
                break;

            case 'REFUND_FAILURE':
                processingResult = await handleRefundFailure(supabaseClient, event);
                break;

            case 'SUB_MERCHANT_APPROVED':
                processingResult = await handleSubMerchantApproved(supabaseClient, event);
                break;

            case 'SUB_MERCHANT_REJECTED':
                processingResult = await handleSubMerchantRejected(supabaseClient, event);
                break;

            default:
                console.log('Unhandled event type:', event.iyziEventType);
                processingResult = { success: true };
        }

        // Log successful processing with idempotency key
        await supabaseClient
            .from('audit_logs')
            .insert({
                action: 'payment_webhook',
                user_id: null,
                details: {
                    event_id: eventId,
                    event_type: event.iyziEventType,
                    payment_id: event.paymentId,
                    status: 'processed',
                    timestamp: new Date().toISOString()
                }
            });

        return createCorsResponse(
            { received: true, ...processingResult },
            200,
            {},
            origin
        );
    } catch (error) {
        console.error('Webhook processing error:', error);

        // Try to parse event for logging
        try {
            const event = JSON.parse(rawBody);
            const supabaseClient = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            );
            await logWebhookEvent(supabaseClient, event, 'failed', error instanceof Error ? error.message : 'Unknown error');
        } catch (logError) {
            console.error('Failed to log error:', logError);
        }

        return createCorsResponse(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            400,
            {},
            origin
        );
    }
})

async function handlePaymentSuccess(supabase: any, event: WebhookEvent) {
    console.log('Processing payment success:', event.paymentId);

    // Update transaction status
    const { data: updatedTransaction, error: transactionError } = await supabase
        .from('transactions')
        .update({
            status: 'completed',
            provider_response: event,
            updated_at: new Date().toISOString()
        })
        .eq('provider_transaction_id', event.paymentId)
        .select()
        .single();

    if (transactionError) {
        console.error('Error updating transaction:', transactionError);
        throw transactionError;
    }

    if (!updatedTransaction) {
        console.warn('Transaction not found for payment ID:', event.paymentId);
        return { success: false, message: 'Transaction not found' };
    }

    // Update booking status if applicable
    if (updatedTransaction.booking_id) {
        const { error: bookingError } = await supabase
            .from('bookings')
            .update({
                status: 'confirmed',
                payment_status: 'paid',
                updated_at: new Date().toISOString()
            })
            .eq('id', updatedTransaction.booking_id);

        if (bookingError) {
            console.error('Error updating booking:', bookingError);
        }

        // Get parent user_id to send notification
        const { data: booking } = await supabase
            .from('bookings')
            .select('parent_id, parents(user_id, full_name)')
            .eq('id', updatedTransaction.booking_id)
            .single();

        if (booking?.parents?.user_id) {
            // Send notification to parent
            await sendNotification(
                booking.parents.user_id,
                'Ödeme Başarılı',
                'Rezervasyonunuz için ödemeniz başarıyla alındı. Rezervasyonunuz onaylandı.',
                'booking_confirmations'
            );

            // Also create in-app notification
            await supabase
                .from('notifications')
                .insert({
                    user_id: booking.parents.user_id,
                    type: 'booking_confirmation',
                    title: 'Ödeme Başarılı',
                    message: 'Rezervasyonunuz için ödemeniz başarıyla alındı.',
                    data: { booking_id: updatedTransaction.booking_id }
                });
        }
    }

    console.log('Payment success handled:', event.paymentId);
    return { success: true };
}

async function handlePaymentFailure(supabase: any, event: WebhookEvent) {
    console.log('Processing payment failure:', event.paymentId);

    const { data: updatedTransaction, error } = await supabase
        .from('transactions')
        .update({
            status: 'failed',
            provider_response: event,
            updated_at: new Date().toISOString()
        })
        .eq('provider_transaction_id', event.paymentId)
        .select()
        .single();

    if (error) {
        console.error('Error updating transaction:', error);
        throw error;
    }

    // Update associated booking
    if (updatedTransaction?.booking_id) {
        await supabase
            .from('bookings')
            .update({
                status: 'payment_failed',
                payment_status: 'failed',
                updated_at: new Date().toISOString()
            })
            .eq('id', updatedTransaction.booking_id);

        // Get parent user_id to send notification
        const { data: booking } = await supabase
            .from('bookings')
            .select('parent_id, parents(user_id)')
            .eq('id', updatedTransaction.booking_id)
            .single();

        if (booking?.parents?.user_id) {
            await sendNotification(
                booking.parents.user_id,
                'Ödeme Başarısız',
                'Rezervasyonunuz için ödeme işlemi başarısız oldu. Lütfen tekrar deneyin.',
                'booking_confirmations'
            );

            await supabase
                .from('notifications')
                .insert({
                    user_id: booking.parents.user_id,
                    type: 'payment_failed',
                    title: 'Ödeme Başarısız',
                    message: 'Ödeme işlemi başarısız oldu. Lütfen ödeme bilgilerinizi kontrol edip tekrar deneyin.',
                    data: { booking_id: updatedTransaction.booking_id }
                });
        }
    }

    console.log('Payment failure handled:', event.paymentId);
    return { success: true };
}

async function handleRefundSuccess(supabase: any, event: WebhookEvent) {
    console.log('Processing refund success:', event.paymentId);

    const { error } = await supabase
        .from('refunds')
        .update({
            status: 'completed',
            provider_response: event,
            updated_at: new Date().toISOString()
        })
        .eq('provider_refund_id', event.paymentId);

    if (error) {
        console.error('Error updating refund:', error);
        throw error;
    }

    console.log('Refund success handled:', event.paymentId);
    return { success: true };
}

async function handleRefundFailure(supabase: any, event: WebhookEvent) {
    console.log('Processing refund failure:', event.paymentId);

    const { error } = await supabase
        .from('refunds')
        .update({
            status: 'failed',
            provider_response: event,
            updated_at: new Date().toISOString()
        })
        .eq('provider_refund_id', event.paymentId);

    if (error) {
        console.error('Error updating refund:', error);
        throw error;
    }

    console.log('Refund failure handled:', event.paymentId);
    return { success: true };
}

async function handleSubMerchantApproved(supabase: any, event: WebhookEvent) {
    console.log('Processing sub-merchant approval:', event.iyziReferenceCode);

    // Update sitter's sub-merchant status
    const { error } = await supabase
        .from('sitters')
        .update({
            sub_merchant_status: 'approved',
            updated_at: new Date().toISOString()
        })
        .eq('sub_merchant_key', event.iyziReferenceCode);

    if (error) {
        console.error('Error updating sitter:', error);
        throw error;
    }

    console.log('Sub-merchant approved:', event.iyziReferenceCode);
    return { success: true };
}

async function handleSubMerchantRejected(supabase: any, event: WebhookEvent) {
    console.log('Processing sub-merchant rejection:', event.iyziReferenceCode);

    const { error } = await supabase
        .from('sitters')
        .update({
            sub_merchant_status: 'rejected',
            sub_merchant_rejection_reason: event.errorMessage,
            updated_at: new Date().toISOString()
        })
        .eq('sub_merchant_key', event.iyziReferenceCode);

    if (error) {
        console.error('Error updating sitter:', error);
        throw error;
    }

    console.log('Sub-merchant rejected:', event.iyziReferenceCode);
    return { success: true };
}
