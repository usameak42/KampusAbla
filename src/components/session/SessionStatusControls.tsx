/**
 * Session Status Controls - Buttons for sitter to update session status
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Car,
    MapPin,
    Play,
    CheckCircle,
    Loader2,
    AlertTriangle,
} from "lucide-react";
import {
    type SessionStatus,
    STATUS_INFO,
    getNextStatuses,
    canTransitionTo
} from "@/types/session";
import { HandoverVerification } from "./HandoverVerification";

interface SessionStatusControlsProps {
    currentStatus: SessionStatus;
    onStatusChange: (newStatus: SessionStatus, note?: string) => Promise<void>;
    isLoading?: boolean;
    viewMode: "sitter" | "parent";
    // Handover props
    handoverPin?: string;
    handoverStartConfirmedAt?: Date;
    handoverEndConfirmedAt?: Date;
    onHandoverConfirm?: (mode: "start" | "end") => Promise<void>;
}

// Button config for each status transition
const STATUS_BUTTONS: Record<SessionStatus, { icon: React.ElementType; label: string; variant: "default" | "outline" | "destructive" }> = {
    "on-way": { icon: Car, label: "Yola Çıktım", variant: "default" },
    "arrived": { icon: MapPin, label: "Vardım", variant: "default" },
    "in-progress": { icon: Play, label: "Başlat", variant: "default" },
    "completed": { icon: CheckCircle, label: "Bitir", variant: "outline" },
    "cancelled": { icon: AlertTriangle, label: "İptal Et", variant: "destructive" },
    "pending": { icon: Loader2, label: "Bekliyor", variant: "outline" },
};

export function SessionStatusControls({
    currentStatus,
    onStatusChange,
    isLoading = false,
    viewMode,
    handoverPin,
    handoverStartConfirmedAt,
    handoverEndConfirmedAt,
    onHandoverConfirm,
}: SessionStatusControlsProps) {
    const [confirmDialog, setConfirmDialog] = useState<SessionStatus | null>(null);
    const [note, setNote] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Handover state
    const [showHandover, setShowHandover] = useState<"start" | "end" | null>(null);

    const nextStatuses = getNextStatuses(currentStatus);
    const statusInfo = STATUS_INFO[currentStatus];

    // Only sitter can change status (parent just views)
    if (viewMode === "parent") {
        return (
            <>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Oturum Durumu</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-3">
                            <span className="text-3xl">{statusInfo.emoji}</span>
                            <div>
                                <p className={`font-semibold ${statusInfo.color}`}>{statusInfo.label}</p>
                                <p className="text-sm text-muted-foreground">
                                    {currentStatus === "arrived" && !handoverStartConfirmedAt
                                        ? "Bakıcı teslim almayı bekliyor"
                                        : currentStatus === "in-progress" && !handoverEndConfirmedAt
                                            ? "Bakıcı teslim etmeyi bekliyor"
                                            : "Bakıcı durumu güncelleyecek"}
                                </p>
                            </div>
                        </div>

                        {/* Parent Handover Buttons */}
                        {currentStatus === "arrived" && !handoverStartConfirmedAt && (
                            <Button
                                className="w-full mt-4"
                                onClick={() => setShowHandover("start")}
                            >
                                Teslim Etme Kodunu Göster
                            </Button>
                        )}
                        {currentStatus === "in-progress" && !handoverEndConfirmedAt && (
                            <Button
                                className="w-full mt-4"
                                onClick={() => setShowHandover("end")}
                            >
                                Teslim Alma Kodunu Göster
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* Handover Modal for Parent */}
                {handoverPin && (
                    <HandoverVerification
                        isOpen={!!showHandover}
                        onClose={() => setShowHandover(null)}
                        mode={showHandover || "start"}
                        viewMode="parent"
                        handoverPin={handoverPin}
                        onVerify={async () => { /* Parent just views */ }}
                    />
                )}
            </>
        );
    }

    const handleStatusClick = (status: SessionStatus) => {
        // Intercept Start Session -> Require Handover Start
        if (status === "in-progress") {
            if (!handoverStartConfirmedAt) {
                setShowHandover("start");
                return;
            }
        }

        // Intercept Complete Session -> Require Handover End
        if (status === "completed") {
            if (!handoverEndConfirmedAt) {
                setShowHandover("end");
                return;
            }
        }

        // For completed or cancelled, show confirmation
        if (status === "completed" || status === "cancelled") {
            setConfirmDialog(status);
        } else {
            handleConfirm(status);
        }
    };

    // Handover success handler
    const handleHandoverSuccess = async () => {
        if (!showHandover || !onHandoverConfirm) return;

        try {
            await onHandoverConfirm(showHandover);
            setShowHandover(null);

            // Auto-transition status after handover?
            // Usually we might want to let them click start, but auto is smoother.
            // But let's stick to just verifying first, then they click start.
            // Or better: Verify calls the API, then we proceed.

            if (showHandover === "start" && canTransitionTo(currentStatus, "in-progress")) {
                handleConfirm("in-progress");
            } else if (showHandover === "end" && canTransitionTo(currentStatus, "completed")) {
                // For completion we usually want a note, so maybe just open the dialog
                setConfirmDialog("completed");
            }
        } catch (err) {
            // Error handled in component
        }
    };

    const handleConfirm = async (status: SessionStatus) => {
        setIsSubmitting(true);
        try {
            await onStatusChange(status, note || undefined);
            setConfirmDialog(null);
            setNote("");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center justify-between">
                        <span>Durum Güncelle</span>
                        <Badge className={statusInfo.color.replace("text-", "bg-").replace("-500", "-100")}>
                            {statusInfo.emoji} {statusInfo.label}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {nextStatuses.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            Oturum tamamlandı
                        </p>
                    ) : (
                        <div className="grid grid-cols-2 gap-2">
                            {nextStatuses.map((status) => {
                                const config = STATUS_BUTTONS[status];
                                const Icon = config.icon;

                                return (
                                    <Button
                                        key={status}
                                        variant={config.variant}
                                        className={`h-auto py-3 ${status === "cancelled" ? "hover:bg-red-50" : ""
                                            }`}
                                        onClick={() => handleStatusClick(status)}
                                        disabled={isLoading}
                                    >
                                        <div className="flex flex-col items-center gap-1">
                                            <Icon className="h-5 w-5" />
                                            <span className="text-sm">{config.label}</span>
                                        </div>
                                    </Button>
                                );
                            })}
                        </div>
                    )}

                    {/* Status Progress Indicator */}
                    <div className="flex items-center justify-between pt-3 border-t">
                        {["pending", "on-way", "arrived", "in-progress", "completed"].map((status, index) => {
                            const isActive = status === currentStatus;
                            const isPassed = ["pending", "on-way", "arrived", "in-progress", "completed"]
                                .indexOf(currentStatus) > index;

                            return (
                                <div key={status} className="flex items-center">
                                    <div className={`w-3 h-3 rounded-full ${isActive ? "bg-primary ring-4 ring-primary/20" :
                                        isPassed ? "bg-green-500" : "bg-gray-200"
                                        }`} />
                                    {index < 4 && (
                                        <div className={`w-8 h-0.5 ${isPassed ? "bg-green-500" : "bg-gray-200"
                                            }`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Confirmation Dialog */}
            <Dialog open={confirmDialog !== null} onOpenChange={() => setConfirmDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {confirmDialog === "completed" ? "Oturumu Bitir" : "Oturumu İptal Et"}
                        </DialogTitle>
                        <DialogDescription>
                            {confirmDialog === "completed"
                                ? "Oturumun tamamlandığını onaylıyor musunuz?"
                                : "Oturumu iptal etmek istediğinizden emin misiniz?"}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                        <Label htmlFor="note">Not (isteğe bağlı)</Label>
                        <Textarea
                            id="note"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder={
                                confirmDialog === "completed"
                                    ? "Oturum hakkında not ekleyin..."
                                    : "İptal sebebini yazın..."
                            }
                            rows={3}
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setConfirmDialog(null)}
                            disabled={isSubmitting}
                        >
                            Vazgeç
                        </Button>
                        <Button
                            variant={confirmDialog === "cancelled" ? "destructive" : "default"}
                            onClick={() => confirmDialog && handleConfirm(confirmDialog)}
                            disabled={isSubmitting}
                        >
                            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {confirmDialog === "completed" ? "Bitir" : "İptal Et"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Handover Verification Modal */}
            {handoverPin && onHandoverConfirm && (
                <HandoverVerification
                    isOpen={!!showHandover}
                    onClose={() => setShowHandover(null)}
                    mode={showHandover || "start"}
                    viewMode="sitter"
                    handoverPin={handoverPin}
                    onVerify={handleHandoverSuccess}
                />
            )}
        </>
    );
}
