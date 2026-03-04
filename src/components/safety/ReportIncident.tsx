/**
 * Report Incident Component - Safety report form
 */

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    AlertTriangle,
    Shield,
    Phone,
    Loader2,
    FileText,
    Camera,
} from "lucide-react";

interface ReportIncidentProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (report: IncidentReport) => Promise<void>;
    sessionId?: string;
    reportedUserId?: string;
    reportedUserName?: string;
}

export interface IncidentReport {
    type: "safety" | "conduct" | "payment" | "other";
    severity: "low" | "medium" | "high" | "emergency";
    description: string;
    sessionId?: string;
    reportedUserId?: string;
    attachments?: File[];
}

const INCIDENT_TYPES = [
    { id: "safety", label: "Güvenlik Sorunu", icon: Shield, description: "Fiziksel tehlike, acil durum" },
    { id: "conduct", label: "Uygunsuz Davranış", icon: AlertTriangle, description: "Profesyonel olmayan tutum" },
    { id: "payment", label: "Ödeme Sorunu", icon: FileText, description: "Ücret anlaşmazlığı" },
    { id: "other", label: "Diğer", icon: FileText, description: "Yukarıdakilere uymayan" },
] as const;

const SEVERITY_LEVELS = [
    { id: "low", label: "Düşük", color: "text-green-600", description: "Bilgilendirme amaçlı" },
    { id: "medium", label: "Orta", color: "text-yellow-600", description: "İnceleme gerektirir" },
    { id: "high", label: "Yüksek", color: "text-orange-600", description: "Acil inceleme gerektirir" },
    { id: "emergency", label: "Acil", color: "text-red-600", description: "Derhal müdahale gerektirir" },
] as const;

export function ReportIncident({
    isOpen,
    onClose,
    onSubmit,
    sessionId,
    reportedUserId,
    reportedUserName,
}: ReportIncidentProps) {
    const [type, setType] = useState<IncidentReport["type"]>("conduct");
    const [severity, setSeverity] = useState<IncidentReport["severity"]>("medium");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (description.length < 20) {
            setError("Lütfen en az 20 karakter açıklama yazın");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await onSubmit({
                type,
                severity,
                description,
                sessionId,
                reportedUserId,
            });
            handleClose();
        } catch {
            setError("Rapor gönderilemedi. Lütfen tekrar deneyin.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setType("conduct");
        setSeverity("medium");
        setDescription("");
        setError(null);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                        Olay Bildir
                    </DialogTitle>
                    <DialogDescription>
                        {reportedUserName
                            ? `${reportedUserName} hakkında bir olay bildiriyorsunuz.`
                            : "Yaşadığınız sorunu bize bildirin."
                        }
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Emergency Alert */}
                    {severity === "emergency" && (
                        <Alert variant="destructive">
                            <Phone className="h-4 w-4" />
                            <AlertTitle>Acil Durum</AlertTitle>
                            <AlertDescription>
                                Acil bir tehlike durumundaysanız lütfen 112'yi arayın!
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Incident Type */}
                    <div className="space-y-3">
                        <Label>Olay Türü</Label>
                        <RadioGroup value={type} onValueChange={(value: IncidentReport["type"]) => setType(value)}>
                            <div className="grid grid-cols-2 gap-2">
                                {INCIDENT_TYPES.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <div
                                            key={item.id}
                                            className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 ${type === item.id ? "border-primary bg-primary/5" : ""
                                                }`}
                                            onClick={() => setType(item.id)}
                                        >
                                            <RadioGroupItem value={item.id} id={item.id} />
                                            <div className="flex-1">
                                                <Label htmlFor={item.id} className="text-sm font-medium cursor-pointer">
                                                    {item.label}
                                                </Label>
                                            </div>
                                            <Icon className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    );
                                })}
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Severity */}
                    <div className="space-y-3">
                        <Label>Önem Derecesi</Label>
                        <RadioGroup
                            value={severity}
                            onValueChange={(value: IncidentReport["severity"]) => setSeverity(value)}
                        >
                            <div className="grid grid-cols-4 gap-2">
                                {SEVERITY_LEVELS.map((level) => (
                                    <div
                                        key={level.id}
                                        className={`flex flex-col items-center p-2 border rounded-lg cursor-pointer hover:bg-muted/50 text-center ${severity === level.id ? "border-primary bg-primary/5" : ""
                                            }`}
                                        onClick={() => setSeverity(level.id)}
                                    >
                                        <RadioGroupItem value={level.id} id={level.id} className="sr-only" />
                                        <span className={`text-sm font-medium ${level.color}`}>
                                            {level.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Açıklama *</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Lütfen yaşadığınız olayı detaylı bir şekilde açıklayın..."
                            rows={4}
                        />
                        <p className="text-xs text-muted-foreground">
                            {description.length}/500 karakter
                        </p>
                    </div>

                    {/* Error */}
                    {error && (
                        <p className="text-sm text-red-500">{error}</p>
                    )}

                    {/* Info */}
                    <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                        <p className="font-medium mb-1">Raporunuz:</p>
                        <ul className="list-disc list-inside space-y-0.5 text-xs">
                            <li>24 saat içinde incelenecek</li>
                            <li>Gerekirse sizinle iletişime geçilecek</li>
                            <li>Gizli tutulacak</li>
                        </ul>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isSubmitting}
                    >
                        İptal
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleSubmit}
                        disabled={isSubmitting || description.length < 20}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Gönderiliyor...
                            </>
                        ) : (
                            <>
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                Bildir
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
