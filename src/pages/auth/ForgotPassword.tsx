/**
 * Forgot Password Page
 * Sends a password reset email via Supabase Auth
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Loader2, Mail, CheckCircle } from "lucide-react";

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (error) throw error;
            setIsSent(true);
        } catch (err: any) {
            setError(err.message || "Bir hata oluştu. Lütfen tekrar deneyin.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => navigate("/login")}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <CardTitle className="text-2xl font-bold">Şifre Sıfırlama</CardTitle>
                    </div>
                    <CardDescription>
                        E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {isSent ? (
                        <div className="flex flex-col items-center gap-4 py-6">
                            <CheckCircle className="h-12 w-12 text-green-500" />
                            <div className="text-center space-y-2">
                                <p className="font-medium">E-posta Gönderildi!</p>
                                <p className="text-sm text-muted-foreground">
                                    <strong>{email}</strong> adresine şifre sıfırlama bağlantısı gönderdik.
                                    Lütfen gelen kutunuzu kontrol edin.
                                </p>
                            </div>
                            <Button variant="outline" onClick={() => navigate("/login")} className="mt-4">
                                Giriş Sayfasına Dön
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="email">E-posta Adresi</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="ornek@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={isLoading}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Sıfırlama Bağlantısı Gönder
                            </Button>
                        </form>
                    )}
                </CardContent>

                <CardFooter className="justify-center">
                    <p className="text-sm text-muted-foreground">
                        Şifrenizi hatırladınız mı?{" "}
                        <Button variant="link" className="p-0 h-auto font-semibold" onClick={() => navigate("/login")}>
                            Giriş Yap
                        </Button>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
