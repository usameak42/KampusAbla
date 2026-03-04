/**
 * Settings Types and Interfaces
 */

// User profile settings
export interface UserProfile {
    id: string;
    email: string;
    phone: string;
    name: string;
    photo?: string;
    role: "parent" | "sitter" | "admin";
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// Notification preferences
export interface NotificationPreferences {
    // Push notifications
    pushEnabled: boolean;
    // Email notifications
    emailEnabled: boolean;
    // SMS notifications
    smsEnabled: boolean;
    // Notification categories
    bookingRequests: boolean;
    bookingUpdates: boolean;
    sessionUpdates: boolean;
    newMessages: boolean;
    reviewReminders: boolean;
    paymentUpdates: boolean;
    systemAnnouncements: boolean;
    marketingEmails: boolean;
    // Quiet hours
    quietHoursEnabled: boolean;
    quietHoursStart: string; // HH:mm
    quietHoursEnd: string; // HH:mm
}

// Privacy settings
export interface PrivacySettings {
    // Profile visibility
    profileVisible: boolean;
    showOnlineStatus: boolean;
    showLastSeen: boolean;
    // Location
    locationSharingDefault: "session_only" | "always" | "never";
    // Data
    allowAnalytics: boolean;
    allowPersonalization: boolean;
}

// Security settings
export interface SecuritySettings {
    twoFactorEnabled: boolean;
    loginNotifications: boolean;
    trustedDevices: TrustedDevice[];
}

export interface TrustedDevice {
    id: string;
    name: string;
    browser: string;
    lastUsed: Date;
    isCurrent: boolean;
}

// Sub-merchant registration data (for iyzico)
export interface SubMerchantRegistration {
    legalName: string;
    identityNumber: string;
    iban: string;
    taxNumber?: string;
    contactPhone?: string;
}

// Card input for adding new cards
export interface CardInput {
    cardholderName: string;
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cvc: string;
    brand: string;
}

// Saved card (tokenized)
export interface SavedCard {
    id: string;
    token: string;
    last4: string;
    brand: string;
    cardholderName: string;
    expiryMonth: string;
    expiryYear: string;
    isDefault: boolean;
}

// Payment settings (for sitters)
export interface PaymentSettings {
    payoutMethod: "bank_transfer" | "papara";
    bankAccount?: BankAccount;
    paparaAccount?: string;
    autoPayoutEnabled: boolean;
    autoPayoutThreshold: number; // Minimum amount for auto payout
    // NEW: Add these properties
    subMerchantId?: string;
    subMerchantStatus?: "pending" | "verified" | "rejected";
    savedCards?: SavedCard[];
}

export interface BankAccount {
    bankName: string;
    iban: string;
    accountHolderName: string;
}

// Combined settings
export interface UserSettings {
    profile: UserProfile;
    notifications: NotificationPreferences;
    privacy: PrivacySettings;
    security: SecuritySettings;
    payment?: PaymentSettings;
}

// Default notification preferences
export const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
    pushEnabled: true,
    emailEnabled: true,
    smsEnabled: false,
    bookingRequests: true,
    bookingUpdates: true,
    sessionUpdates: true,
    newMessages: true,
    reviewReminders: true,
    paymentUpdates: true,
    systemAnnouncements: true,
    marketingEmails: false,
    quietHoursEnabled: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "08:00",
};

// Default privacy settings
export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
    profileVisible: true,
    showOnlineStatus: true,
    showLastSeen: true,
    locationSharingDefault: "session_only",
    allowAnalytics: true,
    allowPersonalization: true,
};

// Default security settings
export const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
    twoFactorEnabled: false,
    loginNotifications: true,
    trustedDevices: [],
};

// Setting category labels
export const SETTING_CATEGORIES = {
    account: {
        label: "Hesap",
        description: "Profil bilgilerinizi yönetin",
        icon: "user",
    },
    notifications: {
        label: "Bildirimler",
        description: "Bildirim tercihlerinizi ayarlayın",
        icon: "bell",
    },
    privacy: {
        label: "Gizlilik",
        description: "Gizlilik ayarlarınızı kontrol edin",
        icon: "shield",
    },
    security: {
        label: "Güvenlik",
        description: "Hesap güvenliği ayarları",
        icon: "lock",
    },
    payment: {
        label: "Ödeme",
        description: "Ödeme ve kazanç ayarları",
        icon: "credit-card",
    },
} as const;

export type SettingCategory = keyof typeof SETTING_CATEGORIES;
