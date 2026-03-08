import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RefundRequest {
    transactionId: string;
    amount: number;
    reason?: string;
}

async function createIyzicoRefund(apiKey: string, secretKey: string, baseUrl: string, request: {
    locale: string;
    conversationId: string;
    paymentTransactionId: string;
    price: string;
    currency: string;
    ip: string;
}): Promise<any> {
    // Build authorization header for iyzico REST API
    const uri = '/payment/refund';
    const now = Math.floor(Date.now() / 1000).toString();
    const randomStr = crypto.randomUUID().replace(/-/g, '').substring(0, 8);

    const body = JSON.stringify(request);

    // Generate iyzico authorization hash
    const hashStr = apiKey + randomStr + secretKey + body;
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-1', encoder.encode(hashStr));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashBase64 = btoa(String.fromCharCode(...hashArray));

    const authorizationHeader = `IYZWS ${apiKey}:${hashBase64}`;

    const response = await fetch(`${baseUrl}${uri}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authorizationHeader,
            'x-iyzi-rnd': randomStr,
        },
        body,
    });

    return response.json();
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
    }

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

        const request: RefundRequest = await req.json()

        // Fetch original transaction
        const { data: transaction, error: txError } = await supabaseClient
            .from('transactions')
            .select('*, booking_id, provider_transaction_id')
            .eq('id', request.transactionId)
            .single()

        if (txError || !transaction) {
            throw new Error('Transaction not found')
        }

        // Verify user is authorized (parent who made the payment)
        if (transaction.parent_id !== user.id) {
            throw new Error('Unauthorized to refund this transaction')
        }

        const apiKey = Deno.env.get('IYZICO_API_KEY') || '';
        const secretKey = Deno.env.get('IYZICO_SECRET_KEY') || '';
        const baseUrl = Deno.env.get('IYZICO_BASE_URL') || 'https://sandbox-api.iyzipay.com';

        const refundResult = await createIyzicoRefund(apiKey, secretKey, baseUrl, {
            locale: 'tr',
            conversationId: transaction.booking_id,
            paymentTransactionId: transaction.provider_transaction_id,
            price: request.amount.toFixed(2),
            currency: 'TRY',
            ip: '85.34.78.112',
        });

        if (refundResult.status !== 'success') {
            throw new Error(refundResult.errorMessage || 'Refund failed')
        }

        // Record refund in database
        const { error: dbError } = await supabaseClient.from('refunds').insert({
            transaction_id: transaction.id,
            amount: request.amount,
            reason: request.reason || 'booking_cancelled',
            status: 'completed',
        })

        if (dbError) {
            console.error('Database error:', dbError)
        }

        // Update transaction status
        await supabaseClient
            .from('transactions')
            .update({ status: 'refunded' })
            .eq('id', transaction.id)

        return new Response(
            JSON.stringify({
                success: true,
                refundId: refundResult.paymentTransactionId,
                status: refundResult.status,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error) {
        console.error('Refund processing error:', error)
        return new Response(
            JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Refund processing failed',
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
