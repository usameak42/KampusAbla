import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Firebase Admin SDK for Deno
import * as firebaseAdmin from 'npm:firebase-admin@12.0.0';
import { handleCorsPreflight, createCorsResponse } from '../_shared/cors.ts';

/**
 * Send Push Notification Edge Function
 * 
 * Sends FCM push notifications to specified users based on their preferences
 * Called by database triggers or application code
 */

interface NotificationRequest {
    user_ids: string[];
    title: string;
    body: string;
    data?: Record<string, string>;
    notification_type: 'booking_requests' | 'booking_confirmations' | 'booking_cancellations'
    | 'messages' | 'session_updates' | 'reviews' | 'marketing';
}

// Initialize Firebase Admin SDK (once)
let firebaseApp: firebaseAdmin.app.App | null = null;

function initializeFirebase() {
    if (firebaseApp) return firebaseApp;

    try {
        const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
        if (!serviceAccountJson) {
            throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable not set');
        }

        const serviceAccount = JSON.parse(serviceAccountJson);

        firebaseApp = firebaseAdmin.initializeApp({
            credential: firebaseAdmin.credential.cert(serviceAccount),
        });

        console.log('Firebase Admin SDK initialized successfully');
        return firebaseApp;
    } catch (error) {
        console.error('Failed to initialize Firebase Admin SDK:', error);
        throw error;
    }
}

serve(async (req) => {
    // Handle CORS preflight
    const preflightResponse = handleCorsPreflight(req);
    if (preflightResponse) return preflightResponse;

    const origin = req.headers.get('origin');

    try {
        // Parse request body
        const { user_ids, title, body, data, notification_type }: NotificationRequest = await req.json();

        // Validate required fields
        if (!user_ids || user_ids.length === 0) {
            return createCorsResponse(
                { error: 'user_ids is required and must not be empty' },
                400,
                {},
                origin
            );
        }

        if (!title || !body) {
            return createCorsResponse(
                { error: 'title and body are required' },
                400,
                {},
                origin
            );
        }

        if (!notification_type) {
            return createCorsResponse(
                { error: 'notification_type is required' },
                400,
                {},
                origin
            );
        }

        // Initialize Firebase
        initializeFirebase();

        // Create Supabase Admin client
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            }
        );

        // Step 1: Get FCM tokens for users
        const { data: tokens, error: tokensError } = await supabaseAdmin
            .from('user_fcm_tokens')
            .select('token, user_id')
            .in('user_id', user_ids);

        if (tokensError) {
            console.error('Error fetching FCM tokens:', tokensError);
            throw tokensError;
        }

        if (!tokens || tokens.length === 0) {
            console.log('No FCM tokens found for specified users');
            return createCorsResponse({
                message: 'No FCM tokens found',
                success: 0,
                failures: 0
            }, 200, {}, origin);
        }

        // Step 2: Check notification preferences
        const { data: preferences, error: preferencesError } = await supabaseAdmin
            .from('notification_preferences')
            .select('*')
            .in('user_id', user_ids);

        if (preferencesError) {
            console.error('Error fetching notification preferences:', preferencesError);
            // Continue anyway - default to allowing notifications
        }

        // Step 3: Filter tokens based on preferences
        const allowedTokens = tokens.filter((tokenRow) => {
            const userPref = preferences?.find((p) => p.user_id === tokenRow.user_id);
            if (!userPref) return true; // Default: allow if no preferences set

            // Check if this notification type is enabled for the user
            const isEnabled = userPref[notification_type];
            return isEnabled !== false;
        });

        if (allowedTokens.length === 0) {
            console.log('All users have disabled this notification type');
            return createCorsResponse({
                message: 'All users have disabled this notification type',
                success: 0,
                failures: 0
            }, 200, {}, origin);
        }

        // Step 4: Send notifications via FCM
        const messaging = firebaseAdmin.messaging();
        const messages = allowedTokens.map((tokenRow) => ({
            token: tokenRow.token,
            notification: {
                title,
                body,
            },
            data: data || {},
            android: {
                priority: 'high' as const,
            },
            apns: {
                headers: {
                    'apns-priority': '10',
                },
            },
        }));

        const response = await messaging.sendEach(messages);

        // Step 5: Log failures and update token usage
        const failures: Array<{ token: string; error: string }> = [];
        const successfulTokens: string[] = [];

        response.responses.forEach((resp, idx) => {
            if (resp.success) {
                successfulTokens.push(allowedTokens[idx].token);
            } else {
                failures.push({
                    token: allowedTokens[idx].token,
                    error: resp.error?.message || 'Unknown error',
                });
            }
        });

        if (failures.length > 0) {
            console.error('Some notifications failed to send:', failures);

            // Delete invalid tokens
            const invalidTokens = failures
                .filter(f => f.error.includes('invalid') || f.error.includes('not-registered'))
                .map(f => f.token);

            if (invalidTokens.length > 0) {
                await supabaseAdmin
                    .from('user_fcm_tokens')
                    .delete()
                    .in('token', invalidTokens);
                console.log(`Deleted ${invalidTokens.length} invalid tokens`);
            }
        }

        // Step 6: Update last_used_at for successful deliveries
        if (successfulTokens.length > 0) {
            await supabaseAdmin
                .from('user_fcm_tokens')
                .update({ last_used_at: new Date().toISOString() })
                .in('token', successfulTokens);
        }

        // Return results
        return createCorsResponse({
            success: response.successCount,
            failures: response.failureCount,
            details: failures.length > 0 ? failures : undefined,
        }, 200, {}, origin);

    } catch (error) {
        console.error('Error in send-notification function:', error);
        return createCorsResponse({
            error: error instanceof Error ? error.message : 'Internal server error'
        }, 500, {}, origin);
    }
});
