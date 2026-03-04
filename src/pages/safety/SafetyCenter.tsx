/**
 * Safety Center Page - Hub for safety features
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ReportIncident, type IncidentReport } from "@/components/safety/ReportIncident";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Shield,
    AlertTriangle,
    Phone,
    FileText,
    MapPin,
    Lock,
    Eye,
    ChevronRight,
    MessageSquare,
    Users,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SafetyCenter() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    const handleReportSubmit = async (report: IncidentReport) => {
        // TODO: Submit to Supabase
        await new Promise((resolve) => setTimeout(resolve, 1000));
        toast({
            title: "Rapor Gönderildi",
            description: "Raporunuz güvenlik ekibimize iletildi.",
        });
    };

    const emergencyContacts = [
        { name: "Acil Yardım", number: "112", color: "bg-red-500" },
        { name: "Polis", number: "155", color: "bg-blue-500" },
        { name: "KampusAbla Destek", number: "+90 850 XXX XX XX", color: "bg-primary" },
    ];

    const safetyFeatures = [
        {
            icon: MapPin,
            title: "Canlı Konum Takibi",
            description: "Oturum sırasında bakıcının konumunu takip edin",
            action: () => navigate("/session"),
        },
        {
            icon: Shield,
            title: "Kimlik Doğrulama",
            description: "Tüm bakıcılar üniversite kimliği ile doğrulanır",
            badge: "Aktif",
        },
        {
            icon: Users,
            title: "Referans Sistemi",
            description: "Bakıcı değerlendirme ve referanslarını görün",
            action: () => navigate("/sitters"),
        },
        {
            icon: Lock,
            title: "Güvenli Ödeme",
            description: "Tüm ödemeler platform üzerinden güvenle yapılır",
            badge: "Koruma Altında",
        },
    ];

    const privacySettings = [
        {
            icon: MapPin,
            title: "Konum Paylaşımı",
            description: "Oturum sırasında konum paylaşım tercihleriniz",
            status: "Sadece Oturum",
        },
        {
            icon: Eye,
            title: "Profil Görünürlüğü",
            description: "Profilinizi kimlerin görebileceğini ayarlayın",
            status: "Herkes",
        },
        {
            icon: MessageSquare,
            title: "Mesaj Ayarları",
            description: "Kimlerden mesaj alabileceğinizi belirleyin",
            status: "Sadece Eşleşmeler",
        },
    ];

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Shield className="h-8 w-8 text-primary" />
                    Güvenlik Merkezi
                </h1>
                <p className="text-muted-foreground mt-1">
                    Güvenliğiniz bizim için en önemli önceliktir
                </p>
            </div>

            {/* Emergency Section */}
            <Card className="border-red-200 bg-red-50/50">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2 text-red-700">
                        <AlertTriangle className="h-5 w-5" />
                        Acil Durum
                    </CardTitle>
                    <CardDescription className="text-red-600">
                        Acil bir tehlike durumunda hemen aşağıdaki numaraları arayın
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {emergencyContacts.map((contact) => (
                            <Button
                                key={contact.number}
                                variant="outline"
                                className="h-auto py-4 border-red-200 hover:bg-red-100"
                                onClick={() => window.location.href = `tel:${contact.number}`}
                            >
                                <div className="flex items-center gap-3 w-full">
                                    <div className={`w-10 h-10 ${contact.color} rounded-full flex items-center justify-center`}>
                                        <Phone className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-medium">{contact.name}</p>
                                        <p className="text-sm text-muted-foreground">{contact.number}</p>
                                    </div>
                                </div>
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Report Button */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                                <FileText className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Olay Bildir</h3>
                                <p className="text-sm text-muted-foreground">
                                    Uygunsuz davranış veya sorun bildirmek için
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            className="border-orange-200 text-orange-600 hover:bg-orange-50"
                            onClick={() => setIsReportModalOpen(true)}
                        >
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Olay Bildir
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Safety Features */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Güvenlik Özellikleri</CardTitle>
                    <CardDescription>
                        Platformumuzda uygulanan güvenlik önlemleri
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {safetyFeatures.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <div
                                key={index}
                                className={`flex items-center justify-between p-3 rounded-lg ${feature.action ? "hover:bg-muted/50 cursor-pointer" : "bg-muted/30"
                                    }`}
                                onClick={feature.action}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                        <Icon className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{feature.title}</p>
                                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                                    </div>
                                </div>
                                {feature.badge ? (
                                    <Badge variant="outline" className="text-green-600 border-green-600">
                                        {feature.badge}
                                    </Badge>
                                ) : (
                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                )}
                            </div>
                        );
                    })}
                </CardContent>
            </Card>

            {/* Privacy Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Gizlilik Ayarları</CardTitle>
                    <CardDescription>
                        Kişisel verilerinizin nasıl kullanıldığını kontrol edin
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {privacySettings.map((setting, index) => {
                        const Icon = setting.icon;
                        return (
                            <div
                                key={index}
                                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    <Icon className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="font-medium">{setting.title}</p>
                                        <p className="text-sm text-muted-foreground">{setting.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary">{setting.status}</Badge>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </div>
                            </div>
                        );
                    })}
                </CardContent>
            </Card>

            {/* KVKK Info */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                        <Lock className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="text-sm text-muted-foreground">
                            <p className="font-medium text-foreground mb-1">KVKK ve Gizlilik</p>
                            <p>
                                Kişisel verileriniz 6698 sayılı KVKK kapsamında korunmaktadır.
                                Verilerinizin nasıl işlendiğini öğrenmek için{" "}
                                <Button variant="link" className="p-0 h-auto text-primary">
                                    Gizlilik Politikası
                                </Button>
                                'nı inceleyebilirsiniz.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Report Modal */}
            <ReportIncident
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                onSubmit={handleReportSubmit}
            />
        </div>
    );
}
