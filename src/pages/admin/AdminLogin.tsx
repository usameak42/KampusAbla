import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ShieldCheck, Lock, Mail, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuthentication } from "@/hooks/useAuthentication";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const STORAGE_KEY = "ka_al_state";

function getAttemptState(): { count: number; lockedUntil: number | null } {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return { count: 0, lockedUntil: null };
}

function setAttemptState(count: number, lockedUntil: number | null) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ count, lockedUntil }));
}

export default function AdminLogin() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { handleSignIn, isLoading } = useAuthentication();
    const { toast } = useToast();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [lockRemaining, setLockRemaining] = useState(0);

    // Check lockout on mount & tick
    useEffect(() => {
        const tick = () => {
            const { lockedUntil } = getAttemptState();
            if (lockedUntil && Date.now() < lockedUntil) {
                setLockRemaining(Math.ceil((lockedUntil - Date.now()) / 1000));
            } else {
                setLockRemaining(0);
            }
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    const isLocked = lockRemaining > 0;

    // Auto-redirect if admin session already exists
    useEffect(() => {
        const checkExistingSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            const { data: roleData } = await supabase
                .from("user_roles" as any)
                .select("role")
                .eq("user_id", session.user.id)
                .eq("role", "admin")
                .maybeSingle();

            if (roleData) {
                navigate("/mgmt/panel", { replace: true });
            }
        };

        checkExistingSession();
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isLocked) return;

        if (!email || !password) {
            toast({
                title: t("common.error"),
                description: t("errors.fillAllFields"),
                variant: "destructive",
            });
            return;
        }

        try {
            const result: any = await handleSignIn(email, password);
            const user = result?.data?.user || result?.user;

            if (user?.id) {
                const { data: roleData } = await supabase
                    .from("user_roles" as any)
                    .select("role")
                    .eq("user_id", user.id)
                    .eq("role", "admin")
                    .maybeSingle();

                if (roleData) {
                    // Reset attempts on success
                    setAttemptState(0, null);
                    navigate("/mgmt/panel");
                    return;
                }
            }

            // Not admin — count as failed attempt
            const state = getAttemptState();
            const newCount = state.count + 1;
            if (newCount >= MAX_ATTEMPTS) {
                setAttemptState(newCount, Date.now() + LOCKOUT_DURATION_MS);
            } else {
                setAttemptState(newCount, null);
            }

            toast({
                title: t("auth.admin.unauthorized"),
                description: t("auth.admin.noPermission"),
                variant: "destructive",
            });
        } catch {
            // Auth failure — count attempt
            const state = getAttemptState();
            const newCount = state.count + 1;
            if (newCount >= MAX_ATTEMPTS) {
                setAttemptState(newCount, Date.now() + LOCKOUT_DURATION_MS);
            } else {
                setAttemptState(newCount, null);
            }
        }
    };

    const formatTime = (s: number) =>
        `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Orbs */}
            <div className="absolute top-1/4 -left-20 w-80 h-80 bg-purple-600/20 rounded-full blur-[100px]" />
            <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-blue-600/20 rounded-full blur-[100px]" />

            <div className="w-full max-w-md relative z-10">
                <Button
                    variant="ghost"
                    className="mb-8 text-slate-400 hover:text-white"
                    onClick={() => navigate("/")}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t("auth.admin.backToSite")}
                </Button>

                <div className="flex items-center justify-center gap-3 mb-8">
                    <div className="bg-purple-600 p-2 rounded-xl">
                        <ShieldCheck className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">
                        KampusAbla <span className="text-purple-400">Panel</span>
                    </h1>
                </div>

                <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-xl shadow-2xl">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl text-center text-white">{t("auth.admin.title")}</CardTitle>
                        <CardDescription className="text-center text-slate-400">
                            {t("auth.admin.subtitle")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLocked ? (
                            <div className="text-center py-6">
                                <Lock className="h-10 w-10 text-red-400 mx-auto mb-3" />
                                <p className="text-red-400 font-semibold mb-1">{t("auth.admin.tooManyAttempts")}</p>
                                <p className="text-slate-400 text-sm">
                                    {t("auth.admin.tryAgainIn", { time: formatTime(lockRemaining) })}
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300" htmlFor="email">
                                        {t("auth.login.email")}
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="admin@kampusabla.com"
                                            className="bg-slate-800/50 border-slate-700 text-white pl-10 focus:ring-purple-500 focus:border-purple-500"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300" htmlFor="password">
                                        {t("auth.login.password")}
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                        <Input
                                            id="password"
                                            type="password"
                                            className="bg-slate-800/50 border-slate-700 text-white pl-10 focus:ring-purple-500 focus:border-purple-500"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white h-11 font-semibold transition-all mt-4"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            {t("auth.login.loggingIn", "Giriş Yapılıyor...")}
                                        </>
                                    ) : (
                                        t("auth.login.button")
                                    )}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>

                <p className="mt-8 text-center text-slate-500 text-sm">
                    {t("auth.admin.copyright", { year: new Date().getFullYear() })}
                </p>
            </div>
        </div>
    );
}
