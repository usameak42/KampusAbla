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
    CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthentication } from "@/hooks/useAuthentication";

export default function AdminDashboard() {
    const navigate = useNavigate();
    const { handleSignOut } = useAuthentication();

    const [stats, setStats] = useState([
        { label: "Toplam Kullanıcı", value: "-", icon: Users, color: "text-blue-500" },
        { label: "Onay Bekleyenler", value: "-", icon: ShieldCheck, color: "text-amber-500" },
        { label: "Aktif Seanslar", value: "-", icon: BarChart3, color: "text-emerald-500" },
        { label: "Açık Raporlar", value: "0", icon: AlertTriangle, color: "text-rose-500" },
    ]);

    useEffect(() => {
        const fetchStats = async () => {
            // Count total users (parents + sitters)
            const { count: parentCount } = await supabase
                .from("parents")
                .select("*", { count: "exact", head: true });

            const { count: sitterCount } = await supabase
                .from("sitters")
                .select("*", { count: "exact", head: true });

            const userCount = (parentCount || 0) + (sitterCount || 0);

            // Count Pending Verifications
            const { count: pendingCount } = await supabase
                .from("sitter_verifications")
                .select("*", { count: "exact", head: true })
                .eq("verification_status", "pending");

            // Count Active Sessions
            const { count: activeSessionsCount } = await supabase
                .from("sessions")
                .select("*", { count: "exact", head: true })
                .eq("status", "in-progress");

            // Count Open Reports
            const { count: reportCount } = await supabase
                .from("reports")
                .select("*", { count: "exact", head: true })
                .neq("status", "resolved")
                .neq("status", "dismissed");

            setStats([
                { label: "Toplam Kullanıcı", value: userCount.toString(), icon: Users, color: "text-blue-500" },
                { label: "Onay Bekleyenler", value: pendingCount?.toString() || "0", icon: ShieldCheck, color: "text-amber-500" },
                { label: "Aktif Seanslar", value: activeSessionsCount?.toString() || "0", icon: BarChart3, color: "text-emerald-500" },
                { label: "Açık Raporlar", value: reportCount?.toString() || "0", icon: AlertTriangle, color: "text-rose-500" },
            ]);
        };

        fetchStats();
    }, []);

    const quickActions = [
        { label: "Kullanıcı Yönetimi", icon: Users, path: "/admin/users" },
        { label: "Onay Kuyruğu", icon: ShieldCheck, path: "/admin/verifications" },
        { label: "Rapor Yönetimi", icon: AlertTriangle, path: "/admin/reports" },
        { label: "Sistem İzleme", icon: BarChart3, path: "/admin/monitoring" },
        { label: "Sistem Ayarları", icon: Settings, path: "/admin/settings" },
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 pb-12">
            {/* Header */}
            <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-purple-600 p-1.5 rounded-lg">
                            <ShieldCheck className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight">KampusAbla <span className="text-purple-400">Admin</span></h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                            <Bell className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                            <MessageSquare className="h-5 w-5" />
                        </Button>
                        <div className="h-8 w-px bg-slate-800 mx-1"></div>
                        <Button
                            variant="ghost"
                            className="text-slate-400 hover:text-white hover:bg-slate-800"
                            onClick={() => handleSignOut().then(() => navigate("/admin/login"))}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign Out
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {stats.map((stat) => (
                        <Card key={stat.label} className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden group hover:border-purple-500/50 transition-all">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium text-slate-400">{stat.label}</p>
                                    <div className={`p-2 rounded-lg bg-slate-800 group-hover:bg-slate-700 transition-colors`}>
                                        <stat.icon className={`h-5 w-5 ${stat.color}`} />
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold">{stat.value}</h3>
                                <div className="mt-2 flex items-center text-xs text-emerald-400">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    <span>+12% from last week</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Quick Actions */}
                    <Card className="lg:col-span-1 bg-slate-900 border-slate-800 shadow-xl">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {quickActions.map((action) => (
                                <Button
                                    key={action.path}
                                    variant="outline"
                                    className="w-full justify-start border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-purple-500/50 text-slate-200 transition-all"
                                    onClick={() => navigate(action.path)}
                                >
                                    <action.icon className="mr-3 h-4 w-4 text-purple-400" />
                                    {action.label}
                                </Button>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Recent Activity Placeholder */}
                    <Card className="lg:col-span-2 bg-slate-900 border-slate-800 shadow-xl">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg font-bold">Recent Activity</CardTitle>
                            <Button variant="link" className="text-purple-400 p-0 h-auto">View all</Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[1, 2, 3, 4, 5].map((_, i) => (
                                    <div key={i} className="flex items-start gap-4 p-3 rounded-lg hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700">
                                        <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                                            <Users className="h-4 w-4 text-blue-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium">New user registered</p>
                                            <p className="text-xs text-slate-500 truncate">Zeynep Yılmaz joined as a Sitter</p>
                                        </div>
                                        <span className="text-[10px] text-slate-600 font-mono">2m ago</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
