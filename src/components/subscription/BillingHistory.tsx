/**
 * BillingHistory - Transaction history display
 */

import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Receipt, Download, CheckCircle, Clock, XCircle, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BillingHistoryEntry } from "@/types/subscription";

interface BillingHistoryProps {
    entries: BillingHistoryEntry[];
}

export function BillingHistory({ entries }: BillingHistoryProps) {
    if (entries.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Receipt className="h-5 w-5" />
                        Fatura Geçmişi
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-center py-4">
                        Henüz fatura geçmişiniz yok.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const statusConfig = {
        paid: {
            icon: CheckCircle,
            color: "text-green-600",
            bgColor: "bg-green-100",
            label: "Ödendi",
        },
        pending: {
            icon: Clock,
            color: "text-amber-600",
            bgColor: "bg-amber-100",
            label: "Beklemede",
        },
        failed: {
            icon: XCircle,
            color: "text-red-600",
            bgColor: "bg-red-100",
            label: "Başarısız",
        },
        refunded: {
            icon: RotateCcw,
            color: "text-blue-600",
            bgColor: "bg-blue-100",
            label: "İade Edildi",
        },
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Fatura Geçmişi
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="divide-y">
                    {entries.map((entry) => {
                        const status = statusConfig[entry.status];
                        const StatusIcon = status.icon;

                        return (
                            <div
                                key={entry.id}
                                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className={cn(
                                            "h-8 w-8 rounded-lg flex items-center justify-center",
                                            status.bgColor
                                        )}
                                    >
                                        <StatusIcon className={cn("h-4 w-4", status.color)} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">{entry.description}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {format(new Date(entry.date), "d MMMM yyyy", {
                                                locale: tr,
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <p className="font-medium">₺{entry.amount}</p>
                                        <Badge
                                            variant="secondary"
                                            className={cn(
                                                "text-xs",
                                                status.color,
                                                status.bgColor
                                            )}
                                        >
                                            {status.label}
                                        </Badge>
                                    </div>
                                    {entry.invoiceUrl && entry.status === "paid" && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => window.open(entry.invoiceUrl, "_blank")}
                                        >
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
