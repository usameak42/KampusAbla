/**
 * Notification Preferences Settings Component
 * Allows users to control which types of notifications they receive
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface NotificationPreferencesState {
    booking_requests: boolean;
    booking_confirmations: boolean;
    booking_cancellations: boolean;
    messages: boolean;
    session_updates: boolean;
    reviews: boolean;
    marketing: boolean;
}

export function NotificationPreferences() {
    const { user } = useAuth();
    const [preferences, setPreferences] = useState<NotificationPreferencesState>({
        booking_requests: true,
        booking_confirmations: true,
        booking_cancellations: true,
        messages: true,
        session_updates: true,
        reviews: true,
        marketing: false,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Load preferences from user_settings table
    useEffect(() => {
        if (!user) return;

        const loadPreferences = async () => {
            try {
                const { data, error } = await supabase
                    .from('user_settings')
                    .select('notification_preferences')
                    .eq('user_id', user.id)
                    .single();

                if (error && error.code !== 'PGRST116') throw error;

                if (data?.notification_preferences) {
                    const prefs = data.notification_preferences as Record<string, boolean>;
                    setPreferences({
                        booking_requests: prefs.bookingRequests ?? true,
                        booking_confirmations: prefs.bookingConfirmations ?? true,
                        booking_cancellations: prefs.statusUpdates ?? true,
                        messages: prefs.messages ?? true,
                        session_updates: prefs.statusUpdates ?? true,
                        reviews: prefs.statusUpdates ?? true,
                        marketing: prefs.marketingEmails ?? false,
                    });
                }
            } catch (error) {
                console.error('Error loading preferences:', error);
                toast.error("Bildirim tercihleri yüklenemedi");
            } finally {
                setIsLoading(false);
            }
        };

        loadPreferences();
    }, [user]);

    // Save preferences
    const handleSave = async () => {
        if (!user) return;

        setIsSaving(true);
        try {
            const notificationPrefs = {
                bookingRequests: preferences.booking_requests,
                bookingConfirmations: preferences.booking_confirmations,
                statusUpdates: preferences.session_updates,
                messages: preferences.messages,
                marketingEmails: preferences.marketing,
                pushNotifications: true,
                emailNotifications: true,
                smsNotifications: false,
            };

            const { error } = await supabase
                .from('user_settings')
                .upsert({
                    user_id: user.id,
                    notification_preferences: notificationPrefs,
                }, { onConflict: 'user_id' });

            if (error) throw error;

            toast.success("Bildirim tercihleriniz güncellendi");
        } catch (error) {
            console.error('Error saving preferences:', error);
            toast.error("Bildirim tercihleri kaydedilemedi");
        } finally {
            setIsSaving(false);
        }
    };

    // Toggle preference
    const togglePreference = (key: keyof NotificationPreferencesState) => {
        setPreferences(prev => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    // Enable all
    const enableAll = () => {
        setPreferences({
            booking_requests: true,
            booking_confirmations: true,
            booking_cancellations: true,
            messages: true,
            session_updates: true,
            reviews: true,
            marketing: true,
        });
    };

    // Disable all
    const disableAll = () => {
        setPreferences({
            booking_requests: false,
            booking_confirmations: false,
            booking_cancellations: false,
            messages: false,
            session_updates: false,
            reviews: false,
            marketing: false,
        });
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Bildirim Tercihleri
                </CardTitle>
                <CardDescription>
                    Hangi bildirim türlerini almak istediğinizi seçin
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Quick Actions */}
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={enableAll} className="flex-1">
                        <Bell className="h-4 w-4 mr-2" />
                        Tümünü Aç
                    </Button>
                    <Button variant="outline" size="sm" onClick={disableAll} className="flex-1">
                        <BellOff className="h-4 w-4 mr-2" />
                        Tümünü Kapat
                    </Button>
                </div>

                {/* Notification Types */}
                <div className="space-y-4">
                    {([
                        { key: 'booking_requests' as const, label: 'Rezervasyon Başvuruları', desc: 'Yeni rezervasyon başvuruları geldiğinde bildirim al' },
                        { key: 'booking_confirmations' as const, label: 'Rezervasyon Onayları', desc: 'Rezervasyonlar onaylandığında bildirim al' },
                        { key: 'booking_cancellations' as const, label: 'Rezervasyon İptalleri', desc: 'Rezervasyonlar iptal edildiğinde bildirim al' },
                        { key: 'messages' as const, label: 'Mesajlar', desc: 'Yeni mesaj geldiğinde bildirim al' },
                        { key: 'session_updates' as const, label: 'Seans Güncellemeleri', desc: 'Seans durumu değiştiğinde bildirim al' },
                        { key: 'reviews' as const, label: 'Değerlendirmeler', desc: 'Değerlendirme hatırlatmaları al' },
                    ]).map(({ key, label, desc }) => (
                        <div key={key} className="flex items-center justify-between space-x-2">
                            <div className="flex-1">
                                <Label htmlFor={key} className="font-medium">{label}</Label>
                                <p className="text-sm text-muted-foreground">{desc}</p>
                            </div>
                            <Switch id={key} checked={preferences[key]} onCheckedChange={() => togglePreference(key)} />
                        </div>
                    ))}

                    {/* Marketing - separated */}
                    <div className="flex items-center justify-between space-x-2 border-t pt-4">
                        <div className="flex-1">
                            <Label htmlFor="marketing" className="font-medium">Pazarlama Bildirimleri</Label>
                            <p className="text-sm text-muted-foreground">Kampanyalar ve özel teklifler hakkında bildirim al</p>
                        </div>
                        <Switch id="marketing" checked={preferences.marketing} onCheckedChange={() => togglePreference('marketing')} />
                    </div>
                </div>

                {/* Save Button */}
                <Button onClick={handleSave} disabled={isSaving} className="w-full">
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Değişiklikleri Kaydet
                </Button>

                {/* KVKK Notice */}
                <p className="text-xs text-muted-foreground">
                    💡 <strong>KVKK:</strong> Bildirim tercihleriniz istediğiniz zaman değiştirilebilir.
                    Pazarlama bildirimleri için açık rızanız gereklidir.
                </p>
            </CardContent>
        </Card>
    );
}
