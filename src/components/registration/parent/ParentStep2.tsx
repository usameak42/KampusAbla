/**
 * Parent Registration - Step 2: Profile Setup
 * Profile photo upload and address input
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, MapPin } from "lucide-react";
import { ParentFormData } from "@/pages/register/ParentRegistration";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { compressImage, validateFileType, formatFileSize } from "@/lib/image-compression";

interface ParentStep2Props {
    formData: Partial<ParentFormData>;
    updateFormData: (data: Partial<ParentFormData>) => void;
    onNext: () => void;
    onBack: () => void;
}

export function ParentStep2({ formData, updateFormData, onNext, onBack }: ParentStep2Props) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [isCompressing, setIsCompressing] = useState(false);

    const [profilePhotoUrl, setProfilePhotoUrl] = useState(formData.profilePhotoUrl || "");
    const [address, setAddress] = useState(formData.address || "");

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validateFileType(file, allowedTypes)) {
            toast({
                title: "Geçersiz dosya tipi",
                description: "Sadece JPG, PNG veya WebP formatında resim yükleyebilirsiniz.",
                variant: "destructive",
            });
            return;
        }

        // Check file size before compression (max 5MB uncompressed)
        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: "Dosya çok büyük",
                description: "Maksimum dosya boyutu 5 MB olmalıdır.",
                variant: "destructive",
            });
            return;
        }

        setIsCompressing(true);
        try {
            // Compress image (profile preset: 400x400, max 500KB)
            const compressedFile = await compressImage(file, 'profile');

            const originalSize = formatFileSize(file.size);
            const compressedSize = formatFileSize(compressedFile.size);

            setIsCompressing(false);
            setUploading(true);

            const user = (await supabase.auth.getUser()).data.user;
            if (!user) throw new Error("Not authenticated");

            const fileExt = compressedFile.name.split(".").pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const filePath = `profile-photos/${user.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from("profile-photos")
                .upload(filePath, compressedFile);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from("profile-photos")
                .getPublicUrl(filePath);

            setProfilePhotoUrl(publicUrl);
            toast({
                title: "Fotoğraf yüklendi",
                description: `${originalSize} → ${compressedSize} başarıyla sıkıştırıldı ve yüklendi.`,
            });
        } catch (error) {
            toast({
                title: "Yükleme başarısız",
                description: error instanceof Error ? error.message : "Lütfen tekrar deneyin.",
                variant: "destructive",
            });
        } finally {
            setIsCompressing(false);
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) throw new Error("Not authenticated");

            // Create parent profile in database (use upsert to prevent duplicates)
            const { error } = await supabase.from("parents").upsert({
                user_id: user.id,
                full_name: formData.fullName!,
                profile_photo_url: profilePhotoUrl || null,
                address: address || null,
            });

            if (error) throw error;

            // Create KVKK consent record
            await supabase.from("kvkk_consents").upsert({
                user_id: user.id,
                consent_type: "data_processing",
                granted: true,
            });

            updateFormData({ profilePhotoUrl, address });
            onNext();
        } catch (error) {
            toast({
                title: "Kayıt başarısız",
                description: error instanceof Error ? error.message : "Lütfen tekrar deneyin.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Profil Bilgileri</h2>

            <div className="space-y-2">
                <Label htmlFor="photo">Profil Fotoğrafı (İsteğe Bağlı)</Label>
                <div className="flex items-center gap-4">
                    {profilePhotoUrl && (
                        <img
                            src={profilePhotoUrl}
                            alt="Profile"
                            className="h-20 w-20 rounded-full object-cover"
                            loading="lazy"
                        />
                    )}
                    <div className="flex-1">
                        <Input
                            id="photo"
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            disabled={uploading || isCompressing}
                            className="cursor-pointer"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            JPG, PNG veya WebP. Otomatik olarak sıkıştırılacaktır.
                        </p>
                    </div>
                </div>
                {isCompressing && (
                    <div className="flex items-center text-sm text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resim sıkıştırılıyor...
                    </div>
                )}
                {uploading && (
                    <div className="flex items-center text-sm text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Yükleniyor...
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="address">Adres (İsteğe Bağlı)</Label>
                <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Textarea
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Ev adresiniz (mahalle, sokak, bina no)"
                        className="pl-10"
                        rows={3}
                    />
                </div>
                <p className="text-xs text-muted-foreground">
                    Adresiniz size yakın bakıcıları bulmanıza yardımcı olur.
                </p>
            </div>

            <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={onBack} disabled={isLoading} className="flex-1">
                    Geri
                </Button>
                <Button type="submit" disabled={isLoading || uploading} className="flex-1">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Devam Et
                </Button>
            </div>
        </form>
    );
}
