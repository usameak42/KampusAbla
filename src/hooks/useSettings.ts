/**
 * useSettings Hook - Manages user settings
 */

import { useState, useCallback } from "react";
import type {
    UserSettings,
    UserProfile,
    NotificationPreferences,
    PrivacySettings,
    SecuritySettings,
    PaymentSettings,
    SubMerchantRegistration,
    CardInput,
    SavedCard,
} from "@/types/settings";
import { paymentService } from "@/services/payment";
import { toast } from "sonner";
import {
    DEFAULT_NOTIFICATION_PREFS,
    DEFAULT_PRIVACY_SETTINGS,
    DEFAULT_SECURITY_SETTINGS,
} from "@/types/settings";

// Mock user settings
const MOCK_SETTINGS: UserSettings = {
    profile: {
        id: "user-1",
        email: "ayse.demir@example.com",
        phone: "+90 532 123 4567",
        name: "Ayşe Demir",
        photo: "/images/avatar1.jpg",
        role: "parent",
        isVerified: true,
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-06-10"),
    },
    notifications: {
        ...DEFAULT_NOTIFICATION_PREFS,
        marketingEmails: false,
        quietHoursEnabled: true,
        quietHoursStart: "22:00",
        quietHoursEnd: "07:00",
    },
    privacy: {
        ...DEFAULT_PRIVACY_SETTINGS,
        showLastSeen: false,
    },
    security: {
        ...DEFAULT_SECURITY_SETTINGS,
        loginNotifications: true,
        trustedDevices: [
            {
                id: "device-1",
                name: "Windows PC",
                browser: "Chrome 120",
                lastUsed: new Date(),
                isCurrent: true,
            },
            {
                id: "device-2",
                name: "iPhone 14",
                browser: "Safari",
                lastUsed: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
                isCurrent: false,
            },
        ],
    },
    payment: {
        payoutMethod: "bank_transfer",
        bankAccount: {
            bankName: "Garanti BBVA",
            iban: "TR12 3456 7890 1234 5678 9012 34",
            accountHolderName: "AYŞE DEMİR",
        },
        autoPayoutEnabled: true,
        autoPayoutThreshold: 500,
        subMerchantStatus: undefined,
        savedCards: [
            {
                id: "card-1",
                token: "token-123",
                last4: "4242",
                brand: "Visa",
                cardholderName: "AYŞE DEMİR",
                expiryMonth: "12",
                expiryYear: "2026",
                isDefault: true,
            }
        ],
    },
};

interface UseSettingsOptions {
    userId: string;
}

export function useSettings({ userId }: UseSettingsOptions) {
    const [settings, setSettings] = useState<UserSettings>(MOCK_SETTINGS);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Update profile
    const updateProfile = useCallback(
        async (data: Partial<UserProfile>): Promise<void> => {
            setIsSaving(true);
            setError(null);
            try {
                // TODO: API call
                await new Promise((resolve) => setTimeout(resolve, 500));

                setSettings((prev) => ({
                    ...prev,
                    profile: { ...prev.profile, ...data, updatedAt: new Date() },
                }));
            } catch (err) {
                setError("Profil güncellenemedi");
                throw err;
            } finally {
                setIsSaving(false);
            }
        },
        []
    );

    // Update notification preferences
    const updateNotifications = useCallback(
        async (data: Partial<NotificationPreferences>): Promise<void> => {
            setIsSaving(true);
            setError(null);
            try {
                await new Promise((resolve) => setTimeout(resolve, 300));

                setSettings((prev) => ({
                    ...prev,
                    notifications: { ...prev.notifications, ...data },
                }));
            } catch (err) {
                setError("Bildirim ayarları güncellenemedi");
                throw err;
            } finally {
                setIsSaving(false);
            }
        },
        []
    );

    // Update privacy settings
    const updatePrivacy = useCallback(
        async (data: Partial<PrivacySettings>): Promise<void> => {
            setIsSaving(true);
            setError(null);
            try {
                await new Promise((resolve) => setTimeout(resolve, 300));

                setSettings((prev) => ({
                    ...prev,
                    privacy: { ...prev.privacy, ...data },
                }));
            } catch (err) {
                setError("Gizlilik ayarları güncellenemedi");
                throw err;
            } finally {
                setIsSaving(false);
            }
        },
        []
    );

    // Update security settings
    const updateSecurity = useCallback(
        async (data: Partial<SecuritySettings>): Promise<void> => {
            setIsSaving(true);
            setError(null);
            try {
                await new Promise((resolve) => setTimeout(resolve, 300));

                setSettings((prev) => ({
                    ...prev,
                    security: { ...prev.security, ...data },
                }));
            } catch (err) {
                setError("Güvenlik ayarları güncellenemedi");
                throw err;
            } finally {
                setIsSaving(false);
            }
        },
        []
    );

    // Update payment settings
    const updatePayment = useCallback(
        async (data: Partial<PaymentSettings>): Promise<void> => {
            setIsSaving(true);
            setError(null);
            try {
                await new Promise((resolve) => setTimeout(resolve, 300));

                setSettings((prev) => ({
                    ...prev,
                    payment: prev.payment ? { ...prev.payment, ...data } : undefined,
                }));
            } catch (err) {
                setError("Ödeme ayarları güncellenemedi");
                throw err;
            } finally {
                setIsSaving(false);
            }
        },
        []
    );

    // Register sub-merchant
    const registerSubMerchant = useCallback(
        async (data: SubMerchantRegistration): Promise<void> => {
            setIsSaving(true);
            setError(null);
            try {
                // In reality, this would send to our backend which talks to iyzico
                const subMerchantId = await paymentService.createSubMerchant({ ...data });

                setSettings((prev) => ({
                    ...prev,
                    payment: prev.payment ? {
                        ...prev.payment,
                        subMerchantId,
                        subMerchantStatus: "pending"
                    } : undefined,
                }));

                toast.success("Alt üye işyeri kaydı başarıyla oluşturuldu.");
            } catch (err) {
                const message = err instanceof Error ? err.message : "Kayıt sırasında bir hata oluştu";
                setError(message);
                toast.error(message);
                throw err;
            } finally {
                setIsSaving(false);
            }
        },
        []
    );

    // Add saved card
    const addSavedCard = useCallback(
        async (data: CardInput): Promise<void> => {
            setIsSaving(true);
            setError(null);
            try {
                // Tokenize card first
                const tokenResult = await paymentService.tokenizeCard({
                    cardholderName: data.cardholderName,
                    cardNumber: data.cardNumber.replace(/\s/g, ""),
                    expiryMonth: data.expiryMonth,
                    expiryYear: data.expiryYear,
                    cvc: data.cvc,
                });

                if (!tokenResult.success || !tokenResult.token) {
                    throw new Error(tokenResult.error || "Kart tokenize edilemedi");
                }

                const newCard: SavedCard = {
                    id: `card-${Math.random().toString(36).substring(2, 11)}`,
                    token: tokenResult.token,
                    last4: data.cardNumber.replace(/\s/g, "").slice(-4),
                    brand: data.brand,
                    cardholderName: data.cardholderName,
                    expiryMonth: data.expiryMonth,
                    expiryYear: data.expiryYear,
                    isDefault: (settings.payment?.savedCards?.length || 0) === 0,
                };

                setSettings((prev) => ({
                    ...prev,
                    payment: prev.payment ? {
                        ...prev.payment,
                        savedCards: [...(prev.payment.savedCards || []), newCard]
                    } : undefined,
                }));

                toast.success("Kart başarıyla eklendi.");
            } catch (err) {
                const message = err instanceof Error ? err.message : "Kart eklenemedi";
                setError(message);
                toast.error(message);
                throw err;
            } finally {
                setIsSaving(false);
            }
        },
        [settings.payment?.savedCards?.length]
    );

    // Remove saved card
    const removeSavedCard = useCallback(
        async (cardId: string): Promise<void> => {
            setIsSaving(true);
            try {
                await new Promise((resolve) => setTimeout(resolve, 500));

                setSettings((prev) => ({
                    ...prev,
                    payment: prev.payment ? {
                        ...prev.payment,
                        savedCards: prev.payment.savedCards?.filter(c => c.id !== cardId)
                    } : undefined,
                }));

                toast.success("Kart başarıyla kaldırıldı.");
            } catch (err) {
                setError("Kart kaldırılamadı");
                throw err;
            } finally {
                setIsSaving(false);
            }
        },
        []
    );

    // Set default card
    const setDefaultCard = useCallback(
        async (cardId: string): Promise<void> => {
            setIsSaving(true);
            try {
                await new Promise((resolve) => setTimeout(resolve, 300));

                setSettings((prev) => ({
                    ...prev,
                    payment: prev.payment ? {
                        ...prev.payment,
                        savedCards: prev.payment.savedCards?.map(c => ({
                            ...c,
                            isDefault: c.id === cardId
                        }))
                    } : undefined,
                }));
            } catch (err) {
                setError("Varsayılan kart değiştirilemedi");
                throw err;
            } finally {
                setIsSaving(false);
            }
        },
        []
    );

    // Change password
    const changePassword = useCallback(
        async (currentPassword: string, newPassword: string): Promise<void> => {
            setIsSaving(true);
            setError(null);
            try {
                // TODO: API call
                await new Promise((resolve) => setTimeout(resolve, 800));
                // Simulated success
            } catch (err) {
                setError("Şifre değiştirilemedi");
                throw err;
            } finally {
                setIsSaving(false);
            }
        },
        []
    );

    // Remove trusted device
    const removeTrustedDevice = useCallback(
        async (deviceId: string): Promise<void> => {
            setIsSaving(true);
            try {
                await new Promise((resolve) => setTimeout(resolve, 300));

                setSettings((prev) => ({
                    ...prev,
                    security: {
                        ...prev.security,
                        trustedDevices: prev.security.trustedDevices.filter(
                            (d) => d.id !== deviceId
                        ),
                    },
                }));
            } catch (err) {
                setError("Cihaz kaldırılamadı");
                throw err;
            } finally {
                setIsSaving(false);
            }
        }, []);

    // Request data export (KVKK)
    const requestDataExport = useCallback(async (): Promise<void> => {
        setIsSaving(true);
        setError(null);
        try {
            const { supabase } = await import('@/integrations/supabase/client');
            const { data, error: exportError } = await supabase.functions.invoke('export-user-data');

            if (exportError) {
                throw new Error('Veri dışa aktarımı başarısız oldu');
            }

            // Log the export request
            await supabase.from('data_access_logs').insert({
                user_id: settings.profile.id || '',
                action: 'data_export_requested',
                metadata: {
                    export_size_kb: data?.size_kb,
                    timestamp: new Date().toISOString(),
                } as any,
            } as any);

            toast.success('Verileriniz hazırlandı. İndirme linki e-posta adresinize gönderildi.');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Veri talebi oluşturulamadı';
            setError(message);
            toast.error(message);
            throw err;
        } finally {
            setIsSaving(false);
        }
    }, []);

    // Delete account
    const deleteAccount = useCallback(
        async (password: string): Promise<void> => {
            setIsSaving(true);
            try {
                await new Promise((resolve) => setTimeout(resolve, 1000));
                // In production, this would delete the account
            } catch (err) {
                setError("Hesap silinemedi");
                throw err;
            } finally {
                setIsSaving(false);
            }
        },
        []
    );

    // Refresh settings
    const refreshSettings = useCallback(async () => {
        setIsLoading(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 500));
            // TODO: Fetch from API
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        settings,
        isLoading,
        isSaving,
        error,
        updateProfile,
        updateNotifications,
        updatePrivacy,
        updateSecurity,
        updatePayment,
        registerSubMerchant,
        addSavedCard,
        removeSavedCard,
        setDefaultCard,
        changePassword,
        removeTrustedDevice,
        requestDataExport,
        deleteAccount,
        refreshSettings,
    };
}
