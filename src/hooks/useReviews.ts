/**
 * useReviews Hook - Manages reviews data and operations
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import type { Review, ReviewStats, ReviewPair, TrustReason, DetailedReviewSubmission } from "@/types/review";
import { calculateTrustWeight, getReviewStats } from "@/types/review";
import { calculateOverallFromDetailed } from "@/constants/reviewQuestions";
import { supabase } from "@/integrations/supabase/client";
import { reviewSchema } from "@/schemas/validation";

// Type for Supabase client to handle new tables not yet in generated types
type SupabaseClientAny = typeof supabase & {
    from: (table: string) => any;
};


interface UseReviewsOptions {
    userId?: string;
    sitterId?: string;
    sessionId?: string;
}

export function useReviews(options: UseReviewsOptions = {}) {
    const { userId, sitterId, sessionId } = options;
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Refresh — loads reviews from Supabase filtered by the provided options
    const refreshReviews = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const db = supabase as SupabaseClientAny;
            let query = db
                .from('reviews')
                .select(`
                    id, session_id, booking_id, reviewer_id, reviewee_id,
                    reviewer_role, reviewee_role, rating, comment, status,
                    created_at, visible_at,
                    reviewer:profiles!reviewer_id(full_name, profile_photo_url),
                    reviewee:profiles!reviewee_id(full_name)
                `)
                .eq('status', 'visible')
                .order('created_at', { ascending: false });

            if (sitterId) query = query.eq('reviewee_id', sitterId);
            else if (userId) query = query.eq('reviewer_id', userId);
            if (sessionId) query = query.eq('session_id', sessionId);

            const { data, error: fetchError } = await query;
            if (fetchError) throw fetchError;

            const mapped: Review[] = (data || []).map((r: any) => ({
                id: r.id,
                sessionId: r.session_id,
                bookingId: r.booking_id,
                reviewerId: r.reviewer_id,
                reviewerName: r.reviewer?.full_name ?? 'Kullanıcı',
                reviewerPhoto: r.reviewer?.profile_photo_url ?? undefined,
                reviewerRole: r.reviewer_role as 'parent' | 'sitter',
                revieweeId: r.reviewee_id,
                revieweeName: r.reviewee?.full_name ?? 'Kullanıcı',
                revieweeRole: r.reviewee_role as 'parent' | 'sitter',
                rating: r.rating,
                comment: r.comment ?? '',
                isTrusted: false,
                trustWeight: 0.5,
                trustReasons: [] as TrustReason[],
                status: r.status as Review['status'],
                createdAt: new Date(r.created_at),
                visibleAt: r.visible_at ? new Date(r.visible_at) : undefined,
            }));

            setReviews(mapped);
        } catch (err) {
            console.error('Error fetching reviews:', err);
            setError('Değerlendirmeler yüklenemedi');
        } finally {
            setIsLoading(false);
        }
    }, [userId, sitterId, sessionId]);

    // Initial load
    useEffect(() => {
        refreshReviews();
    }, [refreshReviews]);

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

                const reviewerRole: 'parent' | 'sitter' = data.revieweeRole === 'sitter' ? 'parent' : 'sitter';

                // Insert review into Supabase
                const db = supabase as SupabaseClientAny;
                const { data: insertedRow, error: insertError } = await db
                    .from('reviews')
                    .insert({
                        session_id: data.sessionId,
                        booking_id: data.bookingId,
                        reviewer_id: userId,
                        reviewee_id: data.revieweeId,
                        reviewer_role: reviewerRole,
                        reviewee_role: data.revieweeRole,
                        rating: data.rating,
                        comment: data.comment,
                        status: 'submitted',
                    })
                    .select('id, created_at')
                    .single();

                if (insertError) throw insertError;

                // Build a local Review object for immediate return / optimistic display
                const trustReasons: TrustReason[] = ['completed_payment'];
                const newReview: Review = {
                    id: insertedRow.id,
                    sessionId: data.sessionId,
                    bookingId: data.bookingId,
                    reviewerId: userId,
                    reviewerName: data.reviewerName,
                    reviewerPhoto: data.reviewerPhoto,
                    reviewerRole,
                    revieweeId: data.revieweeId,
                    revieweeName: data.revieweeName,
                    revieweeRole: data.revieweeRole,
                    rating: data.rating,
                    comment: data.comment,
                    isTrusted: trustReasons.length >= 2,
                    trustWeight: calculateTrustWeight(trustReasons),
                    trustReasons,
                    status: 'submitted',
                    createdAt: new Date(insertedRow.created_at),
                };

                // Reload reviews from DB to reflect server-side visibility logic
                await refreshReviews();

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
