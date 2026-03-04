/**
 * useSubscription Hook - Manages user subscription
 */

import { useState, useCallback } from "react";
import type {
    UserSubscription,
    BillingHistoryEntry,
    SubscriptionPlan,
    BillingCycle,
    PlanTier,
} from "@/types/subscription";
import { getPlansByRole, getPlanById } from "@/types/subscription";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";




interface UseSubscriptionOptions {
    userId: string;
    role: "parent" | "sitter";
}

export function useSubscription({ userId, role }: UseSubscriptionOptions) {
    const queryClient = useQueryClient();

    // 1. Fetch current subscription
    const {
        data: subscription,
        isLoading: isSubscriptionLoading,
        error: subscriptionError
    } = useQuery({
        queryKey: ["subscription", userId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("subscriptions")
                .select("*")
                .eq("user_id", userId)
                .maybeSingle();

            if (error) throw error;
            if (!data) return null;

            const plan = getPlanById(data.plan_id);

            return {
                id: data.id,
                userId: data.user_id,
                planId: data.plan_id,
                tier: (plan?.tier || "free") as PlanTier,
                status: data.status as any,
                billingCycle: "monthly", // Defaulting as DB doesn't store this directly yet
                currentPeriodStart: data.started_at ? new Date(data.started_at) : new Date(),
                currentPeriodEnd: data.expires_at ? new Date(data.expires_at) : new Date(),
                cancelAtPeriodEnd: data.auto_renew === false,
            } as UserSubscription;
        },
    });

    // 2. Billing history (mock - table doesn't exist yet)
    const billingHistory: BillingHistoryEntry[] = [];
    const isHistoryLoading = false;

    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);

    const isLoading = isSubscriptionLoading || isHistoryLoading || checkoutLoading;
    const error = subscriptionError ? (subscriptionError as Error).message : actionError;


    // Get available plans
    const plans = getPlansByRole(role);

    // Get current plan details
    const currentPlan = subscription ? getPlanById(subscription.planId) : null;

    // Upgrade/change plan
    const changePlan = useCallback(
        async (planId: string, billingCycle: BillingCycle): Promise<void> => {
            setCheckoutLoading(true);
            setActionError(null);
            try {
                const { data, error } = await supabase.functions.invoke("create-subscription-checkout", {
                    body: {
                        planId,
                        billingCycle,
                        successUrl: window.location.origin + "/subscription/success",
                        cancelUrl: window.location.origin + "/subscription/cancel",
                    },
                });

                if (error) throw error;
                if (data?.checkoutUrl) {
                    window.location.href = data.checkoutUrl;
                }
            } catch (err) {
                console.error("Change plan error:", err);
                setActionError("Ödeme sayfası başlatılamadı");
                throw err;
            } finally {
                setCheckoutLoading(false);
            }
        },
        [userId]
    );


    // Cancel subscription
    const cancelSubscription = useCallback(async (): Promise<void> => {
        if (!subscription) return;
        setCheckoutLoading(true);
        setActionError(null);
        try {
            const { error } = await supabase
                .from("subscriptions")
                .update({ auto_renew: false })
                .eq("id", subscription.id);

            if (error) throw error;
            queryClient.invalidateQueries({ queryKey: ["subscription", userId] });
        } catch (err) {
            setActionError("Abonelik iptal edilemedi");
            throw err;
        } finally {
            setCheckoutLoading(false);
        }
    }, [subscription, userId, queryClient]);


    // Resume subscription
    const resumeSubscription = useCallback(async (): Promise<void> => {
        if (!subscription) return;
        setCheckoutLoading(true);
        setActionError(null);
        try {
            const { error } = await supabase
                .from("subscriptions")
                .update({ auto_renew: true })
                .eq("id", subscription.id);

            if (error) throw error;
            queryClient.invalidateQueries({ queryKey: ["subscription", userId] });
        } catch (err) {
            setActionError("Abonelik devam ettirilemedi");
            throw err;
        } finally {
            setCheckoutLoading(false);
        }
    }, [subscription, userId, queryClient]);


    // Change billing cycle
    const changeBillingCycle = useCallback(
        async (billingCycle: BillingCycle): Promise<void> => {
            // This would normally involve another checkout flow or plan update in external provider
            setActionError("Billing cycle change requires a new checkout session");
        },
        [subscription]
    );


    // Check if user can upgrade to a plan
    const canUpgradeTo = useCallback(
        (planTier: PlanTier): boolean => {
            if (!subscription) return true;
            const tierOrder: PlanTier[] = ["free", "starter", "premium", "pro", "family", "elite"];
            const currentIndex = tierOrder.indexOf(subscription.tier);
            const targetIndex = tierOrder.indexOf(planTier);
            return targetIndex > currentIndex;
        },
        [subscription]
    );

    return {
        subscription,
        currentPlan,
        plans,
        billingHistory,
        isLoading,
        error,
        changePlan,
        cancelSubscription,
        resumeSubscription,
        changeBillingCycle,
        canUpgradeTo,
    };
}
