/**
 * Parent Registration - Step 1: Contact Information
 * Unified form requiring both phone AND email with password
 */

import { useState } from "react";
import { useAuthentication } from "@/hooks/useAuthentication";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OTPInput } from "@/components/auth/OTPInput";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ArrowLeft, CheckCircle2, Mail, Info } from "lucide-react";
import { ParentFormData } from "@/pages/register/ParentRegistration";
import { PhoneInput } from "@/components/ui/phone-input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { validateEmailAscii } from "@/utils/emailValidator";

interface ParentStep1Props {
    formData: Partial<ParentFormData>;
    updateFormData: (data: Partial<ParentFormData>) => void;
    onNext: () => void;
    onBack: () => void;
}

export function ParentStep1({ formData, updateFormData, onNext, onBack }: ParentStep1Props) {
    const { handlePhoneSignIn, handleVerifyOtp, handleSignUp, isLoading } = useAuthentication();

    // Form state
    const [fullName, setFullName] = useState(formData.fullName || "");
    const [email, setEmail] = useState(formData.email || "");
    const [password, setPassword] = useState(formData.password || "");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [phone, setPhone] = useState(formData.phone || "");
    const [kvkkAccepted, setKvkkAccepted] = useState(false);
    const [showInfoModal, setShowInfoModal] = useState(false);

    // Verification state
    const [emailVerificationSent, setEmailVerificationSent] = useState(false);
    const [phoneOtpSent, setPhoneOtpSent] = useState(false);
    const [otp, setOtp] = useState("");

    // Error state
    const [passwordError, setPasswordError] = useState("");
    const [emailError, setEmailError] = useState<string | null>(null);

    // Submit registration (email+password, skip SMS for now)
    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError("");

        const asciiError = validateEmailAscii(email);
        if (asciiError) {
            setEmailError(asciiError);
            return;
        }

        if (password !== confirmPassword) {
            setPasswordError("Şifreler eşleşmiyor");
            return;
        }

        if (password.length < 8) {
            setPasswordError("Şifre en az 8 karakter olmalıdır");
            return;
        }

        const complexityRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
        if (!complexityRegex.test(password)) {
            setPasswordError("Şifre en az bir harf ve bir rakam içermelidir");
            return;
        }

        try {
            await handleSignUp(email, password, { role: "parent", full_name: fullName, phone });

            // Auto-confirm is enabled, so session should be available immediately
            // Skip SMS verification — store phone in metadata and proceed
            updateFormData({ email, password, fullName, phone });
            onNext();
        } catch (error) {
            // Error handled by hook
        }
    };

    // Step 2: After email verified, send phone OTP
    const handlePhoneOtpRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await handlePhoneSignIn(phone);
            setPhoneOtpSent(true);
        } catch (error) {
            // Error handled by hook
        }
    };

    // Step 3: Verify phone OTP and complete
    const handleOTPSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await handleVerifyOtp(phone, otp);
            updateFormData({ phone, email, password, fullName });
            onNext();
        } catch (error) {
            // Error handled by hook
        }
    };

    // Show email verification waiting screen
    if (emailVerificationSent) {
        return (
            <div className="text-center py-8 space-y-4">
                <div className="flex justify-center">
                    <div className="rounded-full bg-green-100 p-4">
                        <CheckCircle2 className="h-12 w-12 text-green-600" />
                    </div>
                </div>
                <h2 className="text-xl font-semibold">Doğrulama E-postası Gönderildi</h2>
                <p className="text-muted-foreground">
                    Lütfen <strong>{email}</strong> adresine gönderilen doğrulama bağlantısına tıklayın.
                    E-postanızı doğruladıktan sonra, giriş yaparak telefon numaranızı ekleyebilirsiniz.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <Mail className="h-5 w-5 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-blue-800">
                        Doğrulama linkine tıkladıktan sonra giriş yapın ve kayıt işlemini tamamlayın.
                    </p>
                </div>
                <Button
                    onClick={() => window.location.href = "/login"}
                    className="w-full mt-4"
                >
                    Giriş Yap Sayfasına Git
                </Button>
            </div>
        );
    }

    // Show phone OTP screen (after email verified)
    if (phoneOtpSent) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                    <Button variant="ghost" onClick={() => setPhoneOtpSent(false)} disabled={isLoading}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Geri
                    </Button>
                    <h2 className="text-xl font-semibold">Telefon Doğrulama</h2>
                    <div className="w-20" />
                </div>

                <form onSubmit={handleOTPSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Doğrulama Kodu</Label>
                        <OTPInput value={otp} onChange={setOtp} disabled={isLoading} />
                        <p className="text-xs text-muted-foreground text-center">
                            {phone} numarasına gönderilen kodu girin
                        </p>
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading || otp.length !== 6}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Doğrula ve Devam Et
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => setPhoneOtpSent(false)}
                        disabled={isLoading}
                    >
                        Farklı Numara Kullan
                    </Button>
                </form>
            </div>
        );
    }

    // Main unified registration form
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" onClick={onBack} disabled={isLoading}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Geri
                </Button>
                <h2 className="text-xl font-semibold">İletişim Bilgileri</h2>
                <div className="w-20" /> {/* Spacer for alignment */}
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="fullName">Ad Soyad *</Label>
                    <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Adınız ve soyadınız"
                        required
                        disabled={isLoading}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">E-posta *</Label>
                    <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            setEmailError(validateEmailAscii(e.target.value));
                        }}
                        placeholder="ornek@email.com"
                        required
                        disabled={isLoading}
                        className={emailError ? "border-destructive" : ""}
                    />
                    {emailError && (
                        <p className="text-xs text-destructive">{emailError}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">Şifre *</Label>
                    <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="En az 8 karakter"
                        minLength={8}
                        required
                        disabled={isLoading}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Şifre Tekrar *</Label>
                    <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            if (passwordError) setPasswordError("");
                        }}
                        placeholder="Şifrenizi tekrar girin"
                        minLength={8}
                        required
                        disabled={isLoading}
                        className={passwordError ? "border-red-500" : ""}
                    />
                    {passwordError && (
                        <p className="text-xs text-red-500">{passwordError}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                        Telefon Numarası *
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 p-0 hover:bg-transparent"
                            onClick={() => setShowInfoModal(true)}
                        >
                            <Info className="h-4 w-4 text-muted-foreground" />
                        </Button>
                    </Label>
                    <PhoneInput
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        disabled={isLoading}
                        error={false}
                    />
                    <p className="text-xs text-muted-foreground">
                        Telefon numaranız SMS ile doğrulanacaktır
                    </p>
                </div>

                <div className="flex items-start space-x-2 py-2">
                    <Checkbox
                        id="kvkk"
                        checked={kvkkAccepted}
                        onCheckedChange={(checked) => setKvkkAccepted(checked === true)}
                        className="mt-1"
                    />
                    <Label htmlFor="kvkk" className="text-xs leading-normal cursor-pointer">
                        <a href="/kvkk" className="text-primary hover:underline">KVKK Aydınlatma Metni</a>'ni okudum ve kişisel verilerimin işlenmesine açık rıza veriyorum. *
                    </Label>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading || !kvkkAccepted}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Kayıt Ol ve Devam Et
                </Button>
            </form>

            <p className="text-xs text-center text-muted-foreground">
                Kaydolarak{" "}
                <a href="/terms" className="underline">
                    Kullanım Koşulları
                </a>{" "}
                ve{" "}
                <a href="/privacy" className="underline">
                    Gizlilik Politikası
                </a>
                'nı kabul etmiş olursunuz.
            </p>
            {/* Verification Info Modal */}
            <Dialog open={showInfoModal} onOpenChange={setShowInfoModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Neden Telefon Doğrulaması?</DialogTitle>
                        <DialogDescription>
                            Güvenli öğrenci bakıcı platformu KampusAbla'da güvenlik en önemli önceliğimizdir.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2 text-sm text-gray-600">
                        <p>
                            Telefon numarası doğrulaması şu sebeplerle gereklidir:
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Gerçek kişi olduğunuzu doğrulamak</li>
                            <li>Hesap güvenliğinizi artırmak</li>
                            <li>Acil durumlarda iletişim kurabilmek</li>
                            <li>Spam ve sahte hesapları engellemek</li>
                        </ul>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
