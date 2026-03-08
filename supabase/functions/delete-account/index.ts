/**
 * Delete Account - KVKK Article 7 Compliance
 * Supabase Edge Function to handle account deletion requests
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCorsPreflight, createCorsResponse } from '../_shared/cors.ts';

serve(async (req) => {
    // Handle CORS preflight
    const preflightResponse = handleCorsPreflight(req);
    if (preflightResponse) return preflightResponse;

    const origin = req.headers.get('origin');

    try {
        // Create Supabase client with service role for admin operations
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        );

        // Create client with user's JWT for authentication
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: req.headers.get('Authorization')! },
                },
            }
        );

        // Get authenticated user
        const {
            data: { user },
            error: authError,
        } = await supabaseClient.auth.getUser();

        if (authError || !user) {
            throw new Error('Unauthorized');
        }

        const { action, reason } = await req.json();

        if (action === 'request') {
            // Create deletion request with 30-day grace period
            const scheduledDate = new Date();
            scheduledDate.setDate(scheduledDate.getDate() + 30);

            const { error: insertError } = await supabaseClient
                .from('account_deletion_requests')
                .insert({
                    user_id: user.id,
                    scheduled_deletion_date: scheduledDate.toISOString(),
                    reason: reason || null,
                    status: 'pending',
                });

            if (insertError) throw insertError;

            // Log the deletion request
            await supabaseAdmin.from('data_access_logs').insert({
                user_id: user.id,
                action: 'account_deletion_requested',
                metadata: {
                    scheduled_date: scheduledDate.toISOString(),
                    reason: reason || null,
                },
            });

            return createCorsResponse({
                success: true,
                message: 'Hesap silme talebi oluşturuldu',
                scheduled_date: scheduledDate.toISOString(),
            }, 200, {}, origin);
        } else if (action === 'cancel') {
            // Cancel pending deletion request
            const { error: updateError } = await supabaseClient
                .from('account_deletion_requests')
                .update({
                    status: 'cancelled',
                    cancelled_at: new Date().toISOString(),
                })
                .eq('user_id', user.id)
                .eq('status', 'pending');

            if (updateError) throw updateError;

            // Log the cancellation
            await supabaseAdmin.from('data_access_logs').insert({
                user_id: user.id,
                action: 'account_deletion_cancelled',
            });

            return createCorsResponse({
                success: true,
                message: 'Hesap silme talebi iptal edildi',
            }, 200, {}, origin);
        } else if (action === 'execute') {
            // Execute immediate deletion (requires confirmation)
            // This should only be called after the 30-day grace period

            // Call the anonymization function
            const { error: anonymizeError } = await supabaseAdmin.rpc(
                'anonymize_user_account',
                { target_user_id: user.id }
            );

            if (anonymizeError) throw anonymizeError;

            // Mark deletion request as completed
            await supabaseClient
                .from('account_deletion_requests')
                .update({
                    status: 'completed',
                    completed_at: new Date().toISOString(),
                })
                .eq('user_id', user.id)
                .eq('status', 'pending');

            // Log out the user
            await supabaseClient.auth.signOut();

            return createCorsResponse({
                success: true,
                message: 'Hesap başarıyla silindi',
            }, 200, {}, origin);
        }

        throw new Error('Invalid action');
    } catch (error) {
        console.error('Account deletion error:', error);
        return createCorsResponse({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        }, 400, {}, origin);
    }
});
