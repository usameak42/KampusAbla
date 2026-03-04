import type {
    RatingQuestion,
    ReviewTag,
    ReviewFlag,
    SitterToFamilyQuestionKey,
    SitterToChildQuestionKey,
    FamilyToSitterQuestionKey,
} from '@/types/review';

// ============================================
// SITTER TO FAMILY QUESTIONS (TAB 1)
// ============================================

export const SITTER_TO_FAMILY_QUESTIONS: RatingQuestion[] = [
    {
        key: 'communication_clarity',
        label: 'İletişim ve netlik',
        description: 'Talimatlar (pickup, adres, hedefler) ne kadar netti?',
    },
    {
        key: 'punctuality',
        label: 'Dakiklik',
        description: 'Teslim etme/pickup saatlerine uyum nasıldı?',
    },
    {
        key: 'respect_professionalism',
        label: 'Saygı ve profesyonellik',
        description: 'Davranıs ve uslup nasıldı?',
    },
    {
        key: 'boundary_compliance',
        label: 'Sınır ve kurallara uyum',
        description: 'Uygulama ici iletisim/kurallar (numara istememe vb.) ne kadar iyi?',
    },
    {
        key: 'safety_feeling',
        label: 'Guvenli ortam hissi',
        description: 'Seans boyunca kendimi ne kadar guvende hissettim?',
    },
    {
        key: 'problem_solving',
        label: 'Problem cozme',
        description: 'Beklenmedik bir durumda (gecikme, degisiklik) yaklasım nasıldı?',
    },
    {
        key: 'plan_adherence',
        label: 'Plan uyumu',
        description: 'Rota/durak/ulasım planı (onceden konusuldugu gibi) ne kadar uyumluydu?',
    },
    {
        key: 'overall_satisfaction',
        label: 'Genel memnuniyet',
        description: 'Bu aileyle tekrar calısmak ister miyim?',
    },
];

// ============================================
// SITTER TO CHILD QUESTIONS (TAB 2)
// ============================================

export const SITTER_TO_CHILD_QUESTIONS: RatingQuestion[] = [
    {
        key: 'cooperation',
        label: 'Is birligi / uyum',
        description: 'Seans boyunca is birligi nasıldı?',
    },
    {
        key: 'respect',
        label: 'Saygı',
        description: 'Soz dinleme, saygılı dil/davranıs nasıldı?',
    },
    {
        key: 'safety_behavior',
        label: 'Guvenlik',
        description: 'Riskli davranıslar (ani kacma, tehlikeli hareketler) var mıydı? (5 yıldız = guvenliydi)',
    },
    {
        key: 'homework_participation',
        label: 'Odev/calısma katılımı',
        description: 'Hedeflere katılım nasıldı?',
    },
    {
        key: 'communication_ease',
        label: 'Iletisim kolaylıgı',
        description: 'Cocukla anlasmak ve yonlendirmek ne kadar kolaydı?',
    },
    {
        key: 'emotional_regulation',
        label: 'Duygusal regulasyon',
        description: 'Kriz/ofke/aglama gibi durumları yonetmek nasıldı? (5 = kolaydı)',
    },
    {
        key: 'overall_ease',
        label: 'Genel seans kolaylıgı',
        description: 'Bu cocukla tekrar seans yapmak ister miyim?',
    },
];

// ============================================
// FAMILY TO SITTER QUESTIONS
// ============================================

export const FAMILY_TO_SITTER_QUESTIONS: RatingQuestion[] = [
    {
        key: 'punctuality_reliability',
        label: 'Dakiklik ve guvenilirlik',
        description: 'Zamanında geldi mi, soz verdigi gibi hareket etti mi?',
    },
    {
        key: 'pickup_safety',
        label: 'Pickup guvenligi',
        description: 'Okuldan teslim alma sureci ne kadar guvenli ve sorunsuzdu?',
    },
    {
        key: 'communication',
        label: 'Iletisim',
        description: 'Seans oncesi/sırası guncellemeler (mesaj/arama) yeterli miydi?',
    },
    {
        key: 'plan_compliance',
        label: 'Plan ve kurallara uyum',
        description: 'Rota/durak/ulasım planına uydu mu?',
    },
    {
        key: 'child_approach',
        label: 'Cocuga yaklasım',
        description: 'Sabır, nezaket, guven veren tutum nasıldı?',
    },
    {
        key: 'educational_contribution',
        label: 'Egitsel katkı',
        description: 'Odev yardımı / Turkce-Ingilizce pratik kalitesi nasıldı?',
    },
    {
        key: 'professionalism',
        label: 'Profesyonellik',
        description: 'Genel durus, sınır koyma, sorumluluk alma nasıldı?',
    },
    {
        key: 'trust_feeling',
        label: 'Guven hissi',
        description: 'Cocugumu emanet etme konusunda ne kadar rahattım?',
    },
    {
        key: 'overall_satisfaction',
        label: 'Genel memnuniyet',
        description: 'Tekrar booking yapar mıyım?',
    },
];

// ============================================
// TAGS
// ============================================

export const SITTER_FAMILY_TAGS: { positive: ReviewTag[]; negative: ReviewTag[] } = {
    positive: [
        { key: 'net_iletisim', label: 'Net iletisim', isPositive: true },
        { key: 'dakik', label: 'Dakik', isPositive: true },
        { key: 'saygili', label: 'Saygılı', isPositive: true },
        { key: 'esnek', label: 'Esnek', isPositive: true },
        { key: 'guvenli_ortam', label: 'Guvenli ortam', isPositive: true },
    ],
    negative: [
        { key: 'belirsiz_talimat', label: 'Belirsiz talimat', isPositive: false },
        { key: 'son_dakika_degisiklik', label: 'Son dakika degisiklik', isPositive: false },
        { key: 'gec_kaldi', label: 'Gec kaldı', isPositive: false },
        { key: 'kurallari_zorladi', label: 'Kuralları zorladı', isPositive: false },
        { key: 'rahatsiz_edici', label: 'Rahatsız edici', isPositive: false },
    ],
};

export const SITTER_CHILD_TAGS: { positive: ReviewTag[]; negative: ReviewTag[] } = {
    positive: [
        { key: 'isbirlikci', label: 'Isbirlikci', isPositive: true },
        { key: 'merakli', label: 'Meraklı', isPositive: true },
        { key: 'nazik', label: 'Nazik', isPositive: true },
        { key: 'calismaya_acik', label: 'Calısmaya acık', isPositive: true },
    ],
    negative: [
        { key: 'dikkati_daginik', label: 'Dikkati dagınık', isPositive: false },
        { key: 'cabuk_sikiliyor', label: 'Cabuk sıkılıyor', isPositive: false },
        { key: 'sinir_zorluyor', label: 'Sınır zorluyor', isPositive: false },
        { key: 'cok_hareketli', label: 'Cok hareketli', isPositive: false },
    ],
};

export const FAMILY_SITTER_TAGS: { positive: ReviewTag[]; negative: ReviewTag[] } = {
    positive: [
        { key: 'dakik', label: 'Dakik', isPositive: true },
        { key: 'guven_verici', label: 'Guven verici', isPositive: true },
        { key: 'iyi_iletisim', label: 'Iyi iletisim', isPositive: true },
        { key: 'cocukla_iyi', label: 'Cocukla iyi', isPositive: true },
        { key: 'odevde_basarili', label: 'Odevde basarılı', isPositive: true },
        { key: 'dil_pratigi_iyi', label: 'Dil pratigi iyi', isPositive: true },
    ],
    negative: [
        { key: 'gec_kaldi', label: 'Gec kaldı', isPositive: false },
        { key: 'az_iletisim', label: 'Az iletisim', isPositive: false },
        { key: 'plan_disina_cikti', label: 'Plan dısına cıktı', isPositive: false },
        { key: 'profesyonel_degil', label: 'Profesyonel degil', isPositive: false },
        { key: 'egitsel_katki_zayif', label: 'Egitsel katkı zayıf', isPositive: false },
    ],
};

// ============================================
// FLAGS
// ============================================

export const SITTER_SAFETY_FLAGS: ReviewFlag[] = [
    {
        key: 'off_platform_offer',
        label: 'Platform dısı iletisim/odeme onerisi oldu mu?',
        triggersReport: false,
    },
    {
        key: 'inappropriate_behavior',
        label: 'Rahatsız edici/uygunsuz bir davranıs yasadın mı?',
        description: 'Evetse "Raporla" akısı acılacak',
        triggersReport: true,
    },
];

export const FAMILY_CONFIRMATIONS: ReviewFlag[] = [
    {
        key: 'child_delivered_safely',
        label: 'Cocugum seans sonunda planlandıgı gibi teslim edildi.',
    },
    {
        key: 'no_off_platform_offer',
        label: 'Uygulama dısı iletisim/odeme teklif etmedi.',
    },
    {
        key: 'no_safety_issues',
        label: 'Herhangi bir guvenlik sorunu yasamadım.',
        description: 'Eger yasandıysa "Raporla"',
        triggersReport: true,
    },
];

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Calculate overall rating from detailed ratings
 * Formula: Simple average of all answered questions
 */
export function calculateOverallFromDetailed(ratings: Record<string, number>): number {
    const values = Object.values(ratings).filter((v) => v > 0);
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return Math.round((sum / values.length) * 10) / 10; // Round to 1 decimal
}

/**
 * Validate minimum required ratings
 * Rule: At least 3 questions must be rated
 */
export function validateMinimumRatings(
    ratings: Record<string, number>,
    minRequired: number = 3
): { valid: boolean; count: number; missing: number } {
    const count = Object.values(ratings).filter((v) => v > 0).length;
    return {
        valid: count >= minRequired,
        count,
        missing: Math.max(0, minRequired - count),
    };
}

/**
 * Check if any flag triggers a report
 */
export function hasReportTrigger(
    flags: Record<string, boolean>,
    flagDefinitions: ReviewFlag[]
): boolean {
    return flagDefinitions.some(
        (flag) => flag.triggersReport && flags[flag.key] === true
    );
}
