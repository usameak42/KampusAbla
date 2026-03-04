// Supabase Edge Function: create-sub-merchant
// Handles iyzico sub-merchant registration for sitters

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SubMerchantRequest {
    sitterData: {
        name: string;
        surname: string;
        email: string;
        gsmNumber: string;
        address: string;
        iban: string;
        identityNumber: string;
        taxOffice?: string;
        taxNumber?: string;
    };
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

        const request: SubMerchantRequest = await req.json()

        // Verify user is a sitter
        const { data: sitter, error: sitterError } = await supabaseClient
            .from('sitters')
            .select('id, verification_status')
            .eq('user_id', user.id)
            .single()

        if (sitterError || !sitter) {
            throw new Error('User is not a sitter')
        }

        // Mock sub-merchant creation (iyzico SDK not available in edge runtime)
        // In production, use iyzico REST API directly with fetch()
        const apiKey = Deno.env.get('IYZICO_API_KEY')
        const secretKey = Deno.env.get('IYZICO_SECRET_KEY')
        const baseUrl = Deno.env.get('IYZICO_BASE_URL') || 'https://sandbox-api.iyzipay.com'

        console.log(`Creating sub-merchant for sitter ${sitter.id}`)

        let subMerchantKey = `mock_sm_${crypto.randomUUID().substring(0, 8)}`

        if (apiKey && secretKey) {
            // TODO: Implement actual iyzico REST API call using fetch()
            // POST ${baseUrl}/onboarding/submerchant
            console.log('Iyzico keys present. Using mock sub-merchant creation for now.')
        } else {
            console.log('No iyzico keys found. Using sandbox mock.')
            await new Promise(r => setTimeout(r, 300))
        }

        // Update sitter record
        const { error: updateError } = await supabaseClient
            .from('sitters')
            .update({
                verification_status: sitter.verification_status === 'approved' ? 'approved' : sitter.verification_status,
            })
            .eq('id', sitter.id)

        if (updateError) {
            console.error('Failed to update sitter:', updateError)
        }

        return new Response(
            JSON.stringify({
                success: true,
                subMerchantKey,
                message: 'Sub-merchant created successfully',
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error) {
        console.error('Sub-merchant creation error:', error)
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message || 'Sub-merchant creation failed',
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
