/**
 * SecuritySettings - Password, 2FA, and device management
 */

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import {
    Lock,
    Smartphone,
    Shield,
    Bell,
    Trash2,
    Loader2,
    Monitor,
    CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
import type { SecuritySettings as SecuritySettingsType, TrustedDevice } from "@/types/settings";

interface SecuritySettingsProps {
    security: SecuritySettingsType;
    onUpdateSecurity: (data: Partial<SecuritySettingsType>) => Promise<void>;
    onChangePassword: (current: string, newPassword: string) => Promise<void>;
    onRemoveDevice: (deviceId: string) => Promise<void>;
    isSaving: boolean;
}

export function SecuritySettings({
    security,
    onUpdateSecurity,
    onChangePassword,
    onRemoveDevice,
    isSaving,
}: SecuritySettingsProps) {
    const [showPasswordDialog, setShowPasswordDialog] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordError, setPasswordError] = useState<string | null>(null);

    const [deviceToRemove, setDeviceToRemove] = useState<TrustedDevice | null>(null);

    const handleChangePassword = async () => {
        setPasswordError(null);

        if (newPassword.length < 8) {
            setPasswordError("Şifre en az 8 karakter olmalıdır");
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError("Şifreler eşleşmiyor");
            return;
        }

        try {
            await onChangePassword(currentPassword, newPassword);
            setShowPasswordDialog(false);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err) {
            setPasswordError("Şifre değiştirilemedi");
        }
    };

    const handleToggle2FA = async () => {
        await onUpdateSecurity({ twoFactorEnabled: !security.twoFactorEnabled });
    };

    const handleToggleLoginNotifications = async () => {
        await onUpdateSecurity({ loginNotifications: !security.loginNotifications });
    };

    return (
        <>
            <SettingsSection title="Güvenlik" description="Hesap güvenliği ayarlarınız">
                {/* Password */}
                <SettingsItem
                    icon={<Lock className="h-4 w-4" />}
                    label="Şifre"
                    description="Son değişiklik: Bilinmiyor"
                    onClick={() => setShowPasswordDialog(true)}
                />

                {/* 2FA */}
                <SettingsItem
                    icon={<Shield className="h-4 w-4" />}
                    label="İki Faktörlü Doğrulama"
                    description={security.twoFactorEnabled ? "Aktif" : "Kapalı"}
                    action={
                        <Switch
                            checked={security.twoFactorEnabled}
                            onCheckedChange={handleToggle2FA}
                        />
                    }
                />

                {/* Login Notifications */}
                <SettingsItem
                    icon={<Bell className="h-4 w-4" />}
                    label="Giriş Bildirimleri"
                    description="Yeni cihazlardan giriş yapıldığında bildir"
                    action={
                        <Switch
                            checked={security.loginNotifications}
                            onCheckedChange={handleToggleLoginNotifications}
                        />
                    }
                />
            </SettingsSection>

            {/* Trusted Devices */}
            <SettingsSection
                title="Güvenilir Cihazlar"
                description="Hesabınıza erişimi olan cihazlar"
            >
                {security.trustedDevices.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-3">
                        Kayıtlı cihaz yok
                    </p>
                ) : (
                    security.trustedDevices.map((device) => (
                        <div
                            key={device.id}
                            className="flex items-center justify-between gap-3 p-3 -mx-3 rounded-lg hover:bg-muted/50"
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                                    {device.name.toLowerCase().includes("phone") ||
                                        device.name.toLowerCase().includes("iphone") ||
                                        device.name.toLowerCase().includes("android") ? (
                                        <Smartphone className="h-4 w-4" />
                                    ) : (
                                        <Monitor className="h-4 w-4" />
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-sm">{device.name}</p>
                                        {device.isCurrent && (
                                            <Badge variant="secondary" className="text-xs">
                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                Bu Cihaz
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {device.browser} • Son kullanım:{" "}
                                        {formatDistanceToNow(new Date(device.lastUsed), {
                                            addSuffix: true,
                                            locale: tr,
                                        })}
                                    </p>
                                </div>
                            </div>
                            {!device.isCurrent && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-600"
                                    onClick={() => setDeviceToRemove(device)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    ))
                )}
            </SettingsSection>

            {/* Change Password Dialog */}
            <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Şifre Değiştir</DialogTitle>
                        <DialogDescription>
                            Güçlü bir şifre seçin. En az 8 karakter kullanın.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Mevcut Şifre</Label>
                            <Input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="••••••••"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Yeni Şifre</Label>
                            <Input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="••••••••"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Yeni Şifre (Tekrar)</Label>
                            <Input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                            />
                        </div>
                        {passwordError && (
                            <p className="text-sm text-red-600">{passwordError}</p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
                            İptal
                        </Button>
                        <Button
                            onClick={handleChangePassword}
                            disabled={isSaving || !currentPassword || !newPassword || !confirmPassword}
                        >
                            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Değiştir
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Remove Device Confirmation */}
            <AlertDialog open={!!deviceToRemove} onOpenChange={() => setDeviceToRemove(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cihazı Kaldır</AlertDialogTitle>
                        <AlertDialogDescription>
                            <strong>{deviceToRemove?.name}</strong> cihazını güvenilir cihazlardan
                            kaldırmak istediğinize emin misiniz? Bu cihazdan tekrar giriş
                            yapmanız gerekecektir.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (deviceToRemove) {
                                    onRemoveDevice(deviceToRemove.id);
                                    setDeviceToRemove(null);
                                }
                            }}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Kaldır
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
