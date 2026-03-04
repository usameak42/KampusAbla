/**
 * Export User Data - KVKK Article 11 Compliance
 * Supabase Edge Function to export all user personal data
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Create Supabase client with user's JWT
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

        console.log(`Exporting data for user: ${user.id}`);

        // Aggregate all user data
        const userData: Record<string, any> = {
            export_date: new Date().toISOString(),
            user_id: user.id,
            email: user.email,
        };

        // Get user profile
        const { data: userProfile } = await supabaseClient
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        userData.profile = userProfile;

        // Get parent profile (if exists)
        const { data: parentProfile } = await supabaseClient
            .from('parents')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

        if (parentProfile) {
            userData.parent_profile = parentProfile;

            // Get children
            const { data: children } = await supabaseClient
                .from('children')
                .select('*')
                .eq('parent_id', parentProfile.id);

            userData.children = children || [];

            // Get pickup locations
            const { data: pickupLocations } = await supabaseClient
                .from('pickup_locations')
                .select('*')
                .eq('parent_id', parentProfile.id);

            userData.pickup_locations = pickupLocations || [];

            // Get bookings as parent
            const { data: bookingsAsParent } = await supabaseClient
                .from('bookings')
                .select('*')
                .eq('parent_id', parentProfile.id);

            userData.bookings_as_parent = bookingsAsParent || [];

            // Get need posts
            const { data: needPosts } = await supabaseClient
                .from('need_posts')
                .select('*')
                .eq('parent_id', parentProfile.id);

            userData.need_posts = needPosts || [];
        }

        // Get sitter profile (if exists)
        const { data: sitterProfile } = await supabaseClient
            .from('sitters')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

        if (sitterProfile) {
            userData.sitter_profile = sitterProfile;

            // Get bookings as sitter
            const { data: bookingsAsSitter } = await supabaseClient
                .from('bookings')
                .select('*')
                .eq('sitter_id', sitterProfile.id);

            userData.bookings_as_sitter = bookingsAsSitter || [];

            // Get reviews received
            const { data: reviewsReceived } = await supabaseClient
                .from('reviews')
                .select('*')
                .eq('reviewed_id', user.id);

            userData.reviews_received = reviewsReceived || [];

            // Get payouts
            const { data: payouts } = await supabaseClient
                .from('payouts')
                .select('*')
                .eq('sitter_id', sitterProfile.id);

            userData.payouts = payouts || [];
        }

        // Get reviews given
        const { data: reviewsGiven } = await supabaseClient
            .from('reviews')
            .select('*')
            .eq('reviewer_id', user.id);

        userData.reviews_given = reviewsGiven || [];

        // Get messages (both sent and received - via conversations)
        const { data: conversations } = await supabaseClient
            .from('conversations')
            .select('id')
            .or(`parent_id.eq.${parentProfile?.id},sitter_id.eq.${sitterProfile?.id}`);

        if (conversations && conversations.length > 0) {
            const conversationIds = conversations.map((c) => c.id);
            const { data: messages } = await supabaseClient
                .from('messages')
                .select('*')
                .in('conversation_id', conversationIds);

            userData.messages = messages || [];
        }

        // Get notifications
        const { data: notifications } = await supabaseClient
            .from('notifications')
            .select('*')
            .eq('user_id', user.id);

        userData.notifications = notifications || [];

        // Get transactions
        const { data: transactions } = await supabaseClient
            .from('transactions')
            .select('*')
            .eq('user_id', user.id);

        userData.transactions = transactions || [];

        // Get KVKK consents
        const { data: kvkkConsents } = await supabaseClient
            .from('kvkk_consents')
            .select('*')
            .eq('user_id', user.id);

        userData.kvkk_consents = kvkkConsents || [];

        // Get reports (filed by or against user)
        const { data: reports } = await supabaseClient
            .from('reports')
            .select('*')
            .or(`reporter_id.eq.${user.id},reported_id.eq.${user.id}`);

        userData.reports = reports || [];

        // Get favorites (if sitter)
        if (sitterProfile) {
            const { data: favorites } = await supabaseClient
                .from('favorites')
                .select('*')
                .eq('sitter_id', sitterProfile.id);

            userData.favorited_by = favorites || [];
        }

        // Get favorites (if parent)
        if (parentProfile) {
            const { data: favorites } = await supabaseClient
                .from('favorites')
                .select('*')
                .eq('parent_id', parentProfile.id);

            userData.favorite_sitters = favorites || [];
        }

        // Generate JSON export
        const exportData = JSON.stringify(userData, null, 2);

        // In production, you would:
        // 1. Upload to secure storage (Supabase Storage)
        // 2. Send download link via email
        // 3. Auto-delete file after 7 days

        // For now, return the data directly
        return new Response(
            JSON.stringify({
                success: true,
                message: 'Verileriniz başarıyla hazırlandı',
                data: userData,
                size_kb: Math.round(exportData.length / 1024),
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        );
    } catch (error) {
        console.error('Export error:', error);
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        );
    }
});
