/**
 * SubscriptionPage - Subscription management page
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Crown,
    Loader2,
    CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
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
import { PlanCard, CurrentPlan, BillingHistory } from "@/components/subscription";
import { useSubscription } from "@/hooks/useSubscription";
import type { BillingCycle } from "@/types/subscription";
import { formatPrice } from "@/types/subscription";

export default function SubscriptionPage() {
    const navigate = useNavigate();

    // Mock current user role (in real app, get from auth context)
    const currentUserId = "user-1";
    const userRole = "parent" as "parent" | "sitter";

    const {
        subscription,
        currentPlan,
        plans,
        billingHistory,
        isLoading,
        changePlan,
        cancelSubscription,
        resumeSubscription,
    } = useSubscription({ userId: currentUserId, role: userRole });

    const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const selectedPlan = selectedPlanId ? plans.find((p) => p.id === selectedPlanId) : null;

    const handleSelectPlan = (planId: string) => {
        if (subscription?.planId === planId) return;
        setSelectedPlanId(planId);
        setShowConfirmDialog(true);
    };

    const handleConfirmPlan = async () => {
        if (!selectedPlanId) return;

        setIsProcessing(true);
        try {
            await changePlan(selectedPlanId, billingCycle);
            setShowConfirmDialog(false);
            setShowSuccessDialog(true);
        } catch (err) {
            // Error handled by hook
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCancelSubscription = async () => {
        setIsProcessing(true);
        try {
            await cancelSubscription();
            setShowCancelDialog(false);
        } catch (err) {
            // Error handled by hook
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-white">
            <div className="container max-w-5xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-semibold flex items-center gap-2">
                            <Crown className="h-5 w-5 text-amber-500" />
                            Abonelik Yönetimi
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Planınızı yönetin ve faturalarınızı görüntüleyin
                        </p>
                    </div>
                </div>

                <Tabs defaultValue="plan" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-2 max-w-sm">
                        <TabsTrigger value="plan">Plan</TabsTrigger>
                        <TabsTrigger value="billing">Faturalar</TabsTrigger>
                    </TabsList>

                    {/* Plan Tab */}
                    <TabsContent value="plan" className="space-y-6">
                        {/* Current Plan */}
                        <CurrentPlan
                            subscription={subscription}
                            plan={currentPlan}
                            onManage={() => { }}
                            onCancel={() => setShowCancelDialog(true)}
                            onResume={resumeSubscription}
                        />

                        {/* Billing Cycle Toggle */}
                        <div className="flex items-center justify-center gap-4 py-4">
                            <Label
                                htmlFor="billing-cycle"
                                className={billingCycle === "monthly" ? "font-medium" : "text-muted-foreground"}
                            >
                                Aylık
                            </Label>
                            <Switch
                                id="billing-cycle"
                                checked={billingCycle === "yearly"}
                                onCheckedChange={(checked) =>
                                    setBillingCycle(checked ? "yearly" : "monthly")
                                }
                            />
                            <Label
                                htmlFor="billing-cycle"
                                className={billingCycle === "yearly" ? "font-medium" : "text-muted-foreground"}
                            >
                                Yıllık
                                <span className="ml-1 text-xs text-green-600">2 ay hediye</span>
                            </Label>
                        </div>

                        {/* Plan cards */}
                        <div className="grid gap-4 md:grid-cols-3">
                            {plans.map((plan) => (
                                <PlanCard
                                    key={plan.id}
                                    plan={plan}
                                    billingCycle={billingCycle}
                                    isCurrentPlan={subscription?.planId === plan.id}
                                    onSelect={handleSelectPlan}
                                />
                            ))}
                        </div>

                        {/* FAQ or additional info */}
                        <div className="text-center text-sm text-muted-foreground pt-4">
                            <p>
                                Sorularınız mı var?{" "}
                                <a
                                    href="mailto:destek@kampusabla.com"
                                    className="text-purple-600 hover:underline"
                                >
                                    Bize ulaşın
                                </a>
                            </p>
                        </div>
                    </TabsContent>

                    {/* Billing Tab */}
                    <TabsContent value="billing">
                        <BillingHistory entries={billingHistory} />
                    </TabsContent>
                </Tabs>
            </div>

            {/* Plan Confirmation Dialog */}
            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Planı Değiştir</DialogTitle>
                        <DialogDescription>
                            {selectedPlan?.name} planına geçmek istediğinize emin misiniz?
                        </DialogDescription>
                    </DialogHeader>

                    {selectedPlan && (
                        <div className="py-4">
                            <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                                <div>
                                    <p className="font-medium">{selectedPlan.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {billingCycle === "yearly" ? "Yıllık ödeme" : "Aylık ödeme"}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-lg">
                                        {formatPrice(
                                            billingCycle === "yearly"
                                                ? selectedPlan.yearlyPrice
                                                : selectedPlan.monthlyPrice
                                        )}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        /{billingCycle === "yearly" ? "yıl" : "ay"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowConfirmDialog(false)}
                            disabled={isProcessing}
                        >
                            İptal
                        </Button>
                        <Button onClick={handleConfirmPlan} disabled={isProcessing}>
                            {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Onayla
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Cancel Subscription Dialog */}
            <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Aboneliği İptal Et</AlertDialogTitle>
                        <AlertDialogDescription>
                            Aboneliğinizi iptal etmek istediğinize emin misiniz? Mevcut dönem
                            sonuna kadar tüm özellikleri kullanmaya devam edebilirsiniz.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isProcessing}>Vazgeç</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleCancelSubscription}
                            disabled={isProcessing}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            İptal Et
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Success Dialog */}
            <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
                <DialogContent>
                    <div className="flex flex-col items-center text-center py-6">
                        <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <DialogTitle className="mb-2">Plan Güncellendi!</DialogTitle>
                        <DialogDescription>
                            {selectedPlan?.name} planına başarıyla geçiş yaptınız.
                            Yeni özelliklerinizin keyfini çıkarın!
                        </DialogDescription>
                        <Button className="mt-6" onClick={() => setShowSuccessDialog(false)}>
                            Tamam
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
