/**
 * Cancel Booking Modal - Confirmation flow for cancelling a booking
 */

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Loader2, XCircle } from "lucide-react";
import { calculateCancellationPolicy, calculateReliabilityImpact } from "@/lib/cancellation";

interface CancelBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => Promise<void>;
    bookingDate: Date;
    totalAmount: number;
    bookingCreatedAt: Date;
    viewMode: "parent" | "sitter";
    startTime?: string;
}

const CANCEL_REASONS = [
    { id: "schedule", label: "Planlarım değişti" },
    { id: "emergency", label: "Acil bir durum oluştu" },
    { id: "found_alternative", label: "Başka bir seçenek buldum" },
    { id: "sitter_issue", label: "Bakıcıyla ilgili bir sorun var" },
    { id: "other", label: "Diğer" },
];

export function CancelBookingModal({
    isOpen,
    onClose,
    onConfirm,
    bookingDate,
    totalAmount,
    bookingCreatedAt,
    viewMode,
    startTime = "09:00",
}: CancelBookingModalProps) {
    const [selectedReason, setSelectedReason] = useState<string>("");
    const [customReason, setCustomReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const policy = calculateCancellationPolicy({
        bookingDate,
        startTime: "09:00", // Defaulting for now if not provided, or ensure it's in props
        totalAmount,
        bookingCreatedAt,
    });

    const isLateCancel = policy.feeAmount > 0;
    const cancellationFee = policy.feeAmount;

    // Reliability impact for sitters
    const reliability = calculateReliabilityImpact(bookingDate, startTime);
    const hasReliabilityImpact = viewMode === "sitter";

    const policyMessages = {
        grace_period: "Henüz oluşturduğunuz için ücretsiz iptal edebilirsiniz.",
        more_than_12_hours: "Randevunuza 12 saatten fazla kaldığı için tam iade uygulanır.",
        between_12_and_3_hours: "Randevunuza 3-12 saat arası kaldığı için (limitiniz dâhilindeyse) ücretsiz iptal edebilirsiniz.",
        less_than_3_hours: "Randevunuza 3 saatten az kaldığı için ücret iadesi yapılmaz.",
    } as const;

    const handleSubmit = async () => {
        const reason = selectedReason === "other"
            ? customReason
            : CANCEL_REASONS.find(r => r.id === selectedReason)?.label || "";

        if (!reason.trim()) {
            setError("Lütfen bir iptal sebebi seçin veya yazın");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await onConfirm(reason);
            handleClose();
        } catch {
            setError("İptal işlemi başarısız oldu. Lütfen tekrar deneyin.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setSelectedReason("");
            setCustomReason("");
            setError(null);
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <XCircle className="h-5 w-5" />
                        Randevuyu İptal Et
                    </DialogTitle>
                    <DialogDescription>
                        Bu işlem geri alınamaz. İptal etmek istediğinizden emin misiniz?
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Late cancellation warning */}
                    {isLateCancel && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Geç İptal Uyarısı</AlertTitle>
                            <AlertDescription>
                                Randevunuza 24 saatten az kaldığı için %25 iptal ücreti (₺{cancellationFee})
                                uygulanacaktır.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Reliability impact warning for sitters */}
                    {hasReliabilityImpact && (
                        <Alert className="border-amber-200 bg-amber-50">
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                            <AlertTitle className="text-amber-800 font-semibold">Güvenilirlik Puanı Etkisi</AlertTitle>
                            <AlertDescription className="text-amber-700">
                                Bu iptal işlemi güvenilirlik puanınızı <span className="font-bold">{reliability.scoreImpact} puan</span> etkileyecektir.
                                ({reliability.reason})
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Cancel reason selection */}
                    <div className="space-y-3">
                        <Label>İptal Sebebi *</Label>
                        <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
                            {CANCEL_REASONS.map((reason) => (
                                <div key={reason.id} className="flex items-center space-x-2">
                                    <RadioGroupItem value={reason.id} id={reason.id} />
                                    <Label htmlFor={reason.id} className="font-normal cursor-pointer">
                                        {reason.label}
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>

                    {/* Custom reason input */}
                    {selectedReason === "other" && (
                        <div className="space-y-2">
                            <Label htmlFor="customReason">Sebebinizi yazın</Label>
                            <Textarea
                                id="customReason"
                                value={customReason}
                                onChange={(e) => setCustomReason(e.target.value)}
                                placeholder="İptal sebebinizi buraya yazın..."
                                rows={3}
                            />
                        </div>
                    )}

                    {/* Error message */}
                    {error && (
                        <p className="text-sm text-red-500">{error}</p>
                    )}

                    {/* Info box */}
                    <div className="bg-muted p-3 rounded-lg text-sm space-y-1">
                        <p className="font-medium">İptal durumunda:</p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-1">
                            <li>Bakıcıya otomatik bildirim gönderilir</li>
                            {isLateCancel ? (
                                <li>₺{cancellationFee} iptal ücreti kesilir</li>
                            ) : (
                                <li>Ücret iadesi yapılır (varsa)</li>
                            )}
                            {hasReliabilityImpact && (
                                <li className="text-amber-600 font-medium">Güvenilirlik puanınız düşürülür</li>
                            )}
                            <li>Randevu kaydı arşivlenir</li>
                        </ul>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isSubmitting}
                    >
                        Vazgeç
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleSubmit}
                        disabled={!selectedReason || isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                İptal Ediliyor...
                            </>
                        ) : (
                            <>
                                <XCircle className="h-4 w-4 mr-2" />
                                İptal Et
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
