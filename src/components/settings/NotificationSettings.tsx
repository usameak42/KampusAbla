/**
 * NotificationSettings - Notification preferences
 */

import { Bell, Mail, MessageSquare, Moon, Clock } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SettingsSection, SettingsItem } from "./SettingsSection";
import type { NotificationPreferences } from "@/types/settings";

interface NotificationSettingsProps {
    notifications: NotificationPreferences;
    onUpdate: (data: Partial<NotificationPreferences>) => Promise<void>;
    isSaving: boolean;
}

export function NotificationSettings({
    notifications,
    onUpdate,
    isSaving,
}: NotificationSettingsProps) {
    return (
        <>
            {/* Channels */}
            <SettingsSection
                title="Bildirim Kanalları"
                description="Bildirimleri nasıl almak istiyorsunuz?"
            >
                <SettingsItem
                    icon={<Bell className="h-4 w-4" />}
                    label="Push Bildirimleri"
                    description="Cihaz bildirimleri"
                    action={
                        <Switch
                            checked={notifications.pushEnabled}
                            onCheckedChange={(checked) =>
                                onUpdate({ pushEnabled: checked })
                            }
                        />
                    }
                />
                <SettingsItem
                    icon={<Mail className="h-4 w-4" />}
                    label="E-posta Bildirimleri"
                    description="Önemli güncellemeler için e-posta"
                    action={
                        <Switch
                            checked={notifications.emailEnabled}
                            onCheckedChange={(checked) =>
                                onUpdate({ emailEnabled: checked })
                            }
                        />
                    }
                />
                <SettingsItem
                    icon={<MessageSquare className="h-4 w-4" />}
                    label="SMS Bildirimleri"
                    description="Acil durumlar için SMS"
                    action={
                        <Switch
                            checked={notifications.smsEnabled}
                            onCheckedChange={(checked) =>
                                onUpdate({ smsEnabled: checked })
                            }
                        />
                    }
                />
            </SettingsSection>

            {/* Categories */}
            <SettingsSection
                title="Bildirim Kategorileri"
                description="Hangi olaylardan haberdar olmak istiyorsunuz?"
            >
                <SettingsItem
                    label="Rezervasyon İstekleri"
                    description="Yeni rezervasyon talepleri"
                    action={
                        <Switch
                            checked={notifications.bookingRequests}
                            onCheckedChange={(checked) =>
                                onUpdate({ bookingRequests: checked })
                            }
                        />
                    }
                />
                <SettingsItem
                    label="Rezervasyon Güncellemeleri"
                    description="Onay, iptal ve değişiklikler"
                    action={
                        <Switch
                            checked={notifications.bookingUpdates}
                            onCheckedChange={(checked) =>
                                onUpdate({ bookingUpdates: checked })
                            }
                        />
                    }
                />
                <SettingsItem
                    label="Seans Durumu"
                    description="Seans başlangıç, konum ve durum güncellemeleri"
                    action={
                        <Switch
                            checked={notifications.sessionUpdates}
                            onCheckedChange={(checked) =>
                                onUpdate({ sessionUpdates: checked })
                            }
                        />
                    }
                />
                <SettingsItem
                    label="Yeni Mesajlar"
                    description="Anlık mesajlaşma bildirimleri"
                    action={
                        <Switch
                            checked={notifications.newMessages}
                            onCheckedChange={(checked) =>
                                onUpdate({ newMessages: checked })
                            }
                        />
                    }
                />
                <SettingsItem
                    label="Değerlendirme Hatırlatmaları"
                    description="Seans sonrası değerlendirme hatırlatıcıları"
                    action={
                        <Switch
                            checked={notifications.reviewReminders}
                            onCheckedChange={(checked) =>
                                onUpdate({ reviewReminders: checked })
                            }
                        />
                    }
                />
                <SettingsItem
                    label="Ödeme Güncellemeleri"
                    description="Ödeme ve kazanç bildirimleri"
                    action={
                        <Switch
                            checked={notifications.paymentUpdates}
                            onCheckedChange={(checked) =>
                                onUpdate({ paymentUpdates: checked })
                            }
                        />
                    }
                />
                <SettingsItem
                    label="Sistem Duyuruları"
                    description="Yeni özellik ve bakım duyuruları"
                    action={
                        <Switch
                            checked={notifications.systemAnnouncements}
                            onCheckedChange={(checked) =>
                                onUpdate({ systemAnnouncements: checked })
                            }
                        />
                    }
                />
                <Separator className="my-2" />
                <SettingsItem
                    label="Pazarlama E-postaları"
                    description="Kampanya ve fırsatlar"
                    action={
                        <Switch
                            checked={notifications.marketingEmails}
                            onCheckedChange={(checked) =>
                                onUpdate({ marketingEmails: checked })
                            }
                        />
                    }
                />
            </SettingsSection>

            {/* Quiet Hours */}
            <SettingsSection
                title="Sessiz Saatler"
                description="Bu saatler arasında bildirim almayın"
            >
                <SettingsItem
                    icon={<Moon className="h-4 w-4" />}
                    label="Sessiz Saatleri Etkinleştir"
                    description="Belirlenen saatlerde bildirimleri sustur"
                    action={
                        <Switch
                            checked={notifications.quietHoursEnabled}
                            onCheckedChange={(checked) =>
                                onUpdate({ quietHoursEnabled: checked })
                            }
                        />
                    }
                />

                {notifications.quietHoursEnabled && (
                    <div className="flex flex-wrap items-center gap-4 px-3 py-2 mt-2 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-2">
                            <Label className="text-sm shrink-0">Başlangıç:</Label>
                            <Input
                                type="time"
                                value={notifications.quietHoursStart}
                                onChange={(e) =>
                                    onUpdate({ quietHoursStart: e.target.value })
                                }
                                className="w-auto min-w-[100px] h-9"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Label className="text-sm shrink-0">Bitiş:</Label>
                            <Input
                                type="time"
                                value={notifications.quietHoursEnd}
                                onChange={(e) =>
                                    onUpdate({ quietHoursEnd: e.target.value })
                                }
                                className="w-auto min-w-[100px] h-9"
                            />
                        </div>
                    </div>
                )}
            </SettingsSection>
        </>
    );
}
