/**
 * Reset Password Page
 * Allows users to set a new password after clicking the reset link from email.
 * Supabase automatically handles the recovery token from the URL hash.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, Lock } from "lucide-react";

export default function ResetPassword() {
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState("");
    const [isValidSession, setIsValidSession] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        // Supabase processes the recovery token from the URL hash automatically.
        // We just need to check if a valid session exists after the token is processed.
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setIsValidSession(!!session);
            setChecking(false);
        };

        // Listen for the PASSWORD_RECOVERY event
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === "PASSWORD_RECOVERY") {
                setIsValidSession(true);
                setChecking(false);
            }
        });

        checkSession();

        return () => subscription.unsubscribe();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Şifreler eşleşmiyor.");
            return;
        }

        if (password.length < 8) {
            setError("Şifre en az 8 karakter olmalıdır.");
            return;
        }

        setIsLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
            setIsSuccess(true);
            // Redirect to login after 3 seconds
            setTimeout(() => navigate("/login"), 3000);
        } catch (err: any) {
            setError(err.message || "Şifre güncellenemedi. Lütfen tekrar deneyin.");
        } finally {
            setIsLoading(false);
        }
    };

    if (checking) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isValidSession && !isSuccess) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-center">Geçersiz Bağlantı</CardTitle>
                        <CardDescription className="text-center">
                            Bu şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş.
                            Lütfen yeni bir sıfırlama bağlantısı isteyin.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <Button onClick={() => navigate("/forgot-password")}>
                            Yeni Bağlantı İste
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Yeni Şifre Belirle</CardTitle>
                    <CardDescription className="text-center">
                        Hesabınız için yeni bir şifre girin.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {isSuccess ? (
                        <div className="flex flex-col items-center gap-4 py-6">
                            <CheckCircle className="h-12 w-12 text-green-500" />
                            <div className="text-center space-y-2">
                                <p className="font-medium">Şifreniz Güncellendi!</p>
                                <p className="text-sm text-muted-foreground">
                                    Giriş sayfasına yönlendiriliyorsunuz...
                                </p>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="password">Yeni Şifre</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={isLoading}
                                        minLength={8}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Şifre Tekrar</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        disabled={isLoading}
                                        minLength={8}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Şifreyi Güncelle
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
