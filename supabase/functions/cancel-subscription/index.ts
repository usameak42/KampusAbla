// Supabase Edge Function: cancel-subscription
// Handles subscription cancellation requests

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CancellationPayload {
    subscriptionReferenceCode: string;
    reason?: string;
}

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

        // Get user from auth header
        const authHeader = req.headers.get("Authorization")!;
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
            authHeader.replace("Bearer ", "")
        );

        if (authError || !user) {
            throw new Error("Unauthorized");
        }

        const { subscriptionReferenceCode, reason }: CancellationPayload = await req.json();

        if (!subscriptionReferenceCode) {
            throw new Error("Subscription reference code is required");
        }

        // 1. Verify ownership
        const { data: subscription, error: fetchError } = await supabaseClient
            .from("subscriptions")
            .select("*")
            .eq("external_id", subscriptionReferenceCode)
            .single();

        if (fetchError || !subscription) {
            throw new Error("Subscription not found");
        }

        if (subscription.user_id !== user.id) {
            throw new Error("Unauthorized access to subscription");
        }

        // 2. Integration with Payment Provider (iyzico example)
        const apiKey = Deno.env.get("IYZICO_API_KEY");
        const secretKey = Deno.env.get("IYZICO_SECRET_KEY");
        const baseUrl = Deno.env.get("IYZICO_BASE_URL") || "https://sandbox-api.iyzipay.com";

        console.log(`Cancelling subscription ${subscriptionReferenceCode} for user ${user.id}`);

        if (apiKey && secretKey) {
            // Real Integration Logic (Structure)
            // TODO: Implement actual Iyzico V2 Subscription Cancel API call
            /*
            const requestBody = {
               subscriptionReferenceCode: subscriptionReferenceCode
            };
            // await fetch(`${baseUrl}/v2/subscription/cancel`, ...);
            */
            console.log("Iyzico keys present. Using mock cancellation for now.");
        } else {
            console.log("No Payment Provider keys found. Using Sandbox Mock.");
            await new Promise(r => setTimeout(r, 500));
        }

        // 3. Update Local Subscription Status
        const { error: updateError } = await supabaseClient
            .from("subscriptions")
            .update({
                status: "cancelled",
                auto_renew: false,
                cancel_at_period_end: false // Assuming immediate cancellation for this flow
            })
            .eq("id", subscription.id);

        if (updateError) throw updateError;

        return new Response(
            JSON.stringify({
                success: true,
                message: "Subscription cancelled successfully"
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            }
        );

    } catch (error) {
        console.error("Error cancelling subscription:", error);
        const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
        return new Response(JSON.stringify({ error: errorMessage }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
