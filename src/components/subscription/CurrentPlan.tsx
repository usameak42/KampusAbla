/**
 * CurrentPlan - Display current subscription status
 */

import { formatDistanceToNow, format } from "date-fns";
import { tr } from "date-fns/locale";
import { Calendar, CreditCard, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import type { UserSubscription, SubscriptionPlan } from "@/types/subscription";
import { formatPrice } from "@/types/subscription";

interface CurrentPlanProps {
    subscription: UserSubscription | null;
    plan: SubscriptionPlan | null;
    onManage?: () => void;
    onCancel?: () => void;
    onResume?: () => void;
}

export function CurrentPlan({
    subscription,
    plan,
    onManage,
    onCancel,
    onResume,
}: CurrentPlanProps) {
    if (!subscription || !plan) {
        return (
            <Card>
                <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">
                        Henüz aktif bir aboneliğiniz yok.
                    </p>
                    <Button className="mt-4" onClick={onManage}>
                        Planları İncele
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const statusColors = {
        active: "bg-green-100 text-green-800",
        trialing: "bg-blue-100 text-blue-800",
        cancelled: "bg-gray-100 text-gray-800",
        past_due: "bg-red-100 text-red-800",
    };

    const statusLabels = {
        active: "Aktif",
        trialing: "Deneme",
        cancelled: "İptal Edildi",
        past_due: "Ödeme Gecikmiş",
    };

    const price =
        subscription.billingCycle === "yearly"
            ? plan.yearlyPrice
            : plan.monthlyPrice;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Mevcut Planınız</CardTitle>
                    <Badge className={statusColors[subscription.status]}>
                        {statusLabels[subscription.status]}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Plan info */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl">
                    <div>
                        <h3 className="font-semibold text-lg">{plan.name}</h3>
                        <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-xl">{formatPrice(price)}</p>
                        <p className="text-xs text-muted-foreground">
                            {subscription.billingCycle === "yearly" ? "yıllık" : "aylık"}
                        </p>
                    </div>
                </div>

                {/* Cancellation warning */}
                {subscription.cancelAtPeriodEnd && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            Aboneliğiniz{" "}
                            {format(new Date(subscription.currentPeriodEnd), "d MMMM yyyy", {
                                locale: tr,
                            })}
                            {" "}tarihinde sona erecek ve yenilenmeyecek.
                            <Button
                                variant="link"
                                size="sm"
                                className="h-auto p-0 ml-1"
                                onClick={onResume}
                            >
                                Aboneliği devam ettir
                            </Button>
                        </AlertDescription>
                    </Alert>
                )}

                {/* Details */}
                <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Sonraki fatura:</span>
                        <span>
                            {format(new Date(subscription.currentPeriodEnd), "d MMMM yyyy", {
                                locale: tr,
                            })}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Faturalama:</span>
                        <span>
                            {subscription.billingCycle === "yearly" ? "Yıllık" : "Aylık"}
                        </span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1" onClick={onManage}>
                        Planı Değiştir
                    </Button>
                    {!subscription.cancelAtPeriodEnd && subscription.tier !== "free" && (
                        <Button
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={onCancel}
                        >
                            İptal Et
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
