/**
 * Verification Status Component - Display current verification status and progress
 */

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Shield,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

type VerificationStatusType = "not_started" | "pending" | "in_review" | "verified" | "rejected";

interface VerificationStatusProps {
    status: VerificationStatusType;
    progress: number; // 0-100
    rejectionReason?: string;
}

export function VerificationStatus({
    status,
    progress,
    rejectionReason,
}: VerificationStatusProps) {
    const statusConfig = {
        not_started: {
            label: "Başlanmadı",
            icon: AlertCircle,
            color: "text-gray-600",
            bgColor: "bg-gray-100",
            badgeVariant: "secondary" as const,
        },
        pending: {
            label: "Beklemede",
            icon: Clock,
            color: "text-yellow-600",
            bgColor: "bg-yellow-100",
            badgeVariant: "secondary" as const,
        },
        in_review: {
            label: "İnceleniyor",
            icon: Shield,
            color: "text-blue-600",
            bgColor: "bg-blue-100",
            badgeVariant: "secondary" as const,
        },
        verified: {
            label: "Doğrulandı",
            icon: CheckCircle2,
            color: "text-green-600",
            bgColor: "bg-green-100",
            badgeVariant: "secondary" as const,
        },
        rejected: {
            label: "Reddedildi",
            icon: XCircle,
            color: "text-red-600",
            bgColor: "bg-red-100",
            badgeVariant: "destructive" as const,
        },
    };

    const currentStatus = statusConfig[status];
    const StatusIcon = currentStatus.icon;

    return (
        <Card>
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
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Tamamlanma</span>
                            <span className="font-semibold">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>

                    {/* Status Messages */}
                    <div className="space-y-3">
                        {status === "pending" && (
                            <div className={cn("p-4 rounded-lg", currentStatus.bgColor)}>
                                <p className={cn("text-sm font-medium", currentStatus.color)}>
                                    Tüm belgeleri yükledikten sonra "İnceleme İçin Gönder" butonuna tıklayın.
                                </p>
                            </div>
                        )}

                        {status === "in_review" && (
                            <div className={cn("p-4 rounded-lg", currentStatus.bgColor)}>
                                <p className={cn("text-sm font-medium mb-1", currentStatus.color)}>
                                    Belgeleriniz inceleniyor
                                </p>
                                <p className={cn("text-xs", currentStatus.color)}>
                                    Genellikle 1-2 iş günü içinde sonuçlanır. Size e-posta ile bildirim gönderilecektir.
                                </p>
                            </div>
                        )}

                        {status === "verified" && (
                            <div className={cn("p-4 rounded-lg", currentStatus.bgColor)}>
                                <p className={cn("text-sm font-medium mb-1", currentStatus.color)}>
                                    🎉 Tebrikler! Doğrulamanız tamamlandı.
                                </p>
                                <p className={cn("text-xs", currentStatus.color)}>
                                    Artık platformda aktif olarak çalışabilir ve rezervasyon alabilirsiniz.
                                </p>
                            </div>
                        )}

                        {status === "rejected" && rejectionReason && (
                            <div className={cn("p-4 rounded-lg", currentStatus.bgColor)}>
                                <p className={cn("text-sm font-medium mb-2", currentStatus.color)}>
                                    Doğrulamanız reddedildi
                                </p>
                                <p className={cn("text-xs mb-3", currentStatus.color)}>
                                    Sebep: {rejectionReason}
                                </p>
                                <p className={cn("text-xs", currentStatus.color)}>
                                    Lütfen belgelerinizi kontrol edip tekrar yükleyin.
                                </p>
                            </div>
                        )}
                    </div>
                    {/* Badge Progress removed for KA-020 */}
                </div>
            </CardContent>
        </Card>
    );
}
