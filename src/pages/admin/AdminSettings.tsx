import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Save, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminSettings() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    // Mock settings state
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
        // Simulate API call
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
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Genel Kontroller
                        </CardTitle>
                        <CardDescription>
                            Sistem erişimi ve kayıt yönetimi
                        </CardDescription>
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

                <Card>
                    <CardHeader>
                        <CardTitle>Operasyonel Ayarlar</CardTitle>
                        <CardDescription>
                            Rezervasyon kuralları ve platform parametreleri
                        </CardDescription>
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
