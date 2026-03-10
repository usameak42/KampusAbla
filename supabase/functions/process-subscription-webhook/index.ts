// Supabase Edge Function: process-subscription-webhook
// Handles asynchronous updates from the payment provider

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { handleCorsPreflight, createCorsResponse } from '../_shared/cors.ts';

/**
 * Verify webhook signature using HMAC-SHA256
 */
async function verifyWebhookSignature(
    payload: string,
    receivedSignature: string | null,
    secretKey: string
): Promise<boolean> {
    if (!receivedSignature || !secretKey) {
        console.warn('Missing signature or secret key');
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

        // Timing-safe comparison
        const a = encoder.encode(calculatedSignature);
        const b = encoder.encode(receivedSignature);
        if (a.byteLength !== b.byteLength) return false;
        const cmpKey = await crypto.subtle.importKey(
            "raw", a, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
        );
        const sig1 = new Uint8Array(await crypto.subtle.sign("HMAC", cmpKey, b));
        const sig2 = new Uint8Array(await crypto.subtle.sign("HMAC", cmpKey, a));
        return sig1.every((val, i) => val === sig2[i]);
    } catch (error) {
        console.error('Error verifying webhook signature:', error);
        return false;
    }
}

serve(async (req) => {
    // Handle CORS preflight
    const preflightResponse = handleCorsPreflight(req);
    if (preflightResponse) return preflightResponse;

    const origin = req.headers.get('origin');

    try {
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // Read raw body for signature verification
        const rawBody = await req.text();

        // SECURITY: Verify webhook signature
        const signature = req.headers.get('X-IYZ-Signature') || req.headers.get('x-webhook-signature');
        const secretKey = Deno.env.get('IYZICO_SECRET_KEY') ?? '';

        const isValid = await verifyWebhookSignature(rawBody, signature, secretKey);
        if (!isValid) {
            console.error('Invalid webhook signature - rejecting request');
            return createCorsResponse(
                { error: 'Invalid signature' },
                401,
                {},
                origin
            );
        }

        const body = JSON.parse(rawBody);
        console.log("Received webhook event:", body.event);

        const { event, planId, externalId, price, status } = body;

        // SECURITY: Never trust userId from webhook body.
        // Resolve user from existing subscription record via externalId.
        let resolvedUserId: string | null = null;

        if (event !== "subscription.success") {
            // For non-creation events, look up existing subscription
            const { data: existingSub } = await supabaseClient
                .from("subscriptions")
                .select("user_id")
                .eq("external_id", externalId)
                .single();

            if (!existingSub) {
                console.error("No subscription found for external_id:", externalId);
                return createCorsResponse(
                    { error: "Subscription not found" },
                    404,
                    {},
                    origin
                );
            }
            resolvedUserId = existingSub.user_id;
        } else {
            // For subscription.success, we need the userId but validate it exists
            const userId = body.userId;
            if (!userId) {
                return createCorsResponse(
                    { error: "Missing userId for new subscription" },
                    400,
                    {},
                    origin
                );
            }
            resolvedUserId = userId;
        }

        if (!resolvedUserId) {
            return createCorsResponse(
                { error: "Could not resolve user" },
                400,
                {},
                origin
            );
        }

        if (event === "subscription.success") {
            const { error: subError } = await supabaseClient
                .from("subscriptions")
                .upsert({
                    user_id: resolvedUserId,
                    plan_id: planId,
                    external_id: externalId,
                    status: "active",
                    current_period_start: new Date().toISOString(),
                    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    auto_renew: true,
                });

            if (subError) throw subError;

            // Deactivate other active subscriptions for this user
            const { error: deactivateError } = await supabaseClient
                .from("subscriptions")
                .update({ status: 'cancelled', auto_renew: false, cancelled_at: new Date().toISOString() })
                .eq('user_id', resolvedUserId)
                .eq('status', 'active')
                .neq('external_id', externalId);

            if (deactivateError) console.error("Error deactivating old subscriptions:", deactivateError);

            // Record billing history
            const { error: historyError } = await supabaseClient
                .from("billing_history")
                .insert({
                    user_id: resolvedUserId,
                    amount: price,
                    description: `Plan Upgrade / Renewal - ${planId}`,
                    status: "paid",
                    external_transaction_id: externalId,
                });

            if (historyError) throw historyError;
        } else if (event === "subscription.cancelled") {
            const { error: subError } = await supabaseClient
                .from("subscriptions")
                .update({
                    status: "cancelled",
                    cancel_at_period_end: false,
                    auto_renew: false
                })
                .eq("external_id", externalId);

            if (subError) throw subError;

        } else if (event === "payment.failed") {
            const { error: subError } = await supabaseClient
                .from("subscriptions")
                .update({
                    status: "past_due"
                })
                .eq("external_id", externalId);

            if (subError) throw subError;

            // Record failed transaction
            await supabaseClient
                .from("billing_history")
                .insert({
                    user_id: resolvedUserId,
                    amount: price,
                    description: `Payment Failed - ${planId}`,
                    status: "failed",
                    external_transaction_id: externalId,
                });
        }

        return createCorsResponse(
            { success: true },
            200,
            {},
            origin
        );

    } catch (error) {
        console.error("Error processing webhook:", error);
        return createCorsResponse(
            { error: "Internal server error" },
            500,
            {},
            origin
        );
    }
});
