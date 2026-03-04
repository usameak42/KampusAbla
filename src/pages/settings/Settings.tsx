/**
 * Settings Page - User settings with multiple tabs
 */

import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthentication } from "@/hooks/useAuthentication";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import {
    User,
    Bell,
    Shield,
    Mail,
    Phone,
    Lock,
    CheckCircle2,
    AlertCircle,
    AlertTriangle,
    Loader2
} from "lucide-react";

interface ConsentAuditEntry {
    id: string;
    consentType: string;
    granted: boolean;
    grantedAt: string | null;
    createdAt: string;
    ipAddress: string | null;
}

interface DataProcessingRecord {
    id: string;
    purpose: string;
    categories: string[];
    legalBasis: string;
    retention: string;
}

export default function Settings() {
    const { user } = useAuth();
    const { handleSignOut } = useAuthentication();

    const role = user?.user_metadata?.role as "parent" | "sitter" | undefined;
    const email = user?.email || "";
    const phone = user?.phone || "";
    const [consentAudit, setConsentAudit] = useState<ConsentAuditEntry[]>([]);
    const [consentLoading, setConsentLoading] = useState(false);
    const [consentError, setConsentError] = useState<string | null>(null);

    const consentLabels = useMemo(
        () => ({
            data_processing: "Veri İşleme Onayı",
            location_tracking: "Konum Takibi Onayı",
            child_data_processing: "Çocuk Verisi İşleme Onayı",
        }),
        []
    );

    const dataProcessingRecords = useMemo<DataProcessingRecord[]>(
        () => [
            {
                id: "booking-management",
                purpose: "Rezervasyon yönetimi ve hizmet yürütme",
                categories: ["Kimlik", "İletişim", "Çocuk profili", "Rezervasyon detayları"],
                legalBasis: "Sözleşmenin kurulması ve ifası",
                retention: "Hukuki yükümlülükler gereği 10 yıl",
            },
            {
                id: "safety-compliance",
                purpose: "Güvenlik doğrulamaları ve KVKK uyumluluğu",
                categories: ["Kimlik belgeleri", "Doğrulama kayıtları", "Konum verileri"],
                legalBasis: "Meşru menfaat / yasal yükümlülük",
                retention: "Yasal zorunluluk süresince",
            },
            {
                id: "support-quality",
                purpose: "Destek, şikayet ve kalite süreçleri",
                categories: ["İletişim kayıtları", "Geri bildirim", "Şikayetler"],
                legalBasis: "Meşru menfaat",
                retention: "2 yıl",
            },
        ],
        []
    );

    useEffect(() => {
        const fetchConsentAudit = async () => {
            if (!user?.id) return;
            setConsentLoading(true);
            setConsentError(null);

            const { data, error } = await supabase
                .from("kvkk_consents")
                .select("id, consent_type, granted, granted_at, created_at, ip_address")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) {
                setConsentError("KVKK onay geçmişi yüklenemedi.");
                setConsentLoading(false);
                return;
            }

            const mapped = (data ?? []).map((entry) => ({
                id: entry.id,
                consentType: entry.consent_type,
                granted: entry.granted ?? false,
                grantedAt: entry.granted_at,
                createdAt: entry.created_at,
                ipAddress: entry.ip_address,
            }));

            setConsentAudit(mapped);
            setConsentLoading(false);
        };

        fetchConsentAudit();
    }, [user?.id]);

    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">Ayarlar</h1>

                <Tabs defaultValue="account" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="account">
                            <User className="h-4 w-4 mr-2" />
                            Hesap
                        </TabsTrigger>
                        <TabsTrigger value="notifications">
                            <Bell className="h-4 w-4 mr-2" />
                            Bildirimler
                        </TabsTrigger>
                        <TabsTrigger value="privacy">
                            <Shield className="h-4 w-4 mr-2" />
                            Gizlilik
                        </TabsTrigger>
                    </TabsList>

                    {/* Account Tab */}
                    <TabsContent value="account" className="space-y-6">
                        <Card>
                            <CardContent className="p-6 space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold mb-4">İletişim Bilgileri</h3>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="email">E-posta</Label>
                                            <div className="flex gap-2">
                                                <div className="flex-1 relative">
                                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        id="email"
                                                        value={email}
                                                        disabled
                                                        className="pl-10"
                                                    />
                                                </div>
                                                <Badge variant="secondary" className="flex items-center gap-1">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    Doğrulandı
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Telefon</Label>
                                            <div className="flex gap-2">
                                                <div className="flex-1 relative">
                                                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        id="phone"
                                                        value={phone || "Belirtilmemiş"}
                                                        disabled
                                                        className="pl-10"
                                                    />
                                                </div>
                                                {phone && (
                                                    <Badge variant="secondary" className="flex items-center gap-1">
                                                        <CheckCircle2 className="h-3 w-3" />
                                                        Doğrulandı
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t pt-6">
                                    <h3 className="text-lg font-semibold mb-4">Şifre</h3>
                                    <Button variant="outline">
                                        <Lock className="h-4 w-4 mr-2" />
                                        Şifreyi Değiştir
                                    </Button>
                                </div>

                                <div className="border-t pt-6">
                                    <h3 className="text-lg font-semibold mb-4">Üyelik</h3>
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="font-medium">
                                                {role === "parent" ? "Veli Hesabı" : "Bakıcı Hesabı"}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Ücretsiz Plan
                                            </p>
                                        </div>
                                        <Button variant="outline" size="sm">
                                            Premium'a Geç
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Notifications Tab */}
                    <TabsContent value="notifications" className="space-y-6">
                        <Card>
                            <CardContent className="p-6 space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold mb-4">E-posta Bildirimleri</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">Rezervasyon Bildirimleri</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Yeni rezervasyon ve güncellemeler
                                                </p>
                                            </div>
                                            <Switch defaultChecked />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">Mesaj Bildirimleri</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Yeni mesajlar geldiğinde bildir
                                                </p>
                                            </div>
                                            <Switch defaultChecked />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">Pazarlama E-postaları</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Özel teklifler ve haberler
                                                </p>
                                            </div>
                                            <Switch />
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t pt-6">
                                    <h3 className="text-lg font-semibold mb-4">SMS Bildirimleri</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">Rezervasyon Hatırlatıcıları</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Seans öncesi hatırlatma
                                                </p>
                                            </div>
                                            <Switch defaultChecked />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">Güvenlik Uyarıları</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Önemli hesap aktiviteleri
                                                </p>
                                            </div>
                                            <Switch defaultChecked />
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t pt-6">
                                    <h3 className="text-lg font-semibold mb-4">Push Bildirimleri</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">Anlık Bildirimler</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Tarayıcı bildirimleri
                                                </p>
                                            </div>
                                            <Switch />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Privacy Tab */}
                    <TabsContent value="privacy" className="space-y-6">
                        <Card>
                            <CardContent className="p-6 space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold mb-4">KVKK Onayları</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                                            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                                            <div className="flex-1">
                                                <p className="font-medium text-green-900">Veri İşleme Onayı</p>
                                                <p className="text-sm text-green-700">
                                                    {new Date().toLocaleDateString("tr-TR")} tarihinde onaylandı
                                                </p>
                                            </div>
                                        </div>

                                        {role === "sitter" && (
                                            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                                                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                                                <div className="flex-1">
                                                    <p className="font-medium text-green-900">Konum Takibi Onayı</p>
                                                    <p className="text-sm text-green-700">
                                                        Seans sırasında konum paylaşımı
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="border-t pt-6">
                                    <h3 className="text-lg font-semibold mb-4">Onay Kayıtları (Audit Trail)</h3>
                                    {consentLoading ? (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            KVKK onay geçmişi yükleniyor...
                                        </div>
                                    ) : consentError ? (
                                        <Alert variant="destructive">
                                            <AlertTriangle className="h-4 w-4" />
                                            <AlertDescription>{consentError}</AlertDescription>
                                        </Alert>
                                    ) : consentAudit.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">
                                            Henüz kayıtlı bir KVKK onay geçmişi bulunmuyor.
                                        </p>
                                    ) : (
                                        <div className="space-y-3">
                                            {consentAudit.map((entry) => {
                                                const label =
                                                    consentLabels[entry.consentType as keyof typeof consentLabels] ??
                                                    "KVKK Onayı";
                                                const eventDate = new Date(
                                                    entry.grantedAt ?? entry.createdAt
                                                ).toLocaleDateString("tr-TR");
                                                return (
                                                    <div
                                                        key={entry.id}
                                                        className={`flex items-start gap-3 rounded-lg border p-4 ${
                                                            entry.granted
                                                                ? "border-green-200 bg-green-50"
                                                                : "border-amber-200 bg-amber-50"
                                                        }`}
                                                    >
                                                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                                                        <div className="flex-1">
                                                            <p className="font-medium text-foreground">{label}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {entry.granted
                                                                    ? `${eventDate} tarihinde onaylandı`
                                                                    : `${eventDate} tarihinde reddedildi`}
                                                            </p>
                                                            {entry.ipAddress && (
                                                                <p className="text-xs text-muted-foreground">
                                                                    IP: {entry.ipAddress}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                <div className="border-t pt-6">
                                    <h3 className="text-lg font-semibold mb-4">Veri İşleme Kayıtları</h3>
                                    <div className="space-y-3">
                                        {dataProcessingRecords.map((record) => (
                                            <div key={record.id} className="rounded-lg border p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="font-medium text-foreground">{record.purpose}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            Hukuki dayanak: {record.legalBasis}
                                                        </p>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">
                                                        Saklama: {record.retention}
                                                    </span>
                                                </div>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {record.categories.map((category) => (
                                                        <Badge key={category} variant="secondary">
                                                            {category}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="mt-3 text-xs text-muted-foreground">
                                        İşleme faaliyetleri kayıtları KVKK kapsamında düzenli olarak güncellenir.
                                    </p>
                                </div>

                                <div className="border-t pt-6">
                                    <h3 className="text-lg font-semibold mb-4">Veri Kontrolleri</h3>
                                    <div className="space-y-3">
                                        <Button variant="outline" className="w-full justify-start">
                                            Verilerimi İndir
                                        </Button>
                                        <Button variant="outline" className="w-full justify-start">
                                            KVKK Aydınlatma Metni
                                        </Button>
                                    </div>
                                </div>

                                <div className="border-t pt-6">
                                    <h3 className="text-lg font-semibold mb-4 text-red-600">Tehlikeli Bölge</h3>
                                    <Alert variant="destructive" className="mb-4">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>
                                            Hesabınızı sildiğinizde tüm verileriniz kalıcı olarak silinecektir.
                                            Bu işlem geri alınamaz.
                                        </AlertDescription>
                                    </Alert>
                                    <Button variant="destructive">
                                        Hesabımı Sil
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
