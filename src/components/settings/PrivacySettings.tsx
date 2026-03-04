/**
 * PrivacySettings - Privacy and data controls
 */

import { useState } from "react";
import {
    Eye,
    EyeOff,
    MapPin,
    BarChart3,
    UserCog,
    Download,
    Trash2,
    Loader2,
    CheckCircle,
    AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SettingsSection, SettingsItem } from "./SettingsSection";
import type { PrivacySettings as PrivacySettingsType } from "@/types/settings";

interface PrivacySettingsProps {
    privacy: PrivacySettingsType;
    onUpdate: (data: Partial<PrivacySettingsType>) => Promise<void>;
    onRequestDataExport: () => Promise<void>;
    onDeleteAccount: (password: string) => Promise<void>;
    isSaving: boolean;
}

export function PrivacySettings({
    privacy,
    onUpdate,
    onRequestDataExport,
    onDeleteAccount,
    isSaving,
}: PrivacySettingsProps) {
    const [showExportDialog, setShowExportDialog] = useState(false);
    const [exportRequested, setExportRequested] = useState(false);

    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");
    const [deleteConfirmText, setDeleteConfirmText] = useState("");

    const handleExportRequest = async () => {
        await onRequestDataExport();
        setExportRequested(true);
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== "HESABIMI SİL") return;
        await onDeleteAccount(deletePassword);
        // In production, redirect to logout
    };

    return (
        <>
            {/* Profile Visibility */}
            <SettingsSection
                title="Profil Görünürlüğü"
                description="Profilinizin nasıl göründüğünü kontrol edin"
            >
                <SettingsItem
                    icon={<Eye className="h-4 w-4" />}
                    label="Profilin Görünür Olsun"
                    description="Diğer kullanıcılar profilinizi görebilir"
                    action={
                        <Switch
                            checked={privacy.profileVisible}
                            onCheckedChange={(checked) =>
                                onUpdate({ profileVisible: checked })
                            }
                        />
                    }
                />
                <SettingsItem
                    icon={<Eye className="h-4 w-4" />}
                    label="Çevrimiçi Durumu Göster"
                    description="Aktif olduğunuzda çevrimiçi rozeti göster"
                    action={
                        <Switch
                            checked={privacy.showOnlineStatus}
                            onCheckedChange={(checked) =>
                                onUpdate({ showOnlineStatus: checked })
                            }
                        />
                    }
                />
                <SettingsItem
                    icon={<EyeOff className="h-4 w-4" />}
                    label="Son Görülme Zamanını Göster"
                    description="En son ne zaman aktif olduğunuz gösterilsin"
                    action={
                        <Switch
                            checked={privacy.showLastSeen}
                            onCheckedChange={(checked) =>
                                onUpdate({ showLastSeen: checked })
                            }
                        />
                    }
                />
            </SettingsSection>

            {/* Location */}
            <SettingsSection
                title="Konum Ayarları"
                description="Konum paylaşım tercihleriniz"
            >
                <div className="p-3 -mx-3">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                            <MapPin className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="font-medium text-sm">Varsayılan Konum Paylaşımı</p>
                            <p className="text-xs text-muted-foreground">
                                Bakıcı ile konum paylaşımı tercihi
                            </p>
                        </div>
                    </div>
                    <Select
                        value={privacy.locationSharingDefault}
                        onValueChange={(value: "session_only" | "always" | "never") =>
                            onUpdate({ locationSharingDefault: value })
                        }
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="session_only">
                                Sadece Seans Sırasında
                            </SelectItem>
                            <SelectItem value="always">Her Zaman</SelectItem>
                            <SelectItem value="never">Hiçbir Zaman</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </SettingsSection>

            {/* Data & Analytics */}
            <SettingsSection
                title="Veri ve Analitik"
                description="Verilerinizin nasıl kullanıldığını kontrol edin"
            >
                <SettingsItem
                    icon={<BarChart3 className="h-4 w-4" />}
                    label="Analitik Paylaşımı"
                    description="Anonim kullanım verilerini paylaş"
                    action={
                        <Switch
                            checked={privacy.allowAnalytics}
                            onCheckedChange={(checked) =>
                                onUpdate({ allowAnalytics: checked })
                            }
                        />
                    }
                />
                <SettingsItem
                    icon={<UserCog className="h-4 w-4" />}
                    label="Kişiselleştirme"
                    description="Kişiselleştirilmiş öneriler al"
                    action={
                        <Switch
                            checked={privacy.allowPersonalization}
                            onCheckedChange={(checked) =>
                                onUpdate({ allowPersonalization: checked })
                            }
                        />
                    }
                />
            </SettingsSection>

            {/* KVKK - Data Export */}
            <SettingsSection
                title="Veri Talebi (KVKK)"
                description="Kişisel verilerinizi talep edin"
            >
                <SettingsItem
                    icon={<Download className="h-4 w-4" />}
                    label="Verilerimi İndir"
                    description="Tüm kişisel verilerinizin bir kopyasını alın"
                    onClick={() => setShowExportDialog(true)}
                />
            </SettingsSection>

            {/* Danger Zone */}
            <SettingsSection title="Tehlikeli Bölge" description="Dikkatli olun!">
                <SettingsItem
                    icon={<Trash2 className="h-4 w-4" />}
                    label="Hesabı Sil"
                    description="Hesabınızı ve tüm verilerinizi kalıcı olarak silin"
                    onClick={() => setShowDeleteDialog(true)}
                    danger
                />
            </SettingsSection>

            {/* Data Export Dialog */}
            <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Verilerimi İndir</DialogTitle>
                        <DialogDescription>
                            KVKK kapsamında tüm kişisel verilerinizin bir kopyasını talep edin.
                        </DialogDescription>
                    </DialogHeader>

                    {exportRequested ? (
                        <div className="flex flex-col items-center py-6 text-center">
                            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                                <CheckCircle className="h-6 w-6 text-green-600" />
                            </div>
                            <h4 className="font-medium mb-1">Talebiniz Alındı!</h4>
                            <p className="text-sm text-muted-foreground">
                                Verileriniz hazırlandığında e-posta ile bilgilendirileceksiniz.
                                Bu işlem 24-48 saat sürebilir.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="py-4">
                                <p className="text-sm text-muted-foreground">
                                    Bu işlem şunları içerecektir:
                                </p>
                                <ul className="text-sm text-muted-foreground list-disc list-inside mt-2 space-y-1">
                                    <li>Profil bilgileriniz</li>
                                    <li>Rezervasyon geçmişiniz</li>
                                    <li>Mesaj arşiviniz</li>
                                    <li>Değerlendirmeleriniz</li>
                                    <li>Ödeme bilgileriniz</li>
                                </ul>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowExportDialog(false)}>
                                    İptal
                                </Button>
                                <Button onClick={handleExportRequest} disabled={isSaving}>
                                    {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                    Veri Talep Et
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Account Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            Hesabı Sil
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-left">
                            Bu işlem geri alınamaz. Hesabınız ve tüm verileriniz kalıcı olarak
                            silinecektir.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Şifreniz</Label>
                            <Input
                                type="password"
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                                placeholder="Mevcut şifreniz"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>
                                Onaylamak için <strong>HESABIMI SİL</strong> yazın
                            </Label>
                            <Input
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                placeholder="HESABIMI SİL"
                            />
                        </div>
                    </div>

                    <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteAccount}
                            disabled={
                                deleteConfirmText !== "HESABIMI SİL" ||
                                !deletePassword ||
                                isSaving
                            }
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Hesabımı Sil
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
