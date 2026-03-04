/**
 * useBookings Hook - Manages bookings data and operations
 */

import { useState, useCallback, useMemo } from "react";
import type { Booking } from "@/components/bookings/BookingCard";
import { supabase } from "@/integrations/supabase/client";
import { paymentService } from "@/services/payment";
import { calculateReliabilityImpact } from "@/lib/cancellation";
import { cancelBookingSchema } from "@/schemas/validation";
import { trackApiCall, trackSlowQuery } from "@/lib/performance";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { differenceInYears } from "date-fns";

interface UseBookingsOptions {
    userId: string;
    viewMode: "parent" | "sitter";
}

const PAGE_SIZE = 20;

// Transform database booking to Booking type
const transformBooking = (b: any): Booking => ({
    id: b.id,
    parentId: b.parent_id,
    parentName: b.parent?.full_name || "Veli",
    parentPhoto: b.parent?.profile_photo_url || undefined,
    sitterId: b.sitter_id,
    sitterName: b.sitter?.full_name || "Bakıcı",
    sitterPhoto: b.sitter?.profile_photo_url || undefined,
    sitterRating: b.sitter?.rating || 5.0,
    sitterUniversity: b.sitter?.university || "",
    bookingDate: new Date(b.booking_date),
    startTime: b.start_time.substring(0, 5),
    endTime: "18:00", // Default or calculate from duration if needed
    durationHours: b.duration_hours || 1,
    childrenCount: b.children?.length || 0,
    childrenNames: b.children?.map((c: any) => c.child?.name).filter(Boolean) || [],
    childrenAges: b.children?.map((c: any) =>
        c.child?.birth_date ? differenceInYears(new Date(), new Date(c.child.birth_date)) : 0
    ) || [],
    address: b.meeting_address || "",
    district: "İstanbul", // Or fetch from district field if added
    hourlyRate: b.sitter?.hourly_rate || 0,
    totalAmount: b.total_amount || 0,
    paymentStatus: b.payment_status || "pending",
    status: b.status as any,
    createdAt: new Date(b.created_at),
    confirmedAt: b.confirmed_at ? new Date(b.confirmed_at) : undefined,
    cancelledAt: b.cancelled_at ? new Date(b.cancelled_at) : undefined,
    cancelReason: b.cancellation_reason || undefined,
});

export function useBookings({ userId, viewMode }: UseBookingsOptions) {
    const queryClient = useQueryClient();

    // Optimized field selection - only fetch what we need
    const selectStr = viewMode === "parent"
        ? `id, parent_id, sitter_id, booking_date, start_time, duration_hours,
           meeting_address, total_amount, status, payment_status, created_at,
           confirmed_at, cancelled_at, cancellation_reason,
           sitter:sitters(id, full_name, profile_photo_url, rating, university, hourly_rate),
           children:booking_children(child:children(id, name, birth_date))`
        : `id, parent_id, sitter_id, booking_date, start_time, duration_hours,
           meeting_address, total_amount, status, payment_status, created_at,
           confirmed_at, cancelled_at, cancellation_reason,
           parent:parents(id, full_name, profile_photo_url),
           children:booking_children(child:children(id, name, birth_date))`;

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        error: queryError
    } = useInfiniteQuery({
        queryKey: ["bookings", userId, viewMode],
        queryFn: async ({ pageParam = 0 }) => {
            const from = pageParam * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;
            const queryStart = performance.now();

            const { data, error, count } = await trackApiCall(
                "bookings.list",
                async () =>
                    supabase
                        .from("bookings")
                        .select(selectStr, { count: 'exact' })
                        .eq(viewMode === "parent" ? "parent_id" : "sitter_id", userId)
                        .order("booking_date", { ascending: false })
                        .range(from, to),
                {
                    view_mode: viewMode,
                    page: String(pageParam),
                }
            );

            trackSlowQuery(["bookings", userId, viewMode], performance.now() - queryStart);

            if (error) throw error;

            return {
                bookings: (data || []).map(transformBooking),
                nextPage: data && data.length === PAGE_SIZE ? pageParam + 1 : undefined,
                totalCount: count || 0,
            };
        },
        getNextPageParam: (lastPage) => lastPage.nextPage,
        initialPageParam: 0,
        enabled: !!userId,
    });

    // Flatten all pages into a single bookings array
    const bookings = useMemo(
        () => data?.pages.flatMap((page) => page.bookings) || [],
        [data]
    );

    // Confirm a booking (sitter)
    const confirmMutation = useMutation({
        mutationFn: async (bookingId: string) => {
            const { error } = await supabase
                .from("bookings")
                .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
                .eq("id", bookingId);
            if (error) throw error;
        },
        // Optimistic update for instant UI feedback
        onMutate: async (bookingId: string) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: ["bookings", userId, viewMode] });

            // Snapshot previous value
            const previousData = queryClient.getQueryData(["bookings", userId, viewMode]);

            // Optimistically update cache
            queryClient.setQueryData(["bookings", userId, viewMode], (old: any) => {
                if (!old) return old;

                return {
                    ...old,
                    pages: old.pages.map((page: any) => ({
                        ...page,
                        bookings: page.bookings.map((b: any) =>
                            b.id === bookingId
                                ? { ...b, status: "confirmed", confirmedAt: new Date() }
                                : b
                        ),
                    })),
                };
            });

            return { previousData };
        },
        onError: (_err, _variables, context) => {
            // Rollback on error
            if (context?.previousData) {
                queryClient.setQueryData(
                    ["bookings", userId, viewMode],
                    context.previousData
                );
            }
        },
        onSettled: () => {
            // Refetch to ensure consistency
            queryClient.invalidateQueries({ queryKey: ["bookings", userId, viewMode] });
        },
    });

    const confirmBooking = useCallback(async (bookingId: string) => {
        return confirmMutation.mutateAsync(bookingId);
    }, [confirmMutation]);

    // Cancel a booking
    const cancelMutation = useMutation({
        mutationFn: async ({ bookingId, reason }: { bookingId: string; reason: string }) => {
            const booking = bookings.find(b => b.id === bookingId);
            if (!booking) throw new Error("Randevu bulunamadı");

            let reliabilityImpact = 0;
            if (viewMode === "sitter") {
                const impact = calculateReliabilityImpact(booking.bookingDate, booking.startTime);
                reliabilityImpact = impact.scoreImpact;
            }

            // Update Supabase
            const { error: updateError } = await supabase
                .from("bookings")
                .update({
                    status: "cancelled",
                    updated_at: new Date().toISOString(),
                    cancellation_reason: reason,
                    cancelled_at: new Date().toISOString(),
                    cancelled_by: userId
                })
                .eq("id", bookingId);

            if (updateError) throw updateError;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bookings", userId, viewMode] });
        },
    });

    const cancelBooking = useCallback(async (bookingId: string, reason: string) => {
        // Validate reason
        const validation = cancelBookingSchema.safeParse({ reason });
        if (!validation.success) {
            throw new Error(validation.error.errors[0].message);
        }
        return cancelMutation.mutateAsync({ bookingId, reason });
    }, [cancelMutation]);

    // Complete a booking
    const completeMutation = useMutation({
        mutationFn: async (bookingId: string) => {
            const { error } = await supabase
                .from("bookings")
                .update({ status: "completed", updated_at: new Date().toISOString() })
                .eq("id", bookingId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bookings", userId, viewMode] });
        },
    });

    const completeBooking = useCallback(async (bookingId: string) => {
        return completeMutation.mutateAsync(bookingId);
    }, [completeMutation]);

    // Get a single booking
    const getBooking = useCallback((bookingId: string): Booking | undefined => {
        return bookings.find((b) => b.id === bookingId);
    }, [bookings]);

    // Stats
    const stats = useMemo(() => {
        const now = new Date();
        const upcoming = bookings.filter(
            (b) => new Date(b.bookingDate) >= now && b.status !== "cancelled" && b.status !== "completed"
        ).length;
        const completed = bookings.filter((b) => b.status === "completed").length;
        const totalEarnings = bookings
            .filter((b) => b.status === "completed")
            .reduce((sum, b) => sum + b.totalAmount, 0);

        return { upcoming, completed, totalEarnings };
    }, [bookings]);

    // Refresh
    const refreshBookings = useCallback(async () => {
        return queryClient.invalidateQueries({ queryKey: ["bookings", userId, viewMode] });
    }, [queryClient, userId, viewMode]);

    return {
        bookings,
        isLoading: isLoading || confirmMutation.isPending || cancelMutation.isPending || completeMutation.isPending,
        isFetchingNextPage,
        error: (queryError || confirmMutation.error || cancelMutation.error || completeMutation.error) as Error | null,
        stats,
        getBooking,
        confirmBooking,
        cancelBooking,
        completeBooking,
        refreshBookings,
        fetchNextPage,
        hasNextPage,
    };
}
