/**
 * Account Deletion Modal - KVKK Article 7 Compliance
 * Handles account deletion requests with 30-day grace period
 */

import { useState } from 'react';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Loader2, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AccountDeletionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDeleted?: () => void;
}

export function AccountDeletionModal({
    isOpen,
    onClose,
    onDeleted,
}: AccountDeletionModalProps) {
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmed, setConfirmed] = useState(false);

    const handleRequestDeletion = async () => {
        if (!confirmed) return;

        setIsSubmitting(true);
        try {
            const { data, error } = await supabase.functions.invoke('delete-account', {
                body: { action: 'request', reason },
            });

            if (error) throw error;

            toast.success('Hesap silme talebi oluşturuldu. 30 gün içinde iptal edebilirsiniz.');

            if (onDeleted) onDeleted();
            onClose();
        } catch (error) {
            console.error('Deletion error:', error);
            toast.error('Hesap silme talebi oluşturulamadı');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent className="max-w-lg">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Hesabınızı Silmek İstediğinize Emin Misiniz?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Bu işlem geri alınamaz. Hesabınızı silmek için talebi onayladıktan sonra
                        30 gün içinde fikrinizi değiştirebilirsiniz.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-4">
                    {/* Warning Info */}
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            <strong>Uyarı:</strong> 30 gün sonra hesabınız kalıcı olarak silinecektir:
                        </AlertDescription>
                    </Alert>

                    {/* What Will Be Deleted */}
                    <div className="space-y-2">
                        <Label className="font-semibold">Silinecek Veriler:</Label>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                            <li>Profil bilgileriniz (ad, e-posta, telefon)</li>
                            <li>Çocuk profilleri ve alış-bırakış bilgileri</li>
                            <li>Tüm mesajlarınız</li>
                            <li>GPS konum geçmişiniz</li>
                            <li>Bildirimler ve tercihler</li>
                            <li>KVKK onayları</li>
                        </ul>
                    </div>

                    {/* What Will Be Kept */}
                    <div className="space-y-2">
                        <Label className="font-semibold">Anonimleştirilerek Saklanacaklar:</Label>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                            <li>Rezervasyon kayıtları (7 yıl - vergi kanunu gereği)</li>
                            <li>Ödeme işlemleri (7 yıl - vergi kanunu gereği)</li>
                        </ul>
                        <p className="text-xs text-muted-foreground">
                            <Shield className="inline h-3 w-3 mr-1" />
                            Bu veriler kişisel bilgileriniz olmadan, sadece yasal gereklilik
                            için saklanacaktır.
                        </p>
                    </div>

                    {/* Optional Reason */}
                    <div className="space-y-2">
                        <Label htmlFor="reason">Neden hesabınızı siliyorsunuz? (İsteğe bağlı)</Label>
                        <Textarea
                            id="reason"
                            placeholder="Görüşleriniz bizim için değerli..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                        />
                    </div>

                    {/* Confirmation Checkbox */}
                    <div className="flex items-start space-x-2 p-3 border rounded-lg">
                        <input
                            type="checkbox"
                            id="confirm"
                            checked={confirmed}
                            onChange={(e) => setConfirmed(e.target.checked)}
                            className="mt-1"
                        />
                        <Label htmlFor="confirm" className="text-sm cursor-pointer">
                            Yukarıdaki bilgileri okudum ve hesabımın 30 gün içinde kalıcı
                            olarak silineceğini anlıyorum.
                        </Label>
                    </div>
                </div>

                <AlertDialogFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        İptal
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleRequestDeletion}
                        disabled={!confirmed || isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                İşleniyor...
                            </>
                        ) : (
                            'Hesabı Sil'
                        )}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
