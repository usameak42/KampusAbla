/**
 * SettingsPage - Main settings page with tabs
 */

import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    ArrowLeft,
    Settings,
    User,
    Bell,
    Shield,
    Lock,
    CreditCard,
    LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    AccountSettings,
    SecuritySettings,
    NotificationSettings,
    PrivacySettings,
    PaymentSettings,
} from "@/components/settings";
import { useSettings } from "@/hooks/useSettings";
import { useAuthentication } from "@/hooks/useAuthentication";
import { cn } from "@/lib/utils";

type SettingsTab = "account" | "notifications" | "privacy" | "security" | "payments";

const TABS: { value: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { value: "account", label: "Hesap", icon: <User className="h-4 w-4" /> },
    { value: "notifications", label: "Bildirimler", icon: <Bell className="h-4 w-4" /> },
    { value: "privacy", label: "Gizlilik", icon: <Shield className="h-4 w-4" /> },
    { value: "security", label: "Güvenlik", icon: <Lock className="h-4 w-4" /> },
    { value: "payments", label: "Ödemeler", icon: <CreditCard className="h-4 w-4" /> },
];

export default function SettingsPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Get initial tab from URL or default to account
    const initialTab = (searchParams.get("tab") as SettingsTab) || "account";
    const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

    // Mock current user
    const currentUserId = "user-1";
    const { handleSignOut } = useAuthentication();

    const {
        settings,
        isLoading,
        isSaving,
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
        error,
    } = useSettings({ userId: currentUserId });

    const handleTabChange = (value: string) => {
        setActiveTab(value as SettingsTab);
        setSearchParams({ tab: value });
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 via-purple-50/30 to-white">
            <div className="container max-w-3xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-semibold flex items-center gap-2">
                            <Settings className="h-5 w-5 text-gray-600" />
                            Ayarlar
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Hesap ve uygulama ayarlarınızı yönetin
                        </p>
                    </div>
                </div>

                {/* Loading state */}
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
                        ))}
                    </div>
                ) : (
                    <Tabs value={activeTab} onValueChange={handleTabChange}>
                        {/* Tab Navigation */}
                        <TabsList className="grid w-full grid-cols-5 mb-6">
                            {TABS.map((tab) => (
                                <TabsTrigger
                                    key={tab.value}
                                    value={tab.value}
                                    className="flex items-center gap-1.5 text-xs sm:text-sm"
                                >
                                    {tab.icon}
                                    <span className="hidden sm:inline">{tab.label}</span>
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        {/* Account Tab */}
                        <TabsContent value="account" className="space-y-4 mt-0">
                            <AccountSettings
                                profile={settings.profile}
                                onUpdateProfile={updateProfile}
                                isSaving={isSaving}
                            />
                        </TabsContent>

                        {/* Notifications Tab */}
                        <TabsContent value="notifications" className="space-y-4 mt-0">
                            <NotificationSettings
                                notifications={settings.notifications}
                                onUpdate={updateNotifications}
                                isSaving={isSaving}
                            />
                        </TabsContent>

                        {/* Privacy Tab */}
                        <TabsContent value="privacy" className="space-y-4 mt-0">
                            <PrivacySettings
                                privacy={settings.privacy}
                                onUpdate={updatePrivacy}
                                onRequestDataExport={requestDataExport}
                                onDeleteAccount={deleteAccount}
                                isSaving={isSaving}
                            />
                        </TabsContent>

                        {/* Security Tab */}
                        <TabsContent value="security" className="space-y-4 mt-0">
                            <SecuritySettings
                                security={settings.security}
                                onUpdateSecurity={updateSecurity}
                                onChangePassword={changePassword}
                                onRemoveDevice={removeTrustedDevice}
                                isSaving={isSaving}
                            />
                        </TabsContent>

                        {/* Payments Tab */}
                        <TabsContent value="payments" className="space-y-4 mt-0">
                            <PaymentSettings
                                payment={settings.payment}
                                onRegisterSubMerchant={registerSubMerchant}
                                onAddSavedCard={addSavedCard}
                                onRemoveSavedCard={removeSavedCard}
                                onSetDefaultCard={setDefaultCard}
                                isSaving={isSaving}
                                error={error}
                            />
                        </TabsContent>
                    </Tabs>
                )}

                {/* Sign Out */}
                <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleSignOut}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Çıkış Yap
                </Button>

                {/* App Info Footer */}
                <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
                    <p>KampusAbla v1.0.0</p>
                    <p className="text-xs mt-1">
                        <a href="/terms" className="hover:underline">Kullanım Koşulları</a>
                        {" • "}
                        <a href="/privacy" className="hover:underline">Gizlilik Politikası</a>
                        {" • "}
                        <a href="/kvkk" className="hover:underline">KVKK</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
