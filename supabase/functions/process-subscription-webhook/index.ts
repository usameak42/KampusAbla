// Supabase Edge Function: process-subscription-webhook
// Handles asynchronous updates from the payment provider

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // 1. Verify Webhook Signature (Provider specific)
        // const signature = req.headers.get('X-Iyzico-Signature');
        // ... verify ...

        const body = await req.json();
        console.log("Received webhook payload:", body);

        // Hypothetical payload structure
        const { event, userId, planId, externalId, price, status } = body;

        if (event === "subscription.success") {
            // 2. Update Subscription Record
            const { error: subError } = await supabaseClient
                .from("subscriptions")
                .upsert({
                    user_id: userId,
                    plan_id: planId,
                    external_id: externalId,
                    status: "active",
                    current_period_start: new Date().toISOString(),
                    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 days example
                    auto_renew: true,
                });

            if (subError) throw subError;

            // 2b. Deactivate any other active subscriptions for this user (Upgrade/Downgrade logic)
            // We want to ensure only ONE active subscription per user.
            // Ideally we do this in a transaction or slightly before upsert, but after is fine if we exclude the one we just upserted/inserted.
            // However, finding the ID of the just-upserted row is tricky without returning it.
            // Let's assume we do a fetch first or update others.

            // Safer approach: Deactivate all *other* active subscriptions for this user
            // We can match by user_id and NOT external_id (assuming external_id is unique per sub)
            const { error: deactivateError } = await supabaseClient
                .from("subscriptions")
                .update({ status: 'cancelled', auto_renew: false, cancelled_at: new Date().toISOString() })
                .eq('user_id', userId)
                .eq('status', 'active')
                .neq('external_id', externalId);

            if (deactivateError) console.error("Error deactivating old subscriptions:", deactivateError);

            // 3. Record Billing History
            const { error: historyError } = await supabaseClient
                .from("billing_history")
                .insert({
                    user_id: userId,
                    amount: price,
                    description: `Plan Upgrade / Renewal - ${planId}`,
                    status: "paid",
                    external_transaction_id: externalId,
                });

            if (historyError) throw historyError;
        } else if (event === "subscription.cancelled") {
            // 2. Handle Cancellation
            const { error: subError } = await supabaseClient
                .from("subscriptions")
                .update({
                    status: "cancelled",
                    cancel_at_period_end: false, // Immediate cancellation if specified, or update based on provider logic
                    auto_renew: false
                })
                .eq("external_id", externalId);

            if (subError) throw subError;

        } else if (event === "payment.failed") {
            // 3. Handle Payment Failure
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
                    user_id: userId,
                    amount: price,
                    description: `Payment Failed - ${planId}`,
                    status: "failed",
                    external_transaction_id: externalId,
                });
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        console.error("Error processing webhook:", error);
        const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
        return new Response(JSON.stringify({ error: errorMessage }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
