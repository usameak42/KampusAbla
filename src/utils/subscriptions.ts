import { SupabaseClient } from '@supabase/supabase-js';
// import { Database } from '../integrations/supabase/types';
// Defining locally to avoid import issues with generated file
export interface Database {
    public: {
        Tables: {
            subscriptions: {
                Row: {
                    id: string;
                    user_id: string;
                    plan_id: string | null;
                    status: string;
                    features?: any;
                };
                Insert: any;
                Update: any;
            };
            subscription_plans: {
                Row: {
                    id: string;
                    features: any;
                    tier: string;
                    plan_type: string;
                };
                Insert: any;
                Update: any;
            };
            // Minimal definition for utility usage
            [key: string]: any;
        };
        [key: string]: any;
    };
}

// Define specific feature keys based on the seed data
export type FeatureKey =
    | 'booking_limit'
    | 'chat_enabled'
    | 'location_tracking'
    | 'priority_support'
    | 'multiple_children'
    | 'discount'
    | 'commission_rate'
    | 'featured_profile'
    | 'analytics'
    | 'priority_matching'
    | 'instant_payout';

export interface PlanFeatures {
    [key: string]: string | number | boolean | undefined;
    booking_limit?: number; // -1 for unlimited
    chat_enabled?: boolean;
    location_tracking?: boolean;
    priority_support?: boolean;
    multiple_children?: boolean;
    discount?: number;
    commission_rate?: number;
    featured_profile?: boolean;
    analytics?: boolean;
    priority_matching?: boolean;
    instant_payout?: boolean;
}

/**
 * Fetches the active subscription for a user.
 */
export async function getUserSubscription(supabase: SupabaseClient<Database>, userId: string) {
    const { data, error } = await (supabase as any)
        .from('subscriptions')
        .select(`
      *,
      plan:subscription_plans (*)
    `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

    if (error) {
        console.error('Error fetching subscription:', error);
        return null;
    }

    return data as any;
}

/**
 * Checks if a user has access to a specific feature.
 * Returns true if the feature is enabled (true) or present.
 * For numeric limits, use checkLimit instead.
 */
export async function checkFeatureAccess(
    supabase: SupabaseClient<Database>,
    userId: string,
    featureKey: FeatureKey
): Promise<boolean> {
    const subscription = await getUserSubscription(supabase, userId);

    if (!subscription || !subscription.plan) {
        // specific fallback logic for 'free' features can be added here
        // For now, assuming no subscription means only free tier features if we had a default free plan assigned
        // But since RLS usually handles data, this utility checks mostly for *extra* features
        return false;
    }

    const features = subscription.plan.features as PlanFeatures;
    const featureValue = features[featureKey];

    return !!featureValue;
}

/**
 * Checks if a user has exceeded a numeric limit (e.g. booking_limit).
 * Returns true if the action is ALLOWED (limit not reached).
 */
export async function checkLimit(
    supabase: SupabaseClient<Database>,
    userId: string,
    featureKey: 'booking_limit',
    currentCount: number
): Promise<boolean> {
    const subscription = await getUserSubscription(supabase, userId);

    // Default to 0/false if no sub (or implement logic to fetch default free plan)
    // PROPOSAL: Fetch the default 'free' plan if no active subscription is found
    let features: PlanFeatures = {};

    if (!subscription) {
        const { data: freePlan } = await (supabase as any)
            .from('subscription_plans')
            .select('features')
            .eq('tier', 'free')
            .eq('plan_type', 'parent')
            .single();

        if (freePlan) {
            features = freePlan.features as PlanFeatures;
        }
    } else {
        features = subscription.plan!.features as PlanFeatures;
    }

    const limit = features[featureKey];

    if (limit === undefined) return false; // Limit defined implies restriction? Or undefined means 0?
    if (limit === -1) return true; // Unlimited

    return currentCount < limit;
}

/**
 * Gets the commission rate for a sitter based on their plan.
 * Returns the commission percentage (e.g. 15 for 15%).
 */
export async function getSitterCommissionRate(
    supabase: SupabaseClient<Database>,
    sitterId: string
): Promise<number> {
    const subscription = await getUserSubscription(supabase, sitterId);

    // Default config
    const DEFAULT_COMMISSION = 15;

    if (!subscription || !subscription.plan) {
        const { data: freePlan } = await (supabase as any)
            .from('subscription_plans')
            .select('features')
            .eq('tier', 'starter')
            .eq('plan_type', 'sitter')
            .single();

        if (freePlan) {
            const features = freePlan.features as PlanFeatures;
            return features.commission_rate ?? DEFAULT_COMMISSION;
        }
        return DEFAULT_COMMISSION;
    }

    const features = subscription.plan.features as PlanFeatures;
    return features.commission_rate ?? DEFAULT_COMMISSION;
}
