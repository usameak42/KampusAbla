/**
 * useEarnings Hook - Manages sitter earnings and payouts
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { paymentService } from "@/services/payment";
import { useSubscription } from "@/hooks/useSubscription";

export interface Transaction {
    id: string;
    bookingId: string;
    amount: number;
    sitterAmount: number;
    platformFee: number;
    status: string;
    paidAt: string | null;
    createdAt: string;
    booking?: {
        booking_date: string;
        start_time: string;
        status: string;
    };
}

export interface Payout {
    id: string;
    amount: number;
    status: "pending" | "processed" | "failed";
    paymentMethod: string | null;
    processedAt: string | null;
    createdAt: string;
    bankAccountInfo: unknown;
}

export function useEarnings(sitterId: string) {
    const queryClient = useQueryClient();
    const { subscription } = useSubscription({ userId: sitterId, role: "sitter" });

    // Determine if user is eligible for fast payout (Pro or Elite plans)
    const isPriorityEligible = subscription?.tier === "pro" || subscription?.tier === "elite";

    // 1. Fetch transactions (earnings)
    const transactionsQuery = useQuery({
        queryKey: ["sitter-transactions", sitterId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("transactions")
                .select("*, booking:bookings(booking_date, start_time, status)")
                .eq("sitter_id", sitterId)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return (data || []) as unknown as Transaction[];
        },
        enabled: !!sitterId,
    });

    // 2. Fetch payouts
    const payoutsQuery = useQuery({
        queryKey: ["sitter-payouts", sitterId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("payouts")
                .select("*")
                .eq("sitter_id", sitterId)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return (data || []) as unknown as Payout[];
        },
        enabled: !!sitterId,
    });

    // 3. Request payout mutation
    const requestPayoutMutation = useMutation({
        mutationFn: async (amount: number) => {
            // 1. Call Payment Service with priority if eligible
            const paymentResult = await paymentService.requestPayout(sitterId, amount, isPriorityEligible);

            if (!paymentResult.success) {
                throw new Error(paymentResult.error || "Ödeme talebi oluşturulamadı");
            }

            // 2. Record in Database
            const { data, error } = await supabase
                .from("payouts")
                .insert({
                    sitter_id: sitterId,
                    amount,
                    status: "pending",
                    metadata: {
                        transactionId: paymentResult.transactionId,
                        processedInternally: false,
                        is_priority: isPriorityEligible
                    }
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sitter-payouts", sitterId] });
        },
    });

    // Calculate balances
    const totalEarnings = transactionsQuery.data?.reduce((sum, t) => sum + t.sitterAmount, 0) || 0;
    const totalPaidOut = payoutsQuery.data
        ?.filter(p => p.status === "processed")
        .reduce((sum, p) => sum + p.amount, 0) || 0;
    const pendingPayouts = payoutsQuery.data
        ?.filter(p => p.status === "pending")
        .reduce((sum, p) => sum + p.amount, 0) || 0;

    const availableBalance = Math.max(0, totalEarnings - totalPaidOut - pendingPayouts);

    return {
        transactions: transactionsQuery.data || [],
        payouts: payoutsQuery.data || [],
        balances: {
            totalEarnings,
            totalPaidOut,
            pendingPayouts,
            availableBalance,
            isPriorityEligible,
        },
        isLoading: transactionsQuery.isLoading || payoutsQuery.isLoading,
        error: transactionsQuery.error || payoutsQuery.error,
        requestPayout: requestPayoutMutation.mutateAsync,
        isRequesting: requestPayoutMutation.isPending,
    };
}
