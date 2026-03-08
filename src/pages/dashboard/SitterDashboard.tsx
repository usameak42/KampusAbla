/**
 * Sitter Dashboard - Main dashboard for sitters
 * Stats, upcoming sessions, and need posts are fetched live from Supabase.
 */

import { AppLayout } from "@/components/layout/AppLayout";
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
    AlertCircle,
    Loader2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, startOfDay } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SitterStats {
    sessionsThisMonth: number;
    totalEarnings: number;
    pendingPayout: number;
}

interface UpcomingSession {
    id: string;
    childrenNames: string[];
    parentName: string;
    bookingDate: string;
    startTime: string;
    endTime: string;
    address: string;
}

interface NeedPost {
    id: string;
    childName: string;
    parentName: string;
    date: string;
    timeRange: string;
    hourlyRate: number | null;
}

export default function SitterDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const sitterId = user?.id;
    const fullName = user?.user_metadata?.full_name || "Bakıcı";

    // ── 1. Verification status (existing real query, migrated to useQuery) ───
    const { data: verificationStatus, isLoading: isLoadingProfile } = useQuery<string | null>({
        queryKey: ["sitterVerificationStatus", sitterId],
        queryFn: async () => {
            if (!sitterId) return null;
            const { data } = await supabase
                .from("sitters")
                .select("verification_status")
                .eq("user_id", sitterId)
                .single();
            return data?.verification_status ?? null;
        },
        enabled: !!sitterId,
        staleTime: 5 * 60_000,
    });

    const isVerified = verificationStatus === "verified";

    // ── 2. Stats: sessions this month + earnings + pending payout ────────────
    const { data: stats, isLoading: statsLoading } = useQuery<SitterStats>({
        queryKey: ["sitterDashboardStats", sitterId],
        queryFn: async () => {
            if (!sitterId) return { sessionsThisMonth: 0, totalEarnings: 0, pendingPayout: 0 };

            const now = new Date();
            const monthStart = startOfMonth(now).toISOString();
            const monthEnd = endOfMonth(now).toISOString();

            const [sessionsResult, transactionsResult, payoutsResult] = await Promise.all([
                // Count completed bookings (= sessions) this calendar month
                supabase
                    .from("bookings")
                    .select("id", { count: "exact", head: true })
                    .eq("sitter_id", sitterId)
                    .eq("status", "completed")
                    .gte("booking_date", monthStart)
                    .lte("booking_date", monthEnd),

                // Sum all sitter earnings from completed transactions
                supabase
                    .from("transactions")
                    .select("sitter_amount")
                    .eq("sitter_id", sitterId),

                // Sum pending payouts
                supabase
                    .from("payouts")
                    .select("amount")
                    .eq("sitter_id", sitterId)
                    .eq("status", "pending"),
            ]);

            if (sessionsResult.error) throw sessionsResult.error;
            if (transactionsResult.error) throw transactionsResult.error;
            if (payoutsResult.error) throw payoutsResult.error;

            const totalEarnings = (transactionsResult.data || []).reduce(
                (sum: number, t: any) => sum + (t.sitter_amount ?? 0),
                0
            );
            const pendingPayout = (payoutsResult.data || []).reduce(
                (sum: number, p: any) => sum + (p.amount ?? 0),
                0
            );

            return {
                sessionsThisMonth: sessionsResult.count ?? 0,
                totalEarnings,
                pendingPayout,
            };
        },
        enabled: !!sitterId,
        staleTime: 60_000,
    });

    // ── 3. Upcoming confirmed bookings (next 5, future dates) ────────────────
    const { data: upcomingSessions = [], isLoading: sessionsLoading } = useQuery<UpcomingSession[]>({
        queryKey: ["sitterUpcomingSessions", sitterId],
        queryFn: async () => {
            if (!sitterId) return [];

            const today = startOfDay(new Date()).toISOString();

            // Fetch base bookings without FK joins to avoid PostgREST FK constraint errors
            const { data, error } = await supabase
                .from("bookings")
                .select("id, booking_date, start_time, duration_hours, meeting_address, parent_id")
                .eq("sitter_id", sitterId)
                .in("status", ["confirmed", "pending"])
                .gte("booking_date", today)
                .order("booking_date", { ascending: true })
                .order("start_time", { ascending: true })
                .limit(5);

            if (error) throw error;

            const bookings = data || [];
            if (bookings.length === 0) return [];

            // Fetch parent names separately
            const parentIds = [...new Set(bookings.map((b: any) => b.parent_id).filter(Boolean))];
            const { data: parentsData }: { data: { user_id: string; full_name: string }[] | null } = parentIds.length
                ? await supabase
                    .from("parents")
                    .select("user_id, full_name")
                    .in("user_id", parentIds)
                : { data: [] };

            const parentMap: Record<string, string> = {};
            (parentsData || []).forEach((p: any) => { parentMap[p.user_id] = p.full_name; });

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

            return bookings.map((b: any) => {
                const startHour = parseInt((b.start_time as string).substring(0, 2), 10);
                const startMin = parseInt((b.start_time as string).substring(3, 5), 10);
                const durationMins = Math.round((b.duration_hours ?? 1) * 60);
                const endTotalMins = startHour * 60 + startMin + durationMins;
                const endTime = `${String(Math.floor(endTotalMins / 60) % 24).padStart(2, "0")}:${String(endTotalMins % 60).padStart(2, "0")}`;

                return {
                    id: b.id,
                    childrenNames: bookingChildrenMap[b.id] ?? [],
                    parentName: parentMap[b.parent_id] ?? "Veli",
                    bookingDate: format(new Date(b.booking_date), "d MMMM yyyy"),
                    startTime: (b.start_time as string).substring(0, 5),
                    endTime,
                    address: b.meeting_address ?? "Adres belirtilmemiş",
                };
            });
        },
        enabled: !!sitterId,
        staleTime: 30_000,
    });

    // ── 4. Open need posts from parents (most recent 5) ───────────────────────
    const { data: needPosts = [], isLoading: postsLoading } = useQuery<NeedPost[]>({
        queryKey: ["sitterNeedPosts"],
        queryFn: async () => {
            const today = startOfDay(new Date()).toISOString();

            // Fetch base need posts without FK joins
            const { data, error } = await supabase
                .from("need_posts")
                .select("id, date, start_time, end_time, hourly_rate, parent_id")
                .eq("status", "open")
                .gte("date", today)
                .order("date", { ascending: true })
                .limit(5);

            if (error) throw error;

            const posts = data || [];
            if (posts.length === 0) return [];

            // Fetch parent names separately
            const parentIds = [...new Set(posts.map((p: any) => p.parent_id).filter(Boolean))];
            const { data: parentsData }: { data: { user_id: string; full_name: string }[] | null } = parentIds.length
                ? await supabase
                    .from("parents")
                    .select("user_id, full_name")
                    .in("user_id", parentIds)
                : { data: [] };

            const parentMap: Record<string, string> = {};
            (parentsData || []).forEach((p: any) => { parentMap[p.user_id] = p.full_name; });

            // Fetch children for these need posts separately
            const postIds = posts.map((p: any) => p.id);
            const { data: postChildrenData } = await supabase
                .from("need_post_children")
                .select("need_post_id, child_id")
                .in("need_post_id", postIds);

            const childIds = [...new Set((postChildrenData || []).map((pc: any) => pc.child_id).filter(Boolean))];
            const { data: childrenData }: { data: { id: string; name: string }[] | null } = childIds.length
                ? await supabase
                    .from("children")
                    .select("id, name")
                    .in("id", childIds)
                : { data: [] };

            const childMap: Record<string, string> = {};
            (childrenData || []).forEach((c: any) => { childMap[c.id] = c.name; });

            const postChildrenMap: Record<string, string[]> = {};
            (postChildrenData || []).forEach((pc: any) => {
                if (!postChildrenMap[pc.need_post_id]) postChildrenMap[pc.need_post_id] = [];
                if (childMap[pc.child_id]) postChildrenMap[pc.need_post_id].push(childMap[pc.child_id]);
            });

            return posts.map((p: any) => ({
                id: p.id,
                childName: (postChildrenMap[p.id] ?? []).join(", ") || "Çocuk",
                parentName: parentMap[p.parent_id] ?? "Veli",
                date: format(new Date(p.date), "d MMMM yyyy"),
                timeRange: `${(p.start_time as string).substring(0, 5)}-${(p.end_time as string).substring(0, 5)}`,
                hourlyRate: p.hourly_rate,
            }));
        },
        staleTime: 60_000,
    });

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
                    value={statsLoading ? "…" : (stats?.sessionsThisMonth ?? 0)}
                    iconColor="text-green-600"
                    iconBgColor="bg-green-100"
                />
                <StatCard
                    icon={DollarSign}
                    label="Toplam Kazanç"
                    value={statsLoading ? "…" : `₺${(stats?.totalEarnings ?? 0).toLocaleString("tr-TR")}`}
                    iconColor="text-blue-600"
                    iconBgColor="bg-blue-100"
                />
                <StatCard
                    icon={Clock}
                    label="Bekleyen Ödeme"
                    value={statsLoading ? "…" : `₺${(stats?.pendingPayout ?? 0).toLocaleString("tr-TR")}`}
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
                        <Button variant="ghost" size="sm" onClick={() => navigate("/bookings")}>
                            Tümünü Gör
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {sessionsLoading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : upcomingSessions.length === 0 ? (
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
                                            <p className="font-semibold">
                                                {session.childrenNames.join(", ") || "Çocuk"}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Veli: {session.parentName}
                                            </p>
                                            <p className="text-sm font-medium text-green-600">
                                                {session.bookingDate} • {session.startTime}-{session.endTime}
                                            </p>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                <MapPin className="h-3 w-3" />
                                                {session.address}
                                            </p>
                                        </div>
                                        <Button
                                            size="sm"
                                            className="shrink-0"
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

                {/* Need Posts */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Size Uygun İlanlar</CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => navigate("/need-posts")}>
                            Tümünü Gör
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {postsLoading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : needPosts.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">
                                Şu an uygun ilan bulunmuyor
                            </p>
                        ) : (
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
                                            {post.hourlyRate != null && (
                                                <div className="text-right">
                                                    <p className="font-bold text-green-600">₺{post.hourlyRate}</p>
                                                    <p className="text-xs text-muted-foreground">/saat</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center mt-2 text-xs text-muted-foreground">
                                            <span>{post.date} • {post.timeRange}</span>
                                        </div>
                                        <Button
                                            size="sm"
                                            className="w-full mt-3"
                                            variant="outline"
                                            onClick={() => navigate(`/need-posts/${post.id}`)}
                                        >
                                            Başvur
                                        </Button>
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
