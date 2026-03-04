/**
 * Sitter Dashboard - Main dashboard for sitters
 */

import { AppLayout } from "@/components/layout/AppLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/dashboard/StatCard";
import { QuickActionCard } from "@/components/dashboard/QuickActionCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
    Calendar,
    DollarSign,
    FileText,
    BarChart3,
    Clock,
    MapPin,
    AlertCircle
} from "lucide-react";

export default function SitterDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const fullName = user?.user_metadata?.full_name || "Bakıcı";

    const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user?.id) return;
            try {
                const { data } = await supabase
                    .from("sitters")
                    .select("verification_status")
                    .eq("id", user.id)
                    .single();

                if (data) {
                    setVerificationStatus(data.verification_status);
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setIsLoadingProfile(false);
            }
        };

        fetchProfile();
    }, [user?.id]);

    const isVerified = verificationStatus === "verified";

    // TODO: Fetch real data from Supabase
    const stats = {
        sessionsThisMonth: 8,
        totalEarnings: 2400,
        pendingPayout: 600,
    };

    const upcomingSessions = [
        {
            id: 1,
            childName: "Elif",
            parentName: "Ahmet Yılmaz",
            date: "27 Ocak 2026",
            time: "15:00-17:00",
            location: "Beşiktaş, İstanbul",
        },
        {
            id: 2,
            childName: "Ali",
            parentName: "Fatma Kaya",
            date: "28 Ocak 2026",
            time: "14:30-16:30",
            location: "Kadıköy, İstanbul",
        },
    ];

    const needPosts = [
        {
            id: 1,
            childName: "Elif",
            parentName: "Ahmet Y.",
            date: "30 Ocak 2026",
            time: "15:00-18:00",
            rate: 80,
            distance: "2.1 km",
        },
        {
            id: 2,
            childName: "Zeynep",
            parentName: "Mehmet K.",
            date: "31 Ocak 2026",
            time: "16:00-19:00",
            rate: 75,
            distance: "3.5 km",
        },
    ];

    return (
        <AppLayout>
            {/* Welcome Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground">Merhaba, {fullName}!</h1>
                <p className="text-muted-foreground mt-1">
                    İşte bugünkü aktiviteleriniz ve kazançlarınız
                </p>
            </div>

            {/* Verification Alert */}
            {!isLoadingProfile && !isVerified && (
                <Alert className="mb-6 border-yellow-200 bg-yellow-50">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                        <strong>Doğrulama Bekliyor:</strong> Platformda aktif olarak çalışabilmek için
                        kimlik doğrulamasını tamamlamanız gerekmektedir.{" "}
                        <Button
                            variant="link"
                            className="p-0 h-auto text-yellow-900 font-semibold underline"
                            onClick={() => navigate("/verification")}
                        >
                            Doğrulamayı Tamamla
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-3 mb-8">
                <StatCard
                    icon={Calendar}
                    label="Bu Ay Seans"
                    value={stats.sessionsThisMonth}
                    iconColor="text-green-600"
                    iconBgColor="bg-green-100"
                    trend={{ value: 12, isPositive: true }}
                />
                <StatCard
                    icon={DollarSign}
                    label="Toplam Kazanç"
                    value={`₺${stats.totalEarnings}`}
                    iconColor="text-blue-600"
                    iconBgColor="bg-blue-100"
                    trend={{ value: 8, isPositive: true }}
                />
                <StatCard
                    icon={Clock}
                    label="Bekleyen Ödeme"
                    value={`₺${stats.pendingPayout}`}
                    iconColor="text-purple-600"
                    iconBgColor="bg-purple-100"
                />
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Hızlı İşlemler</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <QuickActionCard
                        icon={FileText}
                        title="İhtiyaç İlanları"
                        description="Yeni ilanları görüntüle"
                        onClick={() => navigate("/need-posts")}
                        iconColor="text-green-600"
                        iconBgColor="bg-green-100"
                    />
                    <QuickActionCard
                        icon={Calendar}
                        title="Takvimim"
                        description="Müsaitlik durumunu ayarla"
                        onClick={() => navigate("/calendar")}
                        iconColor="text-blue-600"
                        iconBgColor="bg-blue-100"
                    />
                    <QuickActionCard
                        icon={DollarSign}
                        title="Kazançlarım"
                        description="Detaylı kazanç raporu"
                        onClick={() => navigate("/earnings")}
                        iconColor="text-purple-600"
                        iconBgColor="bg-purple-100"
                    />
                    <QuickActionCard
                        icon={BarChart3}
                        title="İstatistiklerim"
                        description="Performans analizi"
                        onClick={() => navigate("/stats")}
                        iconColor="text-orange-600"
                        iconBgColor="bg-orange-100"
                    />
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Upcoming Sessions */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Yaklaşan Seanslar</CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => navigate("/sessions")}>
                            Tümünü Gör
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {upcomingSessions.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">
                                Yaklaşan seansınız yok
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {upcomingSessions.map((session) => (
                                    <div
                                        key={session.id}
                                        className="flex items-start justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                                    >
                                        <div className="space-y-1 flex-1">
                                            <p className="font-semibold">{session.childName}</p>
                                            <p className="text-sm text-muted-foreground">
                                                Veli: {session.parentName}
                                            </p>
                                            <p className="text-sm font-medium text-green-600">
                                                {session.date} • {session.time}
                                            </p>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                <MapPin className="h-3 w-3" />
                                                {session.location}
                                            </p>
                                        </div>
                                        <Button size="sm" className="shrink-0" onClick={() => navigate("/session")}>
                                            Başlat
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Need Posts */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Size Uygun İlanlar</CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => navigate("/need-posts")}>
                            Tümünü Gör
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {needPosts.map((post) => (
                                <div
                                    key={post.id}
                                    className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <p className="font-semibold">{post.childName}</p>
                                            <p className="text-sm text-muted-foreground">
                                                Veli: {post.parentName}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-green-600">₺{post.rate}</p>
                                            <p className="text-xs text-muted-foreground">/saat</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                                        <span>{post.date} • {post.time}</span>
                                        <span className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            {post.distance}
                                        </span>
                                    </div>
                                    <Button size="sm" className="w-full mt-3" variant="outline" onClick={() => navigate("/need-posts")}>
                                        Başvur
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
