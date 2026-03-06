import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Lock, Mail, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuthentication } from "@/hooks/useAuthentication";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function AdminLogin() {
    const navigate = useNavigate();
    const { handleSignIn, isLoading } = useAuthentication();
    const { toast } = useToast();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            toast({
                title: "Hata",
                description: "Lütfen tüm alanları doldurun.",
                variant: "destructive",
            });
            return;
        }

        try {
            const result: any = await handleSignIn(email, password);
            const user = result?.data?.user || result?.user;
            const role = user?.user_metadata?.role;

            // Check user_metadata first
            if (role === "admin") {
                navigate("/admin/dashboard");
                return;
            }

            // Check user_roles table
            if (user?.id) {
                const { data: roleData } = await supabase
                    .from("user_roles" as any)
                    .select("role")
                    .eq("user_id", user.id)
                    .eq("role", "admin")
                    .maybeSingle();

                if (roleData) {
                    navigate("/admin/dashboard");
                    return;
                }
            }

            toast({
                title: "Yetkisiz Erişim",
                description: "Bu bölüme erişmek için yönetici yetkiniz bulunmuyor.",
                variant: "destructive",
            });
        } catch (error) {
            console.error("Login error:", error);
        }
    };

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
                    Siteye Dön
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
                        <CardTitle className="text-2xl text-center text-white">Yönetici Girişi</CardTitle>
                        <CardDescription className="text-center text-slate-400">
                            Yönetici panelinize erişmek için kimlik bilgilerinizi girin
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300" htmlFor="email">
                                    E-posta
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
                                    Şifre
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
                                        Giriş Yapılıyor...
                                    </>
                                ) : (
                                    "Giriş Yap"
                                )}
                            </Button>

                        </form>
                    </CardContent>
                </Card>

                <p className="mt-8 text-center text-slate-500 text-sm">
                    &copy; 2026 KampusAbla. Tüm hakları saklıdır.
                </p>
            </div>
        </div>
    );
}
