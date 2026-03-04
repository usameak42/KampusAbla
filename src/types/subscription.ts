/**
 * Subscription Types and Plan Definitions
 */

export type PlanTier = "free" | "premium" | "family" | "starter" | "pro" | "elite";
export type BillingCycle = "monthly" | "yearly";
export type UserRole = "parent" | "sitter";

// Plan features
export interface PlanFeature {
    id: string;
    name: string;
    description?: string;
    included: boolean;
    limit?: number | "unlimited";
}

// Subscription plan
export interface SubscriptionPlan {
    id: string;
    tier: PlanTier;
    name: string;
    description: string;
    role: UserRole;
    monthlyPrice: number;
    yearlyPrice: number;
    features: PlanFeature[];
    isPopular?: boolean;
    badge?: string;
}

// User subscription
export interface UserSubscription {
    id: string;
    userId: string;
    planId: string;
    tier: PlanTier;
    status: "active" | "cancelled" | "past_due" | "trialing";
    billingCycle: BillingCycle;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    trialEnd?: Date;
}

// Billing history entry
export interface BillingHistoryEntry {
    id: string;
    date: Date;
    description: string;
    amount: number;
    status: "paid" | "pending" | "failed" | "refunded";
    invoiceUrl?: string;
}

// Parent Plans
export const PARENT_PLANS: SubscriptionPlan[] = [
    {
        id: "parent-free",
        tier: "free",
        name: "Ücretsiz",
        description: "Başlamak için ideal",
        role: "parent",
        monthlyPrice: 0,
        yearlyPrice: 0,
        features: [
            { id: "bookings", name: "Aylık Rezervasyon", limit: 2, included: true },
            { id: "search", name: "Bakıcı Arama", included: true },
            { id: "messaging", name: "Mesajlaşma", included: true },
            { id: "reviews", name: "Değerlendirme Okuma", included: true },
            { id: "profile", name: "Çocuk Profili", limit: 1, included: true },
            { id: "support", name: "7/24 Destek", included: true },
            { id: "featured", name: "Öne Çıkan Bakıcılar", included: false },

        ],
    },
    {
        id: "parent-premium",
        tier: "premium",
        name: "Premium",
        description: "Aktif aileler için",
        role: "parent",
        monthlyPrice: 79,
        yearlyPrice: 699,
        isPopular: true,
        features: [
            { id: "bookings", name: "Aylık Rezervasyon", limit: 10, included: true },
            { id: "search", name: "Bakıcı Arama", included: true },
            { id: "messaging", name: "Mesajlaşma", included: true },
            { id: "reviews", name: "Değerlendirme Okuma", included: true },
            { id: "profile", name: "Çocuk Profili", limit: 3, included: true },
            { id: "support", name: "7/24 Destek", included: true },
            { id: "featured", name: "Öne Çıkan Bakıcılar", included: true },

        ],
    },
    {
        id: "parent-family",
        tier: "family",
        name: "Aile",
        description: "Büyük aileler için",
        role: "parent",
        monthlyPrice: 129,
        yearlyPrice: 1149,
        badge: "En Değerli",
        features: [
            { id: "bookings", name: "Aylık Rezervasyon", limit: "unlimited", included: true },
            { id: "search", name: "Bakıcı Arama", included: true },
            { id: "messaging", name: "Mesajlaşma", included: true },
            { id: "reviews", name: "Değerlendirme Okuma", included: true },
            { id: "profile", name: "Çocuk Profili", limit: "unlimited", included: true },
            { id: "support", name: "7/24 Destek", included: true },
            { id: "featured", name: "Öne Çıkan Bakıcılar", included: true },

            { id: "dedicated", name: "Aile Hesabı Yöneticisi", included: true },
        ],
    },
];

// Sitter Plans
export const SITTER_PLANS: SubscriptionPlan[] = [
    {
        id: "sitter-starter",
        tier: "starter",
        name: "Başlangıç",
        description: "Yeni bakıcılar için",
        role: "sitter",
        monthlyPrice: 0,
        yearlyPrice: 0,
        features: [
            { id: "profile", name: "Profil Oluşturma", included: true },
            { id: "applications", name: "Başvuru Yapma", limit: 5, included: true },
            { id: "messaging", name: "Mesajlaşma", included: true },
            { id: "calendar", name: "Takvim Yönetimi", included: true },
            { id: "earnings", name: "Kazanç Takibi", included: true },
            { id: "support", name: "7/24 Destek", included: true },
            { id: "visibility", name: "Arama Görünürlüğü", description: "Standart", included: true },
            { id: "analytics", name: "Profil Analitiği", included: false },
            { id: "badge", name: "Pro Rozeti", included: false },
            { id: "priority_listing", name: "Öncelikli Listeleme", included: false },
        ],
    },
    {
        id: "sitter-pro",
        tier: "pro",
        name: "Pro",
        description: "Profesyonel bakıcılar için",
        role: "sitter",
        monthlyPrice: 49,
        yearlyPrice: 449,
        isPopular: true,
        features: [
            { id: "profile", name: "Profil Oluşturma", included: true },
            { id: "applications", name: "Başvuru Yapma", limit: "unlimited", included: true },
            { id: "messaging", name: "Mesajlaşma", included: true },
            { id: "calendar", name: "Takvim Yönetimi", included: true },
            { id: "earnings", name: "Kazanç Takibi", included: true },
            { id: "support", name: "7/24 Destek", included: true },
            { id: "visibility", name: "Arama Görünürlüğü", description: "Yüksek", included: true },
            { id: "analytics", name: "Profil Analitiği", included: true },
            { id: "badge", name: "Pro Rozeti", included: true },
            { id: "priority_listing", name: "Öncelikli Listeleme", included: false },
        ],
    },
    {
        id: "sitter-elite",
        tier: "elite",
        name: "Elite",
        description: "Tam zamanlı bakıcılar için",
        role: "sitter",
        monthlyPrice: 99,
        yearlyPrice: 899,
        badge: "En İyi Değer",
        features: [
            { id: "profile", name: "Profil Oluşturma", included: true },
            { id: "applications", name: "Başvuru Yapma", limit: "unlimited", included: true },
            { id: "messaging", name: "Mesajlaşma", included: true },
            { id: "calendar", name: "Takvim Yönetimi", included: true },
            { id: "earnings", name: "Kazanç Takibi", included: true },
            { id: "support", name: "7/24 Destek", included: true },
            { id: "visibility", name: "Arama Görünürlüğü", description: "Maksimum", included: true },
            { id: "analytics", name: "Profil Analitiği", included: true },
            { id: "badge", name: "Elite Rozeti", included: true },
            { id: "priority_listing", name: "Öncelikli Listeleme", included: true },
            { id: "featured_profile", name: "Ana Sayfa Öne Çıkarma", included: true },
        ],
    },
];

// Get plans by role
export function getPlansByRole(role: UserRole): SubscriptionPlan[] {
    return role === "parent" ? PARENT_PLANS : SITTER_PLANS;
}

// Get plan by ID
export function getPlanById(planId: string): SubscriptionPlan | undefined {
    return [...PARENT_PLANS, ...SITTER_PLANS].find((p) => p.id === planId);
}

// Calculate savings for yearly
export function calculateYearlySavings(plan: SubscriptionPlan): number {
    const yearlyIfMonthly = plan.monthlyPrice * 12;
    return yearlyIfMonthly - plan.yearlyPrice;
}

// Format price
export function formatPrice(price: number): string {
    if (price === 0) return "Ücretsiz";
    return `₺${price}`;
}
