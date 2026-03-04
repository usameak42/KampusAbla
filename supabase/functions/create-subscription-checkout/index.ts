// Supabase Edge Function: create-subscription-checkout
// Initiates a subscription checkout flow (e.g., with iyzico or Stripe)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckoutPayload {
    planId: string;
    billingCycle: "monthly" | "yearly";
    successUrl: string;
    cancelUrl: string;
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

        const { planId, billingCycle, successUrl, cancelUrl }: CheckoutPayload = await req.json();

        // 1. Fetch Plan Details
        const { data: plan, error: planError } = await supabaseClient
            .from("subscription_plans")
            .select("*")
            .eq("id", planId)
            .single();

        if (planError || !plan) {
            throw new Error("Plan not found");
        }

        // 2. Integration with Payment Provider (iyzico example)
        const apiKey = Deno.env.get("IYZICO_API_KEY");
        const secretKey = Deno.env.get("IYZICO_SECRET_KEY");
        const baseUrl = Deno.env.get("IYZICO_BASE_URL") || "https://sandbox-api.iyzipay.com";

        console.log(`Initiating checkout for user ${user.id} on plan ${plan.name} (${billingCycle})`);

        let checkoutUrl = `${successUrl}?status=success`;
        const providerSessionId = `mock_${Math.random().toString(36).substring(7)}`;

        if (apiKey && secretKey) {
            // Real Integration Logic (Structure)
            // TODO: Implement actual Iyzico V2 Subscription API call

            // Derive plan code based on cycle (e.g. PREMIUM_MONTHLY vs PREMIUM_YEARLY)
            const planCode = plan.external_plan_id
                ? `${plan.external_plan_id}_${billingCycle.toUpperCase()}`
                : "DEFAULT";

            /*
            const requestBody = {
                locale: "tr",
                conversationId: crypto.randomUUID(),
                pricingPlanReferenceCode: planCode,
                subscriptionInitialStatus: "ACTIVE",
                customer: {
                    name: user.user_metadata?.full_name || "Guest",
                    email: user.email,
                    gsmNumber: user.phone
                }
            };
            
            // await fetch(`${baseUrl}/v2/subscription/initialize`,Result...);
            */
            console.log(`Prepared recurring checkout for plan: ${planCode}`);
            console.log("Iyzico keys present, but specialized SDK/Auth implementation required. Using mock for now.");
        } else {
            console.log("No Payment Provider keys found. Using Sandbox Mock.");
            // Simulate network delay
            await new Promise(r => setTimeout(r, 500));
        }

        // Append session ID to success URL for verification
        checkoutUrl = `${successUrl}${successUrl.includes('?') ? '&' : '?'}session_id=${providerSessionId}`;

        // 3. Return the checkout URL
        return new Response(
            JSON.stringify({
                success: true,
                checkoutUrl: checkoutUrl,
                providerSessionId: providerSessionId
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            }
        );

    } catch (error) {
        console.error("Error creating checkout session:", error);
        const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
        return new Response(JSON.stringify({ error: errorMessage }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
