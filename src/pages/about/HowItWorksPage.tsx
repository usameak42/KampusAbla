/**
 * HowItWorksPage - Explains how the platform works
 */

import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Search,
    UserCheck,
    Calendar,
    Shield,
    Star,
    CreditCard,
    MessageCircle,
    Clock,
    ChevronRight,
    CheckCircle,
    GraduationCap,
    Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StepItem {
    icon: React.ReactNode;
    title: string;
    description: string;
    features?: string[];
}

const PARENT_STEPS: StepItem[] = [
    {
        icon: <Search className="h-6 w-6" />,
        title: "Bakıcı Ara",
        description: "Konumunuza ve ihtiyaçlarınıza göre üniversite öğrencisi bakıcıları keşfedin.",
        features: [
            "Uygunluk filtresi",
            "Değerlendirme puanları",
            "Profil detayları",
        ],
    },
    {
        icon: <UserCheck className="h-6 w-6" />,
        title: "Profilleri İncele",
        description: "Bakıcıların eğitim geçmişini, deneyimlerini ve değerlendirmelerini inceleyin.",
        features: [
            "Doğrulanmış kimlik",
            "Öğrenci belgesi",
            "Sabıka kaydı kontrolü",
        ],
    },
    {
        icon: <Calendar className="h-6 w-6" />,
        title: "Rezervasyon Yap",
        description: "Uygun tarih ve saati seçerek rezervasyon talebinizi gönderin.",
        features: [
            "Anlık müsaitlik",
            "Esnek saatler",
            "Kolay iptal",
        ],
    },
    {
        icon: <CreditCard className="h-6 w-6" />,
        title: "Güvenli Ödeme",
        description: "Tüm ödemeler platform üzerinden güvenle gerçekleşir.",
        features: [
            "Sigortalı ödeme",
            "İade garantisi",
            "Şeffaf fiyatlandırma",
        ],
    },
    {
        icon: <Shield className="h-6 w-6" />,
        title: "Takip Et",
        description: "Seans sırasında konum paylaşımı ve anlık güncellemeler alın.",
        features: [
            "Canlı konum",
            "SOS butonu",
            "7/24 destek",
        ],
    },
    {
        icon: <Star className="h-6 w-6" />,
        title: "Değerlendir",
        description: "Seans sonrası bakıcınızı değerlendirerek topluluğa katkı sağlayın.",
        features: [
            "Detaylı puanlama",
            "Yorum yazma",
            "Özel notlar",
        ],
    },
];

const SITTER_STEPS: StepItem[] = [
    {
        icon: <GraduationCap className="h-6 w-6" />,
        title: "Kayıt Ol",
        description: "Üniversite öğrencisi olarak kayıt olun ve profilinizi oluşturun.",
        features: [
            "Kolay kayıt",
            "Öğrenci doğrulama",
            "Profil kurulumu",
        ],
    },
    {
        icon: <UserCheck className="h-6 w-6" />,
        title: "Doğrulama",
        description: "Kimlik, öğrenci belgesi ve sabıka kaydı doğrulamasından geçin.",
        features: [
            "Güvenilir rozet",
            "Daha fazla iş",
            "Ücretsiz süreç",
        ],
    },
    {
        icon: <Clock className="h-6 w-6" />,
        title: "Müsaitlik Belirle",
        description: "Çalışmak istediğiniz gün ve saatleri takvimde işaretleyin.",
        features: [
            "Esnek program",
            "Haftalık tekrar",
            "Kolay güncelleme",
        ],
    },
    {
        icon: <MessageCircle className="h-6 w-6" />,
        title: "Başvurulara Yanıt Ver",
        description: "Gelen rezervasyon taleplerini değerlendirin ve yanıtlayın.",
        features: [
            "Anlık bildirim",
            "Detaylı bilgi",
            "Kolay kabul/red",
        ],
    },
    {
        icon: <Heart className="h-6 w-6" />,
        title: "Bakım Ver",
        description: "Randevuya gidin ve çocuklara güvenli, eğlenceli bakım sağlayın.",
        features: [
            "Check-in/out",
            "Aktivite günlüğü",
            "Fotoğraf paylaşımı",
        ],
    },
    {
        icon: <CreditCard className="h-6 w-6" />,
        title: "Kazanç Elde Et",
        description: "Seans tamamlandıktan sonra ödemeniz hesabınıza aktarılır.",
        features: [
            "Hızlı ödeme",
            "Şeffaf komisyon",
            "Kazanç takibi",
        ],
    },
];

export default function HowItWorksPage() {
    const navigate = useNavigate();

    const renderSteps = (steps: StepItem[], color: string) => (
        <div className="space-y-4">
            {steps.map((step, index) => (
                <Card key={index} className="relative overflow-hidden">
                    <CardContent className="p-4">
                        <div className="flex gap-4">
                            <div className="relative">
                                <div
                                    className={cn(
                                        "h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0",
                                        color
                                    )}
                                >
                                    {step.icon}
                                </div>
                                <Badge
                                    className="absolute -top-2 -left-2 h-6 w-6 p-0 flex items-center justify-center bg-gradient-to-br from-purple-500 to-violet-600"
                                >
                                    {index + 1}
                                </Badge>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold mb-1">{step.title}</h3>
                                <p className="text-sm text-muted-foreground mb-2">
                                    {step.description}
                                </p>
                                {step.features && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {step.features.map((feature, i) => (
                                            <Badge key={i} variant="outline" className="text-xs">
                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                {feature}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-white">
            <div className="container max-w-3xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-semibold">Nasıl Çalışır?</h1>
                        <p className="text-sm text-muted-foreground">
                            KampusAbla sürecini adım adım keşfedin
                        </p>
                    </div>
                </div>

                {/* Hero */}
                <Card className="mb-8 bg-gradient-to-br from-purple-500 to-violet-600 text-white border-0">
                    <CardContent className="py-8 text-center">
                        <h2 className="text-2xl font-bold mb-2">
                            Güvenli Çocuk Bakımı, Bir Tık Uzağınızda
                        </h2>
                        <p className="text-white/80">
                            Üniversite öğrencisi bakıcılarla aileleri buluşturuyoruz
                        </p>
                    </CardContent>
                </Card>

                {/* Tabs for different user types */}
                <div className="space-y-8">
                    {/* For Parents */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                <Heart className="h-4 w-4 text-blue-600" />
                            </div>
                            <h2 className="text-lg font-semibold">Ebeveynler İçin</h2>
                        </div>
                        {renderSteps(PARENT_STEPS, "bg-blue-100 text-blue-600")}
                    </div>

                    {/* For Sitters */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                                <GraduationCap className="h-4 w-4 text-green-600" />
                            </div>
                            <h2 className="text-lg font-semibold">Bakıcılar İçin</h2>
                        </div>
                        {renderSteps(SITTER_STEPS, "bg-green-100 text-green-600")}
                    </div>
                </div>

                {/* CTA */}
                <Card className="mt-8">
                    <CardContent className="py-6 text-center">
                        <h3 className="font-semibold mb-2">Başlamaya Hazır mısınız?</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Hemen katılın ve güvenilir çocuk bakımının keyfini çıkarın
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2 justify-center">
                            <Button onClick={() => navigate("/")}>
                                Bakıcı Bul
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                            <Button variant="outline" onClick={() => navigate("/")}>
                                Bakıcı Ol
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Help link */}
                <div className="text-center mt-6">
                    <Button variant="link" onClick={() => navigate("/help")}>
                        Başka sorularınız mı var? Yardım Merkezi'ni ziyaret edin
                    </Button>
                </div>
            </div>
        </div>
    );
}
