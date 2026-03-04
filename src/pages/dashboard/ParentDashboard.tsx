/**
 * Parent Dashboard - Main dashboard for parents
 */

import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { QuickActionCard } from "@/components/dashboard/QuickActionCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Baby, Calendar, Search, FileText, Clock, Star, MapPin } from "lucide-react";

export default function ParentDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const fullName = user?.user_metadata?.full_name || "Veli";

    // TODO: Fetch real data from Supabase
    const stats = {
        childrenCount: 2,
        activeBookings: 3,
        totalBookings: 15,
    };

    const upcomingBookings = [
        {
            id: 1,
            sitterName: "Ayşe Yılmaz",
            childName: "Elif",
            date: "27 Ocak 2026",
            time: "15:00",
            status: "confirmed",
        },
        {
            id: 2,
            sitterName: "Zeynep Kaya",
            childName: "Ali",
            date: "28 Ocak 2026",
            time: "14:30",
            status: "confirmed",
        },
    ];

    const recommendedSitters = [
        {
            id: 1,
            name: "Ayşe Yılmaz",
            university: "Boğaziçi Üniversitesi",
            rate: 75,
            rating: 4.8,
            distance: "2.3 km",
            photoUrl: null,
        },
        {
            id: 2,
            name: "Zeynep Kaya",
            university: "İTÜ",
            rate: 80,
            rating: 4.9,
            distance: "1.5 km",
            photoUrl: null,
        },
    ];

    return (
        <AppLayout>
            {/* Welcome Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground">Merhaba, {fullName}!</h1>
                <p className="text-muted-foreground mt-1">
                    İşte bugünkü aktiviteleriniz ve öneriler
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-3 mb-8">
                <StatCard
                    icon={Baby}
                    label="Toplam Çocuk"
                    value={stats.childrenCount}
                    iconColor="text-blue-600"
                    iconBgColor="bg-blue-100"
                />
                <StatCard
                    icon={Calendar}
                    label="Aktif Rezervasyon"
                    value={stats.activeBookings}
                    iconColor="text-green-600"
                    iconBgColor="bg-green-100"
                />
                <StatCard
                    icon={Clock}
                    label="Toplam Rezervasyon"
                    value={stats.totalBookings}
                    iconColor="text-purple-600"
                    iconBgColor="bg-purple-100"
                />
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Hızlı İşlemler</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <QuickActionCard
                        icon={Baby}
                        title="Çocuk Ekle"
                        description="Yeni bir çocuk profili oluştur"
                        onClick={() => navigate("/children")}
                        iconColor="text-blue-600"
                        iconBgColor="bg-blue-100"
                    />
                    <QuickActionCard
                        icon={Search}
                        title="Bakıcı Bul"
                        description="Bölgendeki bakıcıları keşfet"
                        onClick={() => navigate("/find-sitter")}
                        iconColor="text-green-600"
                        iconBgColor="bg-green-100"
                    />
                    <QuickActionCard
                        icon={FileText}
                        title="İhtiyaç İlanı Ver"
                        description="Yeni bir ilan oluştur"
                        onClick={() => navigate("/my-needs")}
                        iconColor="text-purple-600"
                        iconBgColor="bg-purple-100"
                    />
                    <QuickActionCard
                        icon={Calendar}
                        title="Rezervasyonlarım"
                        description="Tüm rezervasyonlarını gör"
                        onClick={() => navigate("/bookings")}
                        iconColor="text-orange-600"
                        iconBgColor="bg-orange-100"
                    />
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Upcoming Bookings */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Yaklaşan Rezervasyonlar</CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => navigate("/bookings")}>
                            Tümünü Gör
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {upcomingBookings.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">
                                Yaklaşan rezervasyonunuz yok
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {upcomingBookings.map((booking) => (
                                    <div
                                        key={booking.id}
                                        className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                                    >
                                        <div className="space-y-1">
                                            <p className="font-semibold">{booking.sitterName}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {booking.childName} • {booking.date}
                                            </p>
                                            <p className="text-sm font-medium text-blue-600">{booking.time}</p>
                                        </div>
                                        <Button size="sm" variant="outline" onClick={() => navigate("/bookings")}>
                                            Detaylar
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recommended Sitters */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Önerilen Bakıcılar</CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => navigate("/find-sitter")}>
                            Tümünü Gör
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recommendedSitters.map((sitter) => (
                                <div
                                    key={sitter.id}
                                    className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                                    onClick={() => navigate(`/sitters/${sitter.id}`)}
                                >
                                    <div className="h-12 w-12 rounded-full bg-blue-200 flex items-center justify-center shrink-0">
                                        <span className="text-lg font-semibold text-blue-700">
                                            {sitter.name.charAt(0)}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold truncate">{sitter.name}</p>
                                        <p className="text-sm text-muted-foreground truncate">
                                            {sitter.university}
                                        </p>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                {sitter.rating}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MapPin className="h-3 w-3" />
                                                {sitter.distance}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="font-bold text-blue-600">₺{sitter.rate}</p>
                                        <p className="text-xs text-muted-foreground">/saat</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
