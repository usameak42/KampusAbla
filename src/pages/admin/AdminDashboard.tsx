import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
    Users,
    ShieldCheck,
    BarChart3,
    Settings,
    LogOut,
    Bell,
    MessageSquare,
    AlertTriangle,
    CheckCircle2,
    Grid3X3,
    Star,
    StarOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthentication } from "@/hooks/useAuthentication";
import { useAdminQuickActions } from "@/hooks/useAdminQuickActions";

export default function AdminDashboard() {
    const navigate = useNavigate();
    const { handleSignOut } = useAuthentication();

    const [stats, setStats] = useState([
        { label: "Toplam Kullanıcı", value: "-", icon: Users, color: "text-trust" },
        { label: "Onay Bekleyenler", value: "-", icon: ShieldCheck, color: "text-warning" },
        { label: "Aktif Seanslar", value: "-", icon: BarChart3, color: "text-success" },
        { label: "Açık Raporlar", value: "0", icon: AlertTriangle, color: "text-destructive" },
    ]);

    useEffect(() => {
        const fetchStats = async () => {
            const { count: parentCount } = await supabase
                .from("parents")
                .select("*", { count: "exact", head: true });
            const { count: sitterCount } = await supabase
                .from("sitters")
                .select("*", { count: "exact", head: true });
            const userCount = (parentCount || 0) + (sitterCount || 0);

            const { count: pendingCount } = await supabase
                .from("sitter_verifications")
                .select("*", { count: "exact", head: true })
                .eq("verification_status", "pending");

            const { count: activeSessionsCount } = await supabase
                .from("sessions")
                .select("*", { count: "exact", head: true })
                .eq("status", "in-progress");

            const { count: reportCount } = await supabase
                .from("reports")
                .select("*", { count: "exact", head: true })
                .neq("status", "resolved")
                .neq("status", "dismissed");

            setStats([
                { label: "Toplam Kullanıcı", value: userCount.toString(), icon: Users, color: "text-trust" },
                { label: "Onay Bekleyenler", value: pendingCount?.toString() || "0", icon: ShieldCheck, color: "text-warning" },
                { label: "Aktif Seanslar", value: activeSessionsCount?.toString() || "0", icon: BarChart3, color: "text-success" },
                { label: "Açık Raporlar", value: reportCount?.toString() || "0", icon: AlertTriangle, color: "text-destructive" },
            ]);
        };
        fetchStats();
    }, []);

    const { quickActions, allActions, quickActionIds, toggleAction } = useAdminQuickActions();

    return (
        <div className="admin-theme min-h-screen bg-background text-foreground pb-12">
            {/* Header */}
            <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-10">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary p-1.5 rounded-lg">
                            <ShieldCheck className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight">
                            KampusAbla <span className="text-primary">Admin</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                            <Bell className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                            <MessageSquare className="h-5 w-5" />
                        </Button>
                        <div className="h-8 w-px bg-border mx-1" />
                        <Button
                            variant="ghost"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() => handleSignOut().then(() => navigate("/mgmt/auth"))}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Çıkış
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                    {stats.map((stat) => (
                        <Card key={stat.label} className="group hover:shadow-md transition-all">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                                    <div className="p-2 rounded-lg bg-muted group-hover:bg-accent transition-colors">
                                        <stat.icon className={`h-5 w-5 ${stat.color}`} />
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold">{stat.value}</h3>
                                <div className="mt-2 flex items-center text-xs text-success">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    <span>+12% geçen haftaya göre</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Quick Actions */}
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Star className="h-4 w-4 text-warning" />
                                Hızlı Erişim
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {quickActions.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    Aşağıdaki listeden hızlı erişime ekleyin.
                                </p>
                            )}
                            {quickActions.map((action) => (
                                <Button
                                    key={action.id}
                                    variant="outline"
                                    className="w-full justify-start hover:bg-accent transition-all"
                                    onClick={() => navigate(action.path)}
                                >
                                    <action.icon className="mr-3 h-4 w-4 text-primary" />
                                    {action.label}
                                </Button>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Recent Activity */}
                    <Card className="lg:col-span-2">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg font-bold">Son Aktiviteler</CardTitle>
                            <Button variant="link" className="text-primary p-0 h-auto">Tümünü gör</Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {[1, 2, 3, 4, 5].map((_, i) => (
                                    <div key={i} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                                        <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                                            <Users className="h-4 w-4 text-accent-foreground" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium">Yeni kullanıcı kaydoldu</p>
                                            <p className="text-xs text-muted-foreground truncate">Zeynep Yılmaz — Bakıcı olarak katıldı</p>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground font-mono">2dk önce</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* All Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Grid3X3 className="h-4 w-4 text-muted-foreground" />
                            Tüm İşlemler
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {allActions.map((action) => {
                                const isPinned = quickActionIds.includes(action.id);
                                return (
                                    <div
                                        key={action.id}
                                        className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/30 hover:border-primary/20 transition-all group cursor-pointer"
                                        onClick={() => navigate(action.path)}
                                    >
                                        <div className="p-2 rounded-lg bg-muted group-hover:bg-accent transition-colors">
                                            <action.icon className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium">{action.label}</p>
                                            <p className="text-xs text-muted-foreground truncate">{action.description}</p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-warning"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleAction(action.id);
                                            }}
                                            title={isPinned ? "Hızlı erişimden kaldır" : "Hızlı erişime ekle"}
                                        >
                                            {isPinned ? (
                                                <Star className="h-4 w-4 fill-current text-warning" />
                                            ) : (
                                                <StarOff className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
