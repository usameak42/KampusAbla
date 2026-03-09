import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Save, AlertTriangle, Star, StarOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdminQuickActions } from "@/hooks/useAdminQuickActions";

export default function AdminSettings() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const { allActions, quickActionIds, toggleAction } = useAdminQuickActions();

    const [settings, setSettings] = useState({
        maintenanceMode: false,
        allowRegistrations: true,
        requirePhoneVerification: true,
        maxBookingDuration: 8,
        commissionRate: 15,
        adminEmail: "admin@kampusabla.com"
    });

    const handleSave = () => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            toast({
                title: "Ayarlar Kaydedildi",
                description: "Sistem ayarları başarıyla güncellendi.",
            });
        }, 1000);
    };

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Sistem Ayarları</h1>
                    <p className="text-muted-foreground mt-2">
                        Platform genelindeki yapılandırmaları ve kısıtlamaları yönetin.
                    </p>
                </div>
                <Button onClick={handleSave} disabled={isLoading}>
                    <Save className="mr-2 h-4 w-4" />
                    {isLoading ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
                </Button>
            </div>

            <div className="grid gap-6">
                {/* Quick Actions Customization */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Star className="h-5 w-5 text-amber-500" />
                            Hızlı Erişim Özelleştirme
                        </CardTitle>
                        <CardDescription>
                            Dashboard'da gösterilecek hızlı erişim kısayollarını seçin. Yıldızlı olanlar hızlı erişimde görünür.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {allActions.map((action) => {
                                const isPinned = quickActionIds.includes(action.id);
                                return (
                                    <div
                                        key={action.id}
                                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                                            isPinned
                                                ? "border-amber-500/50 bg-amber-500/5"
                                                : "border-border bg-muted/30 hover:bg-muted/50"
                                        }`}
                                        onClick={() => toggleAction(action.id)}
                                    >
                                        <div className="p-2 rounded-lg bg-muted">
                                            <action.icon className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium">{action.label}</p>
                                            <p className="text-xs text-muted-foreground truncate">{action.description}</p>
                                        </div>
                                        {isPinned ? (
                                            <Star className="h-4 w-4 fill-amber-400 text-amber-400 shrink-0" />
                                        ) : (
                                            <StarOff className="h-4 w-4 text-muted-foreground shrink-0" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* General Controls */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Genel Kontroller
                        </CardTitle>
                        <CardDescription>Sistem erişimi ve kayıt yönetimi</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Bakım Modu</Label>
                                <p className="text-sm text-muted-foreground">
                                    Aktif edildiğinde sadece adminler siteye erişebilir.
                                </p>
                            </div>
                            <Switch
                                checked={settings.maintenanceMode}
                                onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
                            />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Yeni Kayıt Alımı</Label>
                                <p className="text-sm text-muted-foreground">
                                    Parent ve Sitter kayıtlarını geçici olarak durdur.
                                </p>
                            </div>
                            <Switch
                                checked={settings.allowRegistrations}
                                onCheckedChange={(checked) => setSettings({ ...settings, allowRegistrations: checked })}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Operational Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Operasyonel Ayarlar</CardTitle>
                        <CardDescription>Rezervasyon kuralları ve platform parametreleri</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Komisyon Oranı (%)</Label>
                                <Input
                                    type="number"
                                    value={settings.commissionRate}
                                    onChange={(e) => setSettings({ ...settings, commissionRate: parseInt(e.target.value) })}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Bakıcı ödemelerinden kesilecek platform payı.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label>Maksimum Rezervasyon Süresi (Saat)</Label>
                                <Input
                                    type="number"
                                    value={settings.maxBookingDuration}
                                    onChange={(e) => setSettings({ ...settings, maxBookingDuration: parseInt(e.target.value) })}
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                            <div className="space-y-0.5">
                                <Label className="text-base">Zorunlu Telefon Doğrulama</Label>
                                <p className="text-sm text-muted-foreground">
                                    Kullanıcıların işlem yapabilmesi için telefon onayı şart koşulsun.
                                </p>
                            </div>
                            <Switch
                                checked={settings.requirePhoneVerification}
                                onCheckedChange={(checked) => setSettings({ ...settings, requirePhoneVerification: checked })}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
