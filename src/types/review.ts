/**
 * Review Types and Interfaces
 */

export type ReviewStatus = "pending" | "submitted" | "visible";

export interface Review {
    id: string;
    sessionId: string;
    bookingId: string;
    // Reviewer
    reviewerId: string;
    reviewerName: string;
    reviewerPhoto?: string;
    reviewerRole: "parent" | "sitter";
    // Reviewee
    revieweeId: string;
    revieweeName: string;
    revieweeRole: "parent" | "sitter";
    // Content
    rating: number; // 1-5
    comment: string;
    // Trust factors
    isTrusted: boolean;
    trustWeight: number; // 0-1, higher = more influential
    trustReasons: TrustReason[];
    // Meta
    status: ReviewStatus;
    createdAt: Date;
    visibleAt?: Date;
}

export type TrustReason =
    | "verified_user"
    | "repeat_booking"
    | "completed_payment"
    | "long_session"
    | "premium_subscriber";

export const TRUST_REASON_LABELS: Record<TrustReason, string> = {
    verified_user: "Doğrulanmış Kullanıcı",
    repeat_booking: "Tekrarlayan Müşteri",
    completed_payment: "Ödeme Tamamlandı",
    long_session: "Uzun Süreli Oturum",
    premium_subscriber: "Premium Üye",
};

export const TRUST_WEIGHTS: Record<TrustReason, number> = {
    verified_user: 0.2,
    repeat_booking: 0.3,
    completed_payment: 0.15,
    long_session: 0.15,
    premium_subscriber: 0.2,
};

export interface ReviewStats {
    totalReviews: number;
    averageRating: number;
    weightedAverageRating: number;
    ratingDistribution: Record<1 | 2 | 3 | 4 | 5, number>;
    trustedReviewCount: number;
}

export interface ReviewPair {
    sessionId: string;
    parentReview?: Review;
    sitterReview?: Review;
    bothSubmitted: boolean;
    visibleAt?: Date;
}

// Rating display info
export const RATING_INFO: Record<number, { label: string; emoji: string; color: string }> = {
    1: { label: "Çok Kötü", emoji: "😞", color: "text-red-500" },
    2: { label: "Kötü", emoji: "😕", color: "text-orange-500" },
    3: { label: "Orta", emoji: "😐", color: "text-yellow-500" },
    4: { label: "İyi", emoji: "😊", color: "text-green-500" },
    5: { label: "Mükemmel", emoji: "🌟", color: "text-emerald-500" },
};

// Calculate trust weight based on factors
export function calculateTrustWeight(reasons: TrustReason[]): number {
    const weight = reasons.reduce((sum, reason) => sum + TRUST_WEIGHTS[reason], 0);
    return Math.min(weight, 1); // Cap at 1
}

// Calculate weighted average rating
export function calculateWeightedAverage(reviews: Review[]): number {
    if (reviews.length === 0) return 0;

    const totalWeight = reviews.reduce((sum, r) => sum + r.trustWeight, 0);
    if (totalWeight === 0) return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    const weightedSum = reviews.reduce((sum, r) => sum + r.rating * r.trustWeight, 0);
    return weightedSum / totalWeight;
}

// Get review statistics
export function getReviewStats(reviews: Review[]): ReviewStats {
    const visibleReviews = reviews.filter((r) => r.status === "visible");

    const distribution: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    visibleReviews.forEach((r) => {
        distribution[r.rating as 1 | 2 | 3 | 4 | 5]++;
    });

    return {
        totalReviews: visibleReviews.length,
        averageRating:
            visibleReviews.length > 0
                ? visibleReviews.reduce((sum, r) => sum + r.rating, 0) / visibleReviews.length
                : 0,
        weightedAverageRating: calculateWeightedAverage(visibleReviews),
        ratingDistribution: distribution,
        trustedReviewCount: visibleReviews.filter((r) => r.isTrusted).length,
    };
}

// Check if both parties have submitted reviews
export function canRevealReviews(pair: ReviewPair): boolean {
    return pair.bothSubmitted && !!pair.parentReview && !!pair.sitterReview;
}

// ============================================
// ENHANCED RATING SYSTEM TYPES
// ============================================

// ============================================
// RATING QUESTION TYPES
// ============================================

export type SitterToFamilyQuestionKey =
    | 'communication_clarity'
    | 'punctuality'
    | 'respect_professionalism'
    | 'boundary_compliance'
    | 'safety_feeling'
    | 'problem_solving'
    | 'plan_adherence'
    | 'overall_satisfaction';

export type SitterToChildQuestionKey =
    | 'cooperation'
    | 'respect'
    | 'safety_behavior'
    | 'homework_participation'
    | 'communication_ease'
    | 'emotional_regulation'
    | 'overall_ease';

export type FamilyToSitterQuestionKey =
    | 'punctuality_reliability'
    | 'pickup_safety'
    | 'communication'
    | 'plan_compliance'
    | 'child_approach'
    | 'educational_contribution'
    | 'professionalism'
    | 'trust_feeling'
    | 'overall_satisfaction';

// ============================================
// TAG TYPES
// ============================================

export type SitterFamilyPositiveTag =
    | 'net_iletisim'
    | 'dakik'
    | 'saygili'
    | 'esnek'
    | 'guvenli_ortam';

export type SitterFamilyNegativeTag =
    | 'belirsiz_talimat'
    | 'son_dakika_degisiklik'
    | 'gec_kaldi'
    | 'kurallari_zorladi'
    | 'rahatsiz_edici';

export type SitterChildPositiveTag =
    | 'isbirlikci'
    | 'merakli'
    | 'nazik'
    | 'calismaya_acik';

export type SitterChildNegativeTag =
    | 'dikkati_daginik'
    | 'cabuk_sikiliyor'
    | 'sinir_zorluyor'
    | 'cok_hareketli';

export type FamilySitterPositiveTag =
    | 'dakik'
    | 'guven_verici'
    | 'iyi_iletisim'
    | 'cocukla_iyi'
    | 'odevde_basarili'
    | 'dil_pratigi_iyi';

export type FamilySitterNegativeTag =
    | 'gec_kaldi'
    | 'az_iletisim'
    | 'plan_disina_cikti'
    | 'profesyonel_degil'
    | 'egitsel_katki_zayif';

// ============================================
// FLAG TYPES
// ============================================

export type SitterSafetyFlagKey =
    | 'off_platform_offer'
    | 'inappropriate_behavior';

export type FamilyConfirmationKey =
    | 'child_delivered_safely'
    | 'no_off_platform_offer'
    | 'no_safety_issues';

// ============================================
// INTERFACES
// ============================================

export interface RatingQuestion {
    key: string;
    label: string;
    description: string;
}

export interface ReviewTag {
    key: string;
    label: string;
    isPositive: boolean;
}

export interface ReviewFlag {
    key: string;
    label: string;
    description?: string;
    triggersReport?: boolean;
}

export interface DetailedRatings {
    [questionKey: string]: number; // 1-5
}

export interface ChildReviewData {
    childId: string;
    childName: string;
    ratings: DetailedRatings;
    tags: string[];
    tipForNextSitter?: string;
    visibleToFamily: boolean;
}

export type ReviewType = 'sitter_to_family' | 'family_to_sitter';

export interface DetailedReviewSubmission {
    sessionId: string;
    bookingId: string;
    reviewType: ReviewType;
    revieweeId: string;
    revieweeName: string;
    revieweeRole: 'parent' | 'sitter';
    // Ratings
    ratings: DetailedRatings;
    // Tags
    selectedTags: string[];
    // Flags (sitter only)
    flags?: Record<string, boolean>;
    // Confirmations (family only)
    confirmations?: Record<string, boolean>;
    // Comments
    freeComment?: string;
    tipForNextSitter?: string;
    // Child reviews (sitter only)
    childReviews?: ChildReviewData[];
}

// Extended Review interface
export interface DetailedReview extends Review {
    reviewType: ReviewType;
    detailedRatings: DetailedRatings;
    tags: string[];
    flags: Record<string, boolean>;
    freeComment?: string;
    tipForNextSitter?: string;
    childReviews?: ChildReviewData[];
}
