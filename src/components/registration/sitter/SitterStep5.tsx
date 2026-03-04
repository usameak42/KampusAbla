/**
 * Sitter Registration - Step 5: Completion & Verification Notice
 * Welcome screen with next steps for verification
 */

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, ShieldCheck, Upload, AlertCircle } from "lucide-react";
import { SitterFormData } from "@/pages/register/SitterRegistration";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface SitterStep5Props {
    formData: Partial<SitterFormData>;
    onFinish: () => void;
}

export function SitterStep5({ formData, onFinish }: SitterStep5Props) {
    const { toast } = useToast();
    const [isCreating, setIsCreating] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const createSitterProfile = useCallback(async () => {
        try {
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) throw new Error("Not authenticated");

            // Create sitter profile
            const { error: sitterError } = await supabase.from("sitters").insert({
                user_id: user.id,
                full_name: formData.fullName!,
                university: formData.university!,
                department: formData.department!,
                year: formData.year!,
                languages: formData.languages!,
                hourly_rate: formData.hourlyRate!,
                bio: formData.bio,
                profile_photo_url: formData.profilePhotoUrl,
                intro_video_url: formData.introVideoUrl,
                verification_status: "pending",
                badge_level: "bronze",
            });

            if (sitterError) throw sitterError;

            // Create sitter_verifications record
            const { data: sitterData } = await supabase
                .from("sitters")
                .select("id")
                .eq("user_id", user.id)
                .single();

            if (sitterData) {
                await supabase.from("sitter_verifications").insert({
                    sitter_id: sitterData.id,
                    university_email: formData.universityEmail,
                    background_check_status: "pending",
                });
            }

            // Create KVKK consents
            await supabase.from("kvkk_consents").insert([
                {
                    user_id: user.id,
                    consent_type: "data_processing",
                    granted: true,
                },
                {
                    user_id: user.id,
                    consent_type: "location_tracking",
                    granted: true,
                },
            ]);

            setIsCreating(false);
            toast({
                title: "Kayıt tamamlandı!",
                description: "Profiliniz başarıyla oluşturuldu.",
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Bir hata oluştu");
            setIsCreating(false);
            toast({
                title: "Kayıt başarısız",
                description: "Lütfen daha sonra tekrar deneyin.",
                variant: "destructive",
            });
        }
    }, [formData, toast]);

    useEffect(() => {
        createSitterProfile();
    }, [createSitterProfile]);

    if (isCreating) {
        return (
            <div className="space-y-6 text-center py-12">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground">Profiliniz oluşturuluyor...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6 text-center py-8">
                <div className="rounded-full bg-red-100 p-4 w-fit mx-auto">
                    <AlertCircle className="h-12 w-12 text-red-600" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold mb-2">Bir Sorun Oluştu</h2>
                    <p className="text-muted-foreground">{error}</p>
                </div>
                <Button onClick={() => window.location.reload()}>
                    Tekrar Dene
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 text-center py-8">
            <div className="flex justify-center">
                <div className="rounded-full bg-green-100 p-4">
                    <CheckCircle2 className="h-16 w-16 text-green-600" />
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-bold mb-2">
                    Hoş Geldiniz, {formData.fullName}!
                </h2>
                <p className="text-muted-foreground">
                    Bakıcı kaydınız başarıyla tamamlandı.
                </p>
            </div>

            <Alert className="text-left">
                <ShieldCheck className="h-4 w-4" />
                <AlertDescription>
                    <strong>Doğrulama Süreci:</strong> Platform'da aktif olarak çalışabilmek için
                    kimlik ve öğrencilik doğrulamasını tamamlamanız gerekmektedir.
                </AlertDescription>
            </Alert>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-left space-y-4">
                <h3 className="font-semibold text-blue-900">Bir Sonraki Adımlar:</h3>

                <div className="space-y-3">
                    <div className="flex gap-3">
                        <Upload className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-sm">1. Öğrencilik belgesi yükleyin</p>
                            <p className="text-xs text-muted-foreground">
                                Üniversite kimlik kartınız veya öğrenci belgesi
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <ShieldCheck className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-sm">2. Kimlik doğrulaması yapın</p>
                            <p className="text-xs text-muted-foreground">
                                TC kimlik kartı ve selfie ile doğrulama
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <ShieldCheck className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-sm">3. Adli sicil kaydı yükleyin</p>
                            <p className="text-xs text-muted-foreground">
                                e-Devlet'ten alınan adli sicil belgesi
                            </p>
                        </div>
                    </div>
                </div>

                <p className="text-xs text-blue-600 mt-4">
                    ⏱️ Doğrulama süreci genellikle 1-2 iş günü içinde tamamlanır.
                </p>
            </div>

            <div className="flex flex-col gap-3 pt-4">
                <Button onClick={() => window.location.href = "/verification"} size="lg" className="w-full">
                    <Upload className="mr-2 h-4 w-4" />
                    Doğrulamayı Başlat
                </Button>
                <Button variant="outline" onClick={onFinish} size="lg" className="w-full">
                    Platformu Keşfet
                </Button>
            </div>
        </div>
    );
}
