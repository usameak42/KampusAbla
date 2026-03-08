/**
 * Sitter Registration - Step 4: Media Uploads
 * Profile photo and intro video (both optional)
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, Video, Image as ImageIcon, Info } from "lucide-react";
import { SitterFormData } from "@/pages/register/SitterRegistration";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SitterStep4Props {
    formData: Partial<SitterFormData>;
    updateFormData: (data: Partial<SitterFormData>) => void;
    onNext: () => void;
    onBack: () => void;
}

export function SitterStep4({ formData, updateFormData, onNext, onBack }: SitterStep4Props) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [uploadingVideo, setUploadingVideo] = useState(false);

    const [profilePhotoUrl, setProfilePhotoUrl] = useState(formData.profilePhotoUrl || "");
    const [introVideoUrl, setIntroVideoUrl] = useState(formData.introVideoUrl || "");

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: "Dosya çok büyük",
                description: "Maksimum dosya boyutu 5MB",
                variant: "destructive",
            });
            return;
        }

        setUploadingPhoto(true);
        try {
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) throw new Error("Not authenticated");

            const fileExt = file.name.split(".").pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`; // simplified path since bucket is for avatars

            const { error: uploadError } = await supabase.storage
                .from("profile-photos")
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from("profile-photos")
                .getPublicUrl(filePath);

            setProfilePhotoUrl(publicUrl);
            toast({ title: "Fotoğraf yüklendi" });
        } catch (error) {
            toast({
                title: "Yükleme başarısız",
                description: error instanceof Error ? error.message : "Lütfen tekrar deneyin",
                variant: "destructive",
            });
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 50 * 1024 * 1024) {
            toast({
                title: "Video çok büyük",
                description: "Maksimum dosya boyutu 50MB",
                variant: "destructive",
            });
            return;
        }

        setUploadingVideo(true);
        try {
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) throw new Error("Not authenticated");

            const fileExt = file.name.split(".").pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const filePath = `intro-videos/${user.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from("intro-videos")
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from("intro-videos")
                .getPublicUrl(filePath);

            setIntroVideoUrl(publicUrl);
            toast({ title: "Video yüklendi" });
        } catch (error) {
            toast({
                title: "Yükleme başarısız",
                description: error instanceof Error ? error.message : "Lütfen tekrar deneyin",
                variant: "destructive",
            });
        } finally {
            setUploadingVideo(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // KA-032: Profile media mandatory
        if (!profilePhotoUrl) {
            toast({
                title: "Profil fotoğrafı gerekli",
                description: "Lütfen devam etmeden önce bir profil fotoğrafı yükleyin.",
                variant: "destructive",
            });
            setIsLoading(false);
            return;
        }

        updateFormData({
            profilePhotoUrl: profilePhotoUrl || undefined,
            introVideoUrl: introVideoUrl || undefined,
        });

        setTimeout(() => {
            setIsLoading(false);
            onNext();
        }, 500);
    };

    const handleSkip = () => {
        updateFormData({});
        onNext();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Profil Fotoğrafı (Zorunlu) ve Video</h2>

            <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                    Profil fotoğrafı yüklemek zorunludur. Tanıtım videosu eklemek profilinizin daha çok görüntülenmesini sağlar.
                </AlertDescription>
            </Alert>

            <div className="space-y-2">
                <Label htmlFor="photo">Profil Fotoğrafı</Label>
                <div className="flex items-center gap-4">
                    {profilePhotoUrl ? (
                        <img
                            src={profilePhotoUrl}
                            alt="Profile"
                            className="h-24 w-24 rounded-full object-cover border-2 border-primary"
                            loading="lazy"
                        />
                    ) : (
                        <div className="h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-gray-400" />
                        </div>
                    )}
                    <div className="flex-1">
                        <Input
                            id="photo"
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            disabled={uploadingPhoto}
                            className="cursor-pointer"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            JPG, PNG veya WebP. Maksimum 5MB.
                        </p>
                    </div>
                </div>
                {uploadingPhoto && (
                    <div className="flex items-center text-sm text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Yükleniyor...
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="video">Tanıtım Videosu</Label>
                {introVideoUrl ? (
                    <div className="rounded-lg overflow-hidden border">
                        <video
                            src={introVideoUrl}
                            controls
                            className="w-full"
                            style={{ maxHeight: "300px" }}
                        />
                    </div>
                ) : (
                    <div className="border-2 border-dashed rounded-lg p-8 text-center">
                        <Video className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-muted-foreground mb-4">
                            30-60 saniye arası kendinizi tanıtan kısa bir video
                        </p>
                    </div>
                )}
                <Input
                    id="video"
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    disabled={uploadingVideo}
                    className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground">
                    MP4 veya WebM. Maksimum 50MB, 30-60 saniye.
                </p>
                {uploadingVideo && (
                    <div className="flex items-center text-sm text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Yükleniyor... Bu biraz zaman alabilir.
                    </div>
                )}
            </div>

            <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={onBack} disabled={isLoading} className="flex-1">
                    Geri
                </Button>

                <Button
                    type="submit"
                    disabled={isLoading || uploadingPhoto || uploadingVideo}
                    className="flex-1"
                >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Devam Et
                </Button>
            </div>
        </form>
    );
}
