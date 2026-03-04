// Supabase Edge Function: send-push-notification
// Implements Firebase Cloud Messaging (FCM) using HTTP v1 API

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationPayload {
    userId: string;
    title: string;
    body: string;
    data?: Record<string, string>;
}

interface ServiceAccount {
    project_id: string;
    private_key: string;
    client_email: string;
}

/**
 * Generate a JWT for Firebase authentication
 */
async function generateFirebaseJWT(serviceAccount: ServiceAccount): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: "RS256", typ: "JWT" };
    const payload = {
        iss: serviceAccount.client_email,
        sub: serviceAccount.client_email,
        aud: "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600,
        scope: "https://www.googleapis.com/auth/firebase.messaging",
    };

    const encoder = new TextEncoder();
    const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    const signatureInput = `${headerB64}.${payloadB64}`;

    // Import the private key
    const pemContents = serviceAccount.private_key
        .replace(/-----BEGIN PRIVATE KEY-----/, "")
        .replace(/-----END PRIVATE KEY-----/, "")
        .replace(/\n/g, "");
    const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

    const cryptoKey = await crypto.subtle.importKey(
        "pkcs8",
        binaryKey,
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        false,
        ["sign"]
    );

    const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, encoder.encode(signatureInput));
    const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");

    return `${signatureInput}.${signatureB64}`;
}

/**
 * Get OAuth2 access token from Firebase
 */
async function getAccessToken(serviceAccount: ServiceAccount): Promise<string> {
    const jwt = await generateFirebaseJWT(serviceAccount);

    const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion: jwt,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get access token: ${error}`);
    }

    const data = await response.json();
    return data.access_token;
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const serviceAccountJson = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
        if (!serviceAccountJson) {
            console.log("Firebase not configured, skipping push notification");
            return new Response(
                JSON.stringify({ success: true, message: "Firebase not configured" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
            );
        }

        const serviceAccount: ServiceAccount = JSON.parse(serviceAccountJson);

        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const payload: NotificationPayload = await req.json();
        const { userId, title, body, data } = payload;

        if (!userId) {
            throw new Error("userId is required");
        }

        // 1. Fetch user's FCM tokens (table may not exist yet)
        const { data: tokens, error: tokenError } = await supabaseClient
            .from("user_fcm_tokens")
            .select("token")
            .eq("user_id", userId);

        // If table doesn't exist or no tokens, return success
        if (tokenError || !tokens || tokens.length === 0) {
            console.log(`No FCM tokens found for user ${userId}`);
            return new Response(
                JSON.stringify({ success: true, message: "No tokens found" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
            );
        }

        // 2. Get access token for Firebase
        const accessToken = await getAccessToken(serviceAccount);

        // 3. Send notifications to each token
        const results = await Promise.all(
            tokens.map(async ({ token }) => {
                const message = {
                    message: {
                        token,
                        notification: { title, body },
                        data: data || {},
                    },
                };

                const response = await fetch(
                    `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`,
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(message),
                    }
                );

                return { token, success: response.ok, status: response.status };
            })
        );

        // 4. Cleanup invalid tokens
        const failedTokens = results
            .filter((r) => !r.success && (r.status === 404 || r.status === 400))
            .map((r) => r.token);

        if (failedTokens.length > 0) {
            await supabaseClient
                .from("user_fcm_tokens")
                .delete()
                .in("token", failedTokens);
        }

        const successCount = results.filter((r) => r.success).length;

        return new Response(
            JSON.stringify({ success: true, sent: successCount, failed: results.length - successCount }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
    } catch (error) {
        console.error("Error sending notification:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return new Response(
            JSON.stringify({ error: errorMessage }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
    }
});
