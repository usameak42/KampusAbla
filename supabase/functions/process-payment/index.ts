import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { checkRateLimit, getRateLimitHeaders, RATE_LIMITS } from '../_shared/rate-limit.ts'
import { handleCorsPreflight, createCorsResponse } from '../_shared/cors.ts'

interface PaymentRequest {
    amount: number;
    bookingId: string;
    sitterSubMerchantKey: string;
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
}

async function createIyzicoPayment(apiKey: string, secretKey: string, baseUrl: string, requestBody: Record<string, unknown>): Promise<any> {
    const uri = '/payment/auth';
    const randomStr = crypto.randomUUID().replace(/-/g, '').substring(0, 8);
    const body = JSON.stringify(requestBody);

    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-1', encoder.encode(apiKey + randomStr + secretKey + body));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashBase64 = btoa(String.fromCharCode(...hashArray));

    const response = await fetch(`${baseUrl}${uri}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `IYZWS ${apiKey}:${hashBase64}`,
            'x-iyzi-rnd': randomStr,
        },
        body,
    });

    return response.json();
}

serve(async (req) => {
    const preflightResponse = handleCorsPreflight(req);
    if (preflightResponse) return preflightResponse;

    const origin = req.headers.get('origin');

    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('Missing authorization header')
        }

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        )

        const {
            data: { user },
            error: authError,
        } = await supabaseClient.auth.getUser()

        if (authError || !user) {
            throw new Error('Unauthorized')
        }

        // RATE LIMITING
        const serviceRoleClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const rateLimitResult = await checkRateLimit(serviceRoleClient, {
            identifier: user.id,
            ...RATE_LIMITS.BOOKING_CREATE
        });

        const rateLimitHeaders = getRateLimitHeaders(rateLimitResult, RATE_LIMITS.BOOKING_CREATE);

        if (!rateLimitResult.allowed) {
            console.warn(`Rate limit exceeded for user ${user.id}: ${rateLimitResult.currentCount} requests`);
            return createCorsResponse({
                success: false,
                error: 'Çok fazla rezervasyon talebi. Lütfen daha sonra tekrar deneyin.',
                errorCode: 'RATE_LIMIT_EXCEEDED',
                retryAfter: Math.ceil((rateLimitResult.resetAt.getTime() - Date.now()) / 1000)
            }, 429, { ...rateLimitHeaders }, origin);
        }

        const paymentRequest: PaymentRequest = await req.json()

        const apiKey = Deno.env.get('IYZICO_API_KEY') || '';
        const secretKey = Deno.env.get('IYZICO_SECRET_KEY') || '';
        const baseUrl = Deno.env.get('IYZICO_BASE_URL') || 'https://sandbox-api.iyzipay.com';

        const totalAmount = paymentRequest.amount
        const platformFee = totalAmount * 0.10
        const sitterAmount = totalAmount * 0.90

        const iyzicoRequest = {
            locale: 'tr',
            conversationId: paymentRequest.bookingId,
            price: totalAmount.toFixed(2),
            paidPrice: totalAmount.toFixed(2),
            currency: 'TRY',
            installment: '1',
            basketId: paymentRequest.bookingId,
            paymentChannel: 'WEB',
            paymentGroup: 'PRODUCT',
            paymentCard: paymentRequest.paymentCard,
            buyer: paymentRequest.buyer,
            shippingAddress: {
                contactName: `${paymentRequest.buyer.name} ${paymentRequest.buyer.surname}`,
                city: paymentRequest.buyer.city,
                country: paymentRequest.buyer.country,
                address: paymentRequest.buyer.registrationAddress,
            },
            billingAddress: {
                contactName: `${paymentRequest.buyer.name} ${paymentRequest.buyer.surname}`,
                city: paymentRequest.buyer.city,
                country: paymentRequest.buyer.country,
                address: paymentRequest.buyer.registrationAddress,
            },
            basketItems: [
                {
                    id: 'SESSION_SERVICE',
                    name: 'Öğrenci Kardeş Hizmeti',
                    category1: 'Eğitim',
                    itemType: 'VIRTUAL',
                    price: totalAmount.toFixed(2),
                    subMerchantKey: paymentRequest.sitterSubMerchantKey,
                    subMerchantPrice: sitterAmount.toFixed(2),
                },
            ],
        }

        const paymentResult = await createIyzicoPayment(apiKey, secretKey, baseUrl, iyzicoRequest as unknown as Record<string, unknown>);

        if (paymentResult.status !== 'success') {
            throw new Error(paymentResult.errorMessage || 'Payment failed')
        }

        const { error: dbError } = await supabaseClient.from('transactions').insert({
            booking_id: paymentRequest.bookingId,
            parent_id: user.id,
            amount: totalAmount,
            platform_fee_amount: platformFee,
            sitter_amount: sitterAmount,
            payment_provider: 'iyzico',
            provider_transaction_id: paymentResult.paymentId,
            provider_response: paymentResult,
            status: 'completed',
        })

        if (dbError) {
            console.error('Database error:', dbError)
        }

        return createCorsResponse({
            success: true,
            paymentId: paymentResult.paymentId,
            transactionId: paymentResult.paymentId,
            status: paymentResult.status,
        }, 200, { ...rateLimitHeaders }, origin)
    } catch (error) {
        console.error('Payment processing error:', error)
        return createCorsResponse({
            success: false,
            error: error.message || 'Payment processing failed',
        }, 400, {}, origin)
    }
})
