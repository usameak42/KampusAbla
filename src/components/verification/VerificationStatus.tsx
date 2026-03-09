/**
 * Verification Status Component - Display current verification status with step indicators
 */

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Shield,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    FileText,
    Camera,
    GraduationCap,
    CreditCard,
    ScanFace,
    FileCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

type VerificationStatusType = "not_started" | "pending" | "in_review" | "verified" | "rejected";

interface VerificationStep {
    key: string;
    label: string;
    icon: React.ElementType;
    completed: boolean;
}

interface VerificationStatusProps {
    status: VerificationStatusType;
    progress: number; // 0-100
    rejectionReason?: string;
    completedDocs?: {
        studentId?: boolean;
        transcript?: boolean;
        studentCertificate?: boolean;
        governmentId?: boolean;
        selfie?: boolean;
        backgroundCheck?: boolean;
    };
}

export function VerificationStatus({
    status,
    progress,
    rejectionReason,
    completedDocs,
}: VerificationStatusProps) {
    const statusConfig = {
        not_started: {
            label: "Başlanmadı",
            icon: AlertCircle,
            color: "text-muted-foreground",
            bgColor: "bg-muted",
            borderColor: "border-muted",
            badgeVariant: "secondary" as const,
        },
        pending: {
            label: "Belgeler Bekleniyor",
            icon: Clock,
            color: "text-warning-foreground",
            bgColor: "bg-warning/15",
            borderColor: "border-warning/30",
            badgeVariant: "secondary" as const,
        },
        in_review: {
            label: "İnceleniyor",
            icon: Shield,
            color: "text-accent-foreground",
            bgColor: "bg-accent",
            borderColor: "border-accent-foreground/20",
            badgeVariant: "secondary" as const,
        },
        verified: {
            label: "Doğrulandı ✓",
            icon: CheckCircle2,
            color: "text-success",
            bgColor: "bg-success/10",
            borderColor: "border-success/30",
            badgeVariant: "secondary" as const,
        },
        rejected: {
            label: "Reddedildi",
            icon: XCircle,
            color: "text-destructive",
            bgColor: "bg-destructive/10",
            borderColor: "border-destructive/30",
            badgeVariant: "destructive" as const,
        },
    };

    const currentStatus = statusConfig[status];
    const StatusIcon = currentStatus.icon;

    // Build step indicators from completedDocs
    const steps: VerificationStep[] = [
        { key: "studentId", label: "Öğrenci Kimliği", icon: GraduationCap, completed: !!completedDocs?.studentId },
        { key: "transcript", label: "Transkript", icon: FileText, completed: !!completedDocs?.transcript },
        { key: "studentCertificate", label: "Öğrenci Belgesi", icon: FileCheck, completed: !!completedDocs?.studentCertificate },
        { key: "governmentId", label: "Kimlik Belgesi", icon: CreditCard, completed: !!completedDocs?.governmentId },
        { key: "selfie", label: "Kimlikli Selfie", icon: ScanFace, completed: !!completedDocs?.selfie },
        { key: "backgroundCheck", label: "Adli Sicil", icon: Camera, completed: !!completedDocs?.backgroundCheck },
    ];

    const completedCount = steps.filter((s) => s.completed).length;

    return (
        <Card className={cn("border-2 transition-colors", currentStatus.borderColor)}>
            <CardContent className="p-6">
                <div className="space-y-6">
                    {/* Status Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={cn("rounded-full p-3", currentStatus.bgColor)}>
                                <StatusIcon className={cn("h-6 w-6", currentStatus.color)} />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Doğrulama Durumu</p>
                                <p className="text-xl font-bold">{currentStatus.label}</p>
                            </div>
                        </div>
                        <Badge variant={currentStatus.badgeVariant} className="text-sm px-3 py-1">
                            {completedCount}/{steps.length} belge
                        </Badge>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Tamamlanma</span>
                            <span className="font-semibold">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2.5" />
                    </div>

                    {/* Step Indicators */}
                    {completedDocs && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {steps.map((step) => {
                                const StepIcon = step.icon;
                                return (
                                    <div
                                        key={step.key}
                                        className={cn(
                                            "flex items-center gap-2 rounded-lg p-2.5 text-sm border transition-colors",
                                            step.completed
                                                ? "bg-success/10 border-success/30 text-foreground"
                                                : "bg-muted/50 border-border text-muted-foreground"
                                        )}
                                    >
                                        {step.completed ? (
                                            <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                                        ) : (
                                            <StepIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                                        )}
                                        <span className="truncate text-xs font-medium">{step.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Status Messages */}
                    <div className="space-y-3">
                        {status === "not_started" && (
                            <div className={cn("p-4 rounded-lg", currentStatus.bgColor)}>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Doğrulama sürecini başlatmak için aşağıdaki belgeleri yükleyin.
                                </p>
                            </div>
                        )}

                        {status === "pending" && (
                            <div className={cn("p-4 rounded-lg border", currentStatus.bgColor, currentStatus.borderColor)}>
                                <p className="text-sm font-medium mb-1">
                                    Tüm belgeleri yükledikten sonra "İnceleme İçin Gönder" butonuna tıklayın.
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Eksik belgeler: {steps.filter((s) => !s.completed).map((s) => s.label).join(", ")}
                                </p>
                            </div>
                        )}

                        {status === "in_review" && (
                            <div className={cn("p-4 rounded-lg border", currentStatus.bgColor, currentStatus.borderColor)}>
                                <p className="text-sm font-medium mb-1">
                                    📋 Belgeleriniz inceleniyor
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Genellikle 1-2 iş günü içinde sonuçlanır. Size e-posta ile bildirim gönderilecektir.
                                </p>
                            </div>
                        )}

                        {status === "verified" && (
                            <div className={cn("p-4 rounded-lg border", currentStatus.bgColor, currentStatus.borderColor)}>
                                <p className="text-sm font-medium mb-1">
                                    🎉 Tebrikler! Doğrulamanız tamamlandı.
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Artık platformda aktif olarak çalışabilir ve rezervasyon alabilirsiniz.
                                </p>
                            </div>
                        )}

                        {status === "rejected" && rejectionReason && (
                            <div className={cn("p-4 rounded-lg border", currentStatus.bgColor, currentStatus.borderColor)}>
                                <p className="text-sm font-medium mb-2 text-destructive">
                                    Doğrulamanız reddedildi
                                </p>
                                <p className="text-xs mb-3 text-destructive/80">
                                    Sebep: {rejectionReason}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Lütfen belgelerinizi kontrol edip tekrar yükleyin.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
