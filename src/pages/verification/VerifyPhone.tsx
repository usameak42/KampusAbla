import { useState } from "react";
import { useAuthentication } from "@/hooks/useAuthentication";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { OTPInput } from "@/components/auth/OTPInput";
import { PhoneInput } from "@/components/ui/phone-input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Phone, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function VerifyPhone() {
    const { user, isPhoneVerified } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    // If already verified, redirect
    if (user && isPhoneVerified) {
        navigate("/");
    }

    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOtp({
                phone,
                options: {
                    shouldCreateUser: false, // Ensure we are verifying existing user
                }
            });
            if (error) throw error;
            setOtpSent(true);
            toast({
                title: "Kod Gönderildi",
                description: "Telefonunuza doğrulama kodu gönderildi.",
            });
        } catch (error) {
            toast({
                title: "Hata",
                description: "Kod gönderilemedi. Numaranızı kontrol edin.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.verifyOtp({
                phone,
                token: otp,
                type: 'sms',
            });

            if (error) throw error;

            toast({
                title: "Başarılı",
                description: "Telefon numaranız doğrulandı.",
            });
            navigate("/");

        } catch (error) {
            toast({
                title: "Hata",
                description: "Doğrulama başarısız.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="max-w-md w-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Phone className="h-5 w-5" />
                        Telefon Doğrulama
                    </CardTitle>
                    <CardDescription>
                        Güvenliğiniz için telefon numaranızı doğrulamanız gerekmektedir.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!otpSent ? (
                        <form onSubmit={handleSendOTP} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone">Telefon Numarası</Label>
                                <PhoneInput
                                    id="phone"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Lütfen telefon numaranızı 5 ile başlayarak giriniz.
                                </p>
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Doğrulama Kodu Gönder
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerify} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Doğrulama Kodu</Label>
                                <OTPInput value={otp} onChange={setOtp} disabled={isLoading} />
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading || otp.length !== 6}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Doğrula
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                className="w-full"
                                onClick={() => setOtpSent(false)}
                            >
                                Farklı Numara Gir
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
