/**
 * AccountSettings - Profile and personal info settings
 */

import { useState } from "react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { User, Mail, Phone, Camera, Loader2, Lock, Globe } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { SettingsSection, SettingsItem } from "./SettingsSection";
import type { UserProfile } from "@/types/settings";

interface AccountSettingsProps {
    profile: UserProfile;
    onUpdateProfile: (data: Partial<UserProfile>) => Promise<void>;
    isSaving: boolean;
}

export function AccountSettings({
    profile,
    onUpdateProfile,
    isSaving,
}: AccountSettingsProps) {
    const { toast } = useToast();
    const [showEditName, setShowEditName] = useState(false);
    const [showEditEmail, setShowEditEmail] = useState(false);
    const [showEditPhone, setShowEditPhone] = useState(false);

    const [name, setName] = useState(profile.name);
    const [email, setEmail] = useState(profile.email);
    const [phone, setPhone] = useState(profile.phone);
    const { i18n } = useTranslation();

    const handleSaveName = async () => {
        await onUpdateProfile({ name });
        setShowEditName(false);
    };

    const handleSaveEmail = async () => {
        await onUpdateProfile({ email });
        setShowEditEmail(false);
    };

    const handleSavePhone = async () => {
        await onUpdateProfile({ phone });
        setShowEditPhone(false);
    };

    return (
        <>
            <SettingsSection title="Profil Bilgileri" description="Kişisel bilgilerinizi yönetin">
                {/* Profile Photo */}
                <div className="flex items-center gap-4 p-3 -mx-3">
                    <Avatar className="h-16 w-16">
                        <AvatarImage src={profile.photo} />
                        <AvatarFallback className="bg-gradient-to-br from-violet-400 to-purple-500 text-white text-xl">
                            {profile.name.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-medium">{profile.name}</p>
                        <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                            <Camera className="h-3 w-3 mr-1" />
                            Fotoğraf Değiştir
                        </Button>
                    </div>
                </div>

                {/* Name */}
                <SettingsItem
                    icon={<User className="h-4 w-4" />}
                    label="Ad Soyad"
                    description={profile.name}
                    action={profile.isVerified ? <Lock className="h-4 w-4 text-muted-foreground" /> : undefined}
                    onClick={() => {
                        if (profile.isVerified) {
                            toast({
                                title: "İsim Değişikliği Kısıtlandı",
                                description: "Kimliğiniz doğrulandığı için isminizi değiştiremezsiniz. Lütfen destek ekibiyle iletişime geçin.",
                                variant: "destructive",
                            });
                            return;
                        }
                        setName(profile.name);
                        setShowEditName(true);
                    }}
                />

                {/* Email */}
                <SettingsItem
                    icon={<Mail className="h-4 w-4" />}
                    label="E-posta"
                    description={profile.email}
                    onClick={() => {
                        setEmail(profile.email);
                        setShowEditEmail(true);
                    }}
                />

                {/* Phone */}
                <SettingsItem
                    icon={<Phone className="h-4 w-4" />}
                    label="Telefon"
                    description={profile.phone}
                    onClick={() => {
                        setPhone(profile.phone);
                        setShowEditPhone(true);
                    }}
                />
            </SettingsSection>

            <SettingsSection title="Tercihler" description="Uygulama deneyiminizi kişiselleştirin">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Globe className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="font-medium text-sm">Uygulama Dili</p>
                            <p className="text-xs text-muted-foreground">
                                Tercih ettiğiniz dili seçin
                            </p>
                        </div>
                    </div>
                    <Select value={i18n.language || "tr"} onValueChange={(val) => i18n.changeLanguage(val)}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Dil Seçin" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="tr">Türkçe</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="ar">العربية</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </SettingsSection>

            {/* Edit Name Dialog */}
            <Dialog open={showEditName} onOpenChange={setShowEditName}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ad Soyad Değiştir</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Ad Soyad</Label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Adınız ve soyadınız"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEditName(false)}>
                            İptal
                        </Button>
                        <Button onClick={handleSaveName} disabled={isSaving || !name.trim()}>
                            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Kaydet
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Email Dialog */}
            <Dialog open={showEditEmail} onOpenChange={setShowEditEmail}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>E-posta Değiştir</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>E-posta Adresi</Label>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="ornek@email.com"
                            />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Yeni e-posta adresinize doğrulama linki gönderilecektir.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEditEmail(false)}>
                            İptal
                        </Button>
                        <Button onClick={handleSaveEmail} disabled={isSaving || !email.trim()}>
                            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Kaydet
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Phone Dialog */}
            <Dialog open={showEditPhone} onOpenChange={setShowEditPhone}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Telefon Değiştir</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Telefon Numarası</Label>
                            <Input
                                type="tel"
                                value={phone}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9+ ]/g, "");
                                    setPhone(val);
                                }}
                                placeholder="+90 5XX XXX XXXX"
                            />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Yeni numaranıza doğrulama kodu gönderilecektir.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEditPhone(false)}>
                            İptal
                        </Button>
                        <Button onClick={handleSavePhone} disabled={isSaving || !phone.trim()}>
                            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Kaydet
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
