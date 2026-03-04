/**
 * useReviews Hook - Manages reviews data and operations
 */

import { useState, useCallback, useMemo } from "react";
import type { Review, ReviewStats, ReviewPair, TrustReason, DetailedReviewSubmission } from "@/types/review";
import { calculateTrustWeight, getReviewStats } from "@/types/review";
import { calculateOverallFromDetailed } from "@/constants/reviewQuestions";
import { supabase } from "@/integrations/supabase/client";
import { reviewSchema } from "@/schemas/validation";

// Type for Supabase client to handle new tables not yet in generated types
type SupabaseClientAny = typeof supabase & {
    from: (table: string) => any;
};

// Mock reviews data
const MOCK_REVIEWS: Review[] = [
    {
        id: "review-1",
        sessionId: "session-1",
        bookingId: "booking-3",
        reviewerId: "parent-1",
        reviewerName: "Ayşe Demir",
        reviewerPhoto: "/images/parent1.jpg",
        reviewerRole: "parent",
        revieweeId: "sitter-2",
        revieweeName: "Selin Öz",
        revieweeRole: "sitter",
        rating: 5,
        comment: "Selin harika bir bakıcı! Çocuklarım onunla çok eğlendi ve ödevlerini de tamamladılar. Kesinlikle tekrar çalışacağız.",
        isTrusted: true,
        trustWeight: 0.65,
        trustReasons: ["verified_user", "completed_payment", "long_session"],
        status: "visible",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        visibleAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
        id: "review-2",
        sessionId: "session-1",
        bookingId: "booking-3",
        reviewerId: "sitter-2",
        reviewerName: "Selin Öz",
        reviewerPhoto: "/images/sitter2.jpg",
        reviewerRole: "sitter",
        revieweeId: "parent-1",
        revieweeName: "Ayşe Demir",
        revieweeRole: "parent",
        rating: 5,
        comment: "Ayşe Hanım çok anlayışlı ve iletişimi kolay bir aile. Çocuklar çok tatlıydı.",
        isTrusted: true,
        trustWeight: 0.5,
        trustReasons: ["verified_user", "completed_payment"],
        status: "visible",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        visibleAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
        id: "review-3",
        sessionId: "session-2",
        bookingId: "booking-5",
        reviewerId: "parent-2",
        reviewerName: "Mehmet Yılmaz",
        reviewerRole: "parent",
        revieweeId: "sitter-1",
        revieweeName: "Elif Kaya",
        revieweeRole: "sitter",
        rating: 4,
        comment: "Elif çok profesyonel. Zamanında geldi ve çocuğumla güzel vakit geçirdi.",
        isTrusted: false,
        trustWeight: 0.35,
        trustReasons: ["completed_payment"],
        status: "visible",
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        visibleAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    },
    {
        id: "review-4",
        sessionId: "session-3",
        bookingId: "booking-6",
        reviewerId: "parent-3",
        reviewerName: "Zeynep Aksoy",
        reviewerRole: "parent",
        revieweeId: "sitter-1",
        revieweeName: "Elif Kaya",
        revieweeRole: "sitter",
        rating: 5,
        comment: "Mükemmel bir deneyim! Elif hem eğitici hem de eğlenceli aktiviteler yaptı. Kızım artık Elif'i her zaman bekliyor.",
        isTrusted: true,
        trustWeight: 0.8,
        trustReasons: ["verified_user", "repeat_booking", "completed_payment", "premium_subscriber"],
        status: "visible",
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        visibleAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
    },
    {
        id: "review-5",
        sessionId: "session-4",
        bookingId: "booking-7",
        reviewerId: "parent-4",
        reviewerName: "Burak Çelik",
        reviewerRole: "parent",
        revieweeId: "sitter-1",
        revieweeName: "Elif Kaya",
        revieweeRole: "sitter",
        rating: 3,
        comment: "Genel olarak iyi ama biraz gecikme oldu.",
        isTrusted: false,
        trustWeight: 0.2,
        trustReasons: ["completed_payment"],
        status: "visible",
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        visibleAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
    },
];

interface UseReviewsOptions {
    userId?: string;
    sitterId?: string;
    sessionId?: string;
}

export function useReviews(options: UseReviewsOptions = {}) {
    const { userId, sitterId, sessionId } = options;
    const [reviews, setReviews] = useState<Review[]>(MOCK_REVIEWS);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Refresh - defined early to be available in other callbacks
    const refreshReviews = useCallback(async () => {
        setIsLoading(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 500));
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Get reviews for a sitter
    const sitterReviews = useMemo(() => {
        if (!sitterId) return [];
        return reviews.filter(
            (r) => r.revieweeId === sitterId && r.revieweeRole === "sitter" && r.status === "visible"
        );
    }, [reviews, sitterId]);

    // Get user's reviews
    const userReviews = useMemo(() => {
        if (!userId) return [];
        return reviews.filter((r) => r.reviewerId === userId);
    }, [reviews, userId]);

    // Get pending reviews for a session
    const sessionReviewPair = useMemo((): ReviewPair | null => {
        if (!sessionId) return null;

        const sessionReviews = reviews.filter((r) => r.sessionId === sessionId);
        const parentReview = sessionReviews.find((r) => r.reviewerRole === "parent");
        const sitterReview = sessionReviews.find((r) => r.reviewerRole === "sitter");

        return {
            sessionId,
            parentReview,
            sitterReview,
            bothSubmitted: !!parentReview && !!sitterReview,
            visibleAt: parentReview?.visibleAt || sitterReview?.visibleAt,
        };
    }, [reviews, sessionId]);

    // Check if user has reviewed a session
    const hasReviewed = useCallback(
        (checkSessionId: string): boolean => {
            if (!userId) return false;
            return reviews.some((r) => r.sessionId === checkSessionId && r.reviewerId === userId);
        },
        [reviews, userId]
    );

    // Submit a review
    const submitReview = useCallback(
        async (data: {
            sessionId: string;
            bookingId: string;
            revieweeId: string;
            revieweeName: string;
            revieweeRole: "parent" | "sitter";
            rating: number;
            comment: string;
            reviewerName: string;
            reviewerPhoto?: string;
        }): Promise<Review> => {
            if (!userId) throw new Error("User not authenticated");

            setIsLoading(true);
            setError(null);

            try {
                // Validate review
                const validation = reviewSchema.safeParse({ rating: data.rating, comment: data.comment });
                if (!validation.success) {
                    throw new Error(validation.error.errors[0].message);
                }

                // TODO: Supabase mutation
                await new Promise((resolve) => setTimeout(resolve, 500));

                // Calculate trust factors (simplified for mock)
                const trustReasons: TrustReason[] = ["completed_payment"];
                // In real app: check if verified_user, repeat_booking, etc.

                const newReview: Review = {
                    id: `review-${Date.now()}`,
                    sessionId: data.sessionId,
                    bookingId: data.bookingId,
                    reviewerId: userId,
                    reviewerName: data.reviewerName,
                    reviewerPhoto: data.reviewerPhoto,
                    reviewerRole: data.revieweeRole === "sitter" ? "parent" : "sitter",
                    revieweeId: data.revieweeId,
                    revieweeName: data.revieweeName,
                    revieweeRole: data.revieweeRole,
                    rating: data.rating,
                    comment: data.comment,
                    isTrusted: trustReasons.length >= 2,
                    trustWeight: calculateTrustWeight(trustReasons),
                    trustReasons,
                    status: "submitted",
                    createdAt: new Date(),
                };

                setReviews((prev) => {
                    const updated = [...prev, newReview];

                    // Check if both parties have submitted
                    const sessionReviews = updated.filter((r) => r.sessionId === data.sessionId);
                    const parentReview = sessionReviews.find((r) => r.reviewerRole === "parent");
                    const sitterReview = sessionReviews.find((r) => r.reviewerRole === "sitter");

                    // If both submitted, make them visible
                    if (parentReview && sitterReview) {
                        return updated.map((r) =>
                            r.sessionId === data.sessionId
                                ? { ...r, status: "visible" as const, visibleAt: new Date() }
                                : r
                        );
                    }

                    return updated;
                });

                return newReview;
            } catch (err) {
                setError("Değerlendirme gönderilemedi");
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [userId]
    );

    // Submit a detailed review (enhanced system)
    const submitDetailedReview = useCallback(
        async (data: DetailedReviewSubmission): Promise<void> => {
            if (!userId) throw new Error('User not authenticated');

            setIsLoading(true);
            setError(null);

            try {
                // Calculate overall rating from detailed ratings
                const overallRating = calculateOverallFromDetailed(data.ratings);

                // Use type assertion for new tables not yet in generated types
                const db = supabase as SupabaseClientAny;

                // 1. Insert main review
                const { data: reviewData, error: reviewError } = await db
                    .from('reviews')
                    .insert({
                        session_id: data.sessionId,
                        booking_id: data.bookingId,
                        reviewer_id: userId,
                        reviewee_id: data.revieweeId,
                        reviewer_role: data.revieweeRole === 'sitter' ? 'parent' : 'sitter',
                        rating: Math.round(overallRating),
                        review_type: data.reviewType,
                        comment: data.freeComment || null,
                        tip_for_next_sitter: data.tipForNextSitter || null,
                    })
                    .select()
                    .single();

                if (reviewError) throw reviewError;

                const reviewId = reviewData.id;

                // 2. Insert detailed ratings
                const ratingsToInsert = Object.entries(data.ratings)
                    .filter(([_, value]) => value > 0)
                    .map(([key, value]) => ({
                        review_id: reviewId,
                        question_key: key,
                        rating: value,
                    }));

                if (ratingsToInsert.length > 0) {
                    const { error: ratingsError } = await db
                        .from('review_ratings')
                        .insert(ratingsToInsert);
                    if (ratingsError) throw ratingsError;
                }

                // 3. Insert tags
                if (data.selectedTags.length > 0) {
                    const tagsToInsert = data.selectedTags.map((tagKey) => ({
                        review_id: reviewId,
                        tag_key: tagKey,
                        is_positive: !tagKey.includes('_') ||
                            ['net_iletisim', 'dakik', 'saygili', 'esnek', 'guvenli_ortam',
                                'isbirlikci', 'merakli', 'nazik', 'calismaya_acik',
                                'guven_verici', 'iyi_iletisim', 'cocukla_iyi',
                                'odevde_basarili', 'dil_pratigi_iyi'].includes(tagKey),
                    }));

                    const { error: tagsError } = await db
                        .from('review_tags')
                        .insert(tagsToInsert);
                    if (tagsError) throw tagsError;
                }

                // 4. Insert flags (sitter reviews only)
                if (data.flags && Object.keys(data.flags).length > 0) {
                    const flagsToInsert = Object.entries(data.flags).map(([key, value]) => ({
                        review_id: reviewId,
                        flag_key: key,
                        value,
                        triggers_report: key === 'inappropriate_behavior' && value,
                    }));

                    const { error: flagsError } = await db
                        .from('review_flags')
                        .insert(flagsToInsert);
                    if (flagsError) throw flagsError;
                }

                // 5. Insert confirmations (family reviews only)
                if (data.confirmations && Object.keys(data.confirmations).length > 0) {
                    const confirmationsToInsert = Object.entries(data.confirmations).map(([key, value]) => ({
                        review_id: reviewId,
                        flag_key: key,
                        value,
                        triggers_report: false,
                    }));

                    const { error: confirmationsError } = await db
                        .from('review_flags')
                        .insert(confirmationsToInsert);
                    if (confirmationsError) throw confirmationsError;
                }

                // 6. Insert child reviews (sitter reviews only)
                if (data.childReviews && data.childReviews.length > 0) {
                    for (const childReview of data.childReviews) {
                        // Insert child review record
                        const { data: childReviewData, error: childError } = await db
                            .from('child_reviews')
                            .insert({
                                review_id: reviewId,
                                child_id: childReview.childId,
                                tip_for_next_sitter: childReview.tipForNextSitter || null,
                                visible_to_family: childReview.visibleToFamily,
                            })
                            .select()
                            .single();

                        if (childError) throw childError;

                        // Insert child ratings as review_ratings with prefixed keys
                        const childRatingsToInsert = Object.entries(childReview.ratings)
                            .filter(([_, value]) => value > 0)
                            .map(([key, value]) => ({
                                review_id: reviewId,
                                question_key: `child_${childReview.childId}_${key}`,
                                rating: value,
                            }));

                        if (childRatingsToInsert.length > 0) {
                            const { error: childRatingsError } = await db
                                .from('review_ratings')
                                .insert(childRatingsToInsert);
                            if (childRatingsError) throw childRatingsError;
                        }

                        // Insert child tags
                        if (childReview.tags.length > 0) {
                            const childTagsToInsert = childReview.tags.map((tagKey) => ({
                                review_id: reviewId,
                                tag_key: `child_${childReview.childId}_${tagKey}`,
                                is_positive: ['isbirlikci', 'merakli', 'nazik', 'calismaya_acik'].includes(tagKey),
                            }));

                            const { error: childTagsError } = await db
                                .from('review_tags')
                                .insert(childTagsToInsert);
                            if (childTagsError) throw childTagsError;
                        }
                    }
                }

                // Refresh reviews
                await refreshReviews();

            } catch (err) {
                console.error('Error submitting detailed review:', err);
                setError('Degerlendirme gonderilemedi');
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [userId, refreshReviews]
    );

    // Get sitter statistics
    const getSitterStats = useCallback(
        (targetSitterId: string): ReviewStats => {
            const targetReviews = reviews.filter(
                (r) => r.revieweeId === targetSitterId && r.revieweeRole === "sitter" && r.status === "visible"
            );
            return getReviewStats(targetReviews);
        },
        [reviews]
    );

    return {
        reviews: sitterId ? sitterReviews : userReviews,
        sitterReviews,
        userReviews,
        sessionReviewPair,
        isLoading,
        error,
        hasReviewed,
        submitReview,
        submitDetailedReview,
        getSitterStats,
        refreshReviews,
    };
}
