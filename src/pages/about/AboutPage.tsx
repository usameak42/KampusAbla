/**
 * AboutPage - About Us page
 */

import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Heart,
    Shield,
    GraduationCap,
    Users,
    Target,
    Sparkles,
    ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AboutPage() {
    const navigate = useNavigate();

    const values = [
        {
            icon: <Shield className="h-6 w-6" />,
            title: "Güvenlik",
            description: "Tüm bakıcılarımız kapsamlı doğrulama süreçlerinden geçer. Çocuklarınızın güvenliği bizim önceliğimizdir.",
            color: "bg-blue-100 text-blue-600",
        },
        {
            icon: <GraduationCap className="h-6 w-6" />,
            title: "Eğitim",
            description: "Bakıcılarımız üniversite öğrencileridir. Hem bakım hem de eğitici aktiviteler sunarlar.",
            color: "bg-green-100 text-green-600",
        },
        {
            icon: <Heart className="h-6 w-6" />,
            title: "Güven",
            description: "Topluluk değerlendirmeleri ve şeffaf iletişimle güven ortamı oluşturuyoruz.",
            color: "bg-pink-100 text-pink-600",
        },
        {
            icon: <Users className="h-6 w-6" />,
            title: "Topluluk",
            description: "Aileler ve öğrencileri bir araya getiren güçlü bir topluluk inşa ediyoruz.",
            color: "bg-purple-100 text-purple-600",
        },
    ];

    const stats = [
        { value: "5,000+", label: "Aktif Aile" },
        { value: "3,000+", label: "Doğrulanmış Bakıcı" },
        { value: "50,000+", label: "Tamamlanan Seans" },
        { value: "4.8", label: "Ortalama Puan" },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-white">
            <div className="container max-w-3xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-semibold">Hakkımızda</h1>
                        <p className="text-sm text-muted-foreground">
                            KampusAbla hikayesi
                        </p>
                    </div>
                </div>

                {/* Hero */}
                <Card className="mb-8 bg-gradient-to-br from-purple-500 to-violet-600 text-white border-0 overflow-hidden">
                    <CardContent className="py-10 text-center relative">
                        <Sparkles className="absolute top-4 right-4 h-8 w-8 text-white/30" />
                        <Sparkles className="absolute bottom-4 left-4 h-6 w-6 text-white/30" />
                        <h2 className="text-3xl font-bold mb-4">
                            KampusAbla
                        </h2>
                        <p className="text-lg text-white/90 max-w-md mx-auto">
                            Üniversite öğrencisi bakıcılarla aileleri buluşturan Türkiye'nin
                            ilk ve en güvenilir platformu.
                        </p>
                    </CardContent>
                </Card>

                {/* Mission */}
                <Card className="mb-6">
                    <CardContent className="py-6">
                        <div className="flex items-start gap-4">
                            <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                                <Target className="h-6 w-6 text-amber-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg mb-2">Misyonumuz</h3>
                                <p className="text-muted-foreground">
                                    Her ailenin güvenilir, eğitimli ve ekonomik çocuk bakımına
                                    erişebilmesini sağlamak. Aynı zamanda üniversite öğrencilerine
                                    esnek ve anlamlı bir gelir kaynağı oluşturmak.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Story */}
                <Card className="mb-6">
                    <CardContent className="py-6">
                        <h3 className="font-semibold text-lg mb-4">Hikayemiz</h3>
                        <div className="space-y-4 text-muted-foreground">
                            <p>
                                KampusAbla, 2023 yılında genç bir ebeveyn ve üniversite
                                öğrencisinin karşılaştığı zorlukların farkındalığıyla doğdu.
                            </p>
                            <p>
                                Bir yanda güvenilir bakıcı bulmakta zorlanan aileler, diğer
                                yanda esnek çalışma saatleri arayan öğrenciler. Bu iki
                                ihtiyacı buluşturmak için yola çıktık.
                            </p>
                            <p>
                                Bugün, Türkiye genelinde binlerce aile ve öğrenciyi
                                birbirine bağlayan güvenilir bir platform haline geldik.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {stats.map((stat, index) => (
                        <Card key={index}>
                            <CardContent className="py-4 text-center">
                                <p className="text-2xl font-bold text-purple-600">{stat.value}</p>
                                <p className="text-sm text-muted-foreground">{stat.label}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Values */}
                <h3 className="font-semibold text-lg mb-4">Değerlerimiz</h3>
                <div className="grid gap-4 md:grid-cols-2 mb-8">
                    {values.map((value, index) => (
                        <Card key={index}>
                            <CardContent className="py-4">
                                <div className="flex items-start gap-3">
                                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${value.color}`}>
                                        {value.icon}
                                    </div>
                                    <div>
                                        <h4 className="font-medium mb-1">{value.title}</h4>
                                        <p className="text-sm text-muted-foreground">
                                            {value.description}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* CTA */}
                <Card>
                    <CardContent className="py-6 text-center">
                        <h3 className="font-semibold mb-2">Bize Katılın</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Binlerce aile ve bakıcıyla tanışın
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2 justify-center">
                            <Button onClick={() => navigate("/how-it-works")}>
                                Nasıl Çalışır?
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                            <Button variant="outline" onClick={() => navigate("/help")}>
                                Yardım Merkezi
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
