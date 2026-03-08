/**
 * Parent Dashboard - Main dashboard for parents
 * Stats and upcoming bookings are fetched live from Supabase.
 */

import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { QuickActionCard } from "@/components/dashboard/QuickActionCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Baby, Calendar, Search, FileText, Clock, Star, MapPin, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, isAfter, startOfDay } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UpcomingBooking {
    id: string;
    sitterName: string;
    childrenNames: string[];
    bookingDate: string;
    startTime: string;
    status: string;
}

interface RecommendedSitter {
    id: string;
    fullName: string;
    university: string | null;
    hourlyRate: number | null;
    rating: number | null;
    photoUrl: string | null;
}

interface DashboardStats {
    childrenCount: number;
    activeBookings: number;
    totalBookings: number;
}

export default function ParentDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const parentId = user?.id;
    const fullName = user?.user_metadata?.full_name || "Veli";

    // ── 1. Stats: children count, active bookings, total bookings ─────────────
    const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
        queryKey: ["parentDashboardStats", parentId],
        queryFn: async () => {
            if (!parentId) return { childrenCount: 0, activeBookings: 0, totalBookings: 0 };

            const [childrenResult, bookingsResult] = await Promise.all([
                supabase
                    .from("children")
                    .select("id", { count: "exact", head: true })
                    .eq("parent_id", parentId),
                supabase
                    .from("bookings")
                    .select("id, status", { count: "exact" })
                    .eq("parent_id", parentId),
            ]);

            if (childrenResult.error) throw childrenResult.error;
            if (bookingsResult.error) throw bookingsResult.error;

            const allBookings = bookingsResult.data || [];
            const activeBookings = allBookings.filter(
                (b) => b.status === "confirmed" || b.status === "pending"
            ).length;

            return {
                childrenCount: childrenResult.count ?? 0,
                activeBookings,
                totalBookings: bookingsResult.count ?? 0,
            };
        },
        enabled: !!parentId,
        staleTime: 60_000, // 1 min
    });

    // ── 2. Upcoming bookings (next 5, confirmed/pending, future dates) ────────
    const { data: upcomingBookings = [], isLoading: bookingsLoading } = useQuery<UpcomingBooking[]>({
        queryKey: ["parentUpcomingBookings", parentId],
        queryFn: async () => {
            if (!parentId) return [];

            const today = startOfDay(new Date()).toISOString();

            // Fetch base bookings without FK joins to avoid PostgREST FK constraint errors
            const { data, error } = await supabase
                .from("bookings")
                .select("id, booking_date, start_time, status, sitter_id")
                .eq("parent_id", parentId)
                .in("status", ["confirmed", "pending"])
                .gte("booking_date", today)
                .order("booking_date", { ascending: true })
                .order("start_time", { ascending: true })
                .limit(5);

            if (error) throw error;

            const bookings = data || [];
            if (bookings.length === 0) return [];

            // Fetch sitter names separately
            const sitterIds = [...new Set(bookings.map((b: any) => b.sitter_id).filter(Boolean))];
            const { data: sittersData }: { data: { user_id: string; full_name: string }[] | null } = sitterIds.length
                ? await supabase
                    .from("sitters")
                    .select("user_id, full_name")
                    .in("user_id", sitterIds)
                : { data: [] };

            const sitterMap: Record<string, string> = {};
            (sittersData || []).forEach((s: any) => { sitterMap[s.user_id] = s.full_name; });

            // Fetch children for these bookings separately
            const bookingIds = bookings.map((b: any) => b.id);
            const { data: bookingChildrenData } = await supabase
                .from("booking_children")
                .select("booking_id, child_id")
                .in("booking_id", bookingIds);

            const childIds = [...new Set((bookingChildrenData || []).map((bc: any) => bc.child_id).filter(Boolean))];
            const { data: childrenData }: { data: { id: string; name: string }[] | null } = childIds.length
                ? await supabase
                    .from("children")
                    .select("id, name")
                    .in("id", childIds)
                : { data: [] };

            const childMap: Record<string, string> = {};
            (childrenData || []).forEach((c: any) => { childMap[c.id] = c.name; });

            const bookingChildrenMap: Record<string, string[]> = {};
            (bookingChildrenData || []).forEach((bc: any) => {
                if (!bookingChildrenMap[bc.booking_id]) bookingChildrenMap[bc.booking_id] = [];
                if (childMap[bc.child_id]) bookingChildrenMap[bc.booking_id].push(childMap[bc.child_id]);
            });

            return bookings.map((b: any) => ({
                id: b.id,
                sitterName: sitterMap[b.sitter_id] ?? "Bakıcı",
                childrenNames: bookingChildrenMap[b.id] ?? [],
                bookingDate: format(new Date(b.booking_date), "d MMMM yyyy"),
                startTime: (b.start_time as string).substring(0, 5),
                status: b.status,
            }));
        },
        enabled: !!parentId,
        staleTime: 30_000,
    });

    // ── 3. Recommended sitters: top-rated verified sitters ────────────────────
    const { data: recommendedSitters = [], isLoading: sittersLoading } = useQuery<RecommendedSitter[]>({
        queryKey: ["parentRecommendedSitters"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("sitters")
                .select("id, full_name, university, hourly_rate, rating, profile_photo_url")
                .eq("verification_status", "verified")
                .order("rating", { ascending: false })
                .limit(4);

            if (error) throw error;

            return (data || []).map((s: any) => ({
                id: s.id,
                fullName: s.full_name,
                university: s.university,
                hourlyRate: s.hourly_rate,
                rating: s.rating,
                photoUrl: s.profile_photo_url,
            }));
        },
        staleTime: 5 * 60_000, // 5 min — sitter list changes rarely
    });

    const isLoading = statsLoading || bookingsLoading || sittersLoading;

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
                    value={statsLoading ? "…" : (stats?.childrenCount ?? 0)}
                    iconColor="text-blue-600"
                    iconBgColor="bg-blue-100"
                />
                <StatCard
                    icon={Calendar}
                    label="Aktif Rezervasyon"
                    value={statsLoading ? "…" : (stats?.activeBookings ?? 0)}
                    iconColor="text-green-600"
                    iconBgColor="bg-green-100"
                />
                <StatCard
                    icon={Clock}
                    label="Toplam Rezervasyon"
                    value={statsLoading ? "…" : (stats?.totalBookings ?? 0)}
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
                        {bookingsLoading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : upcomingBookings.length === 0 ? (
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
                                                {booking.childrenNames.join(", ") || "—"} • {booking.bookingDate}
                                            </p>
                                            <p className="text-sm font-medium text-blue-600">{booking.startTime}</p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => navigate(`/bookings`)}
                                        >
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
                        {sittersLoading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : recommendedSitters.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">
                                Henüz onaylı bakıcı yok
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {recommendedSitters.map((sitter) => (
                                    <div
                                        key={sitter.id}
                                        className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                                        onClick={() => navigate(`/sitters/${sitter.id}`)}
                                    >
                                        <div className="h-12 w-12 rounded-full bg-blue-200 flex items-center justify-center shrink-0 overflow-hidden">
                                            {sitter.photoUrl ? (
                                                <img
                                                    src={sitter.photoUrl}
                                                    alt={sitter.fullName}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-lg font-semibold text-blue-700">
                                                    {sitter.fullName.charAt(0)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold truncate">{sitter.fullName}</p>
                                            <p className="text-sm text-muted-foreground truncate">
                                                {sitter.university ?? "Üniversite belirtilmemiş"}
                                            </p>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                                {sitter.rating != null && (
                                                    <span className="flex items-center gap-1">
                                                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                        {sitter.rating.toFixed(1)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            {sitter.hourlyRate != null && (
                                                <>
                                                    <p className="font-bold text-blue-600">₺{sitter.hourlyRate}</p>
                                                    <p className="text-xs text-muted-foreground">/saat</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
