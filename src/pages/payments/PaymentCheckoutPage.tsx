/**
 * PaymentCheckoutPage - Checkout UI for booking payments
 */

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSettings } from "@/hooks/useSettings";
import { useToast } from "@/hooks/use-toast";
import { processPaymentCharge } from "@/services/paymentsApi";
import { PLATFORM_FEE_RATE } from "@/config/constants";
import { useAuth } from "@/contexts/AuthContext";
import { getPaymentErrorMessage, PaymentErrorCode } from "@/lib/payment-error-mapping";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import * as Sentry from "@sentry/react";
import { CriticalFlows } from "@/lib/performance";

const MOCK_CHECKOUT = {
    bookingId: "booking-123",
    sitterName: "Elif Kaya",
    date: "12 Eylül 2024",
    durationHours: 3,
    hourlyRate: 650,
};

export default function PaymentCheckoutPage() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user } = useAuth();
    // Check verification from metadata (KA-022)
    const isVerified = user?.user_metadata?.verification_status === "verified";

    const { settings } = useSettings({ userId: "user-1" });
    const savedCards = settings.payment?.savedCards ?? [];
    const [selectedCardId, setSelectedCardId] = useState<string>(
        savedCards.find((card) => card.isDefault)?.id ?? savedCards[0]?.id ?? ""
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paymentError, setPaymentError] = useState<{ message: string; code?: string } | null>(null);

    const summary = useMemo(() => {
        const subtotal = MOCK_CHECKOUT.durationHours * MOCK_CHECKOUT.hourlyRate;
        const serviceFee = subtotal * PLATFORM_FEE_RATE;
        return {
            subtotal,
            serviceFee,
            total: subtotal + serviceFee,
        };
    }, []);

    const handlePayment = async () => {
        if (!selectedCardId) return;
        const selectedCard = savedCards.find((card) => card.id === selectedCardId);
        if (!selectedCard) return;

        setIsSubmitting(true);
        try {
            const result = await CriticalFlows.trackPaymentProcessing(
                () =>
                    processPaymentCharge({
                        bookingId: MOCK_CHECKOUT.bookingId,
                        cardToken: selectedCard.token,
                        amount: summary.total,
                        currency: "TRY",
                    }),
                {
                    booking_id: MOCK_CHECKOUT.bookingId,
                    currency: "TRY",
                }
            );

            if (!result.success) {
                const code = result.errorCode || 'UNKNOWN';
                const translatedMessage = getPaymentErrorMessage(code as PaymentErrorCode);
                throw new Error(JSON.stringify({ message: translatedMessage, code }));
            }

            toast({
                title: "Ödeme başarılı",
                description: "Rezervasyon onaylandı ve ödeme alındı.",
            });
            const transactionQuery = result.transactionId
                ? `?transactionId=${encodeURIComponent(result.transactionId)}`
                : "";
            navigate(`/checkout/confirmation${transactionQuery}`);
        } catch (error) {
            let errorMsg = "Ödeme alınamadı.";
            let errCode = "UNKNOWN";

            if (error instanceof Error) {
                try {
                    const parsed = JSON.parse(error.message);
                    errorMsg = parsed.message;
                    errCode = parsed.code;
                } catch {
                    errorMsg = error.message;
                }
            }

            setPaymentError({ message: errorMsg, code: errCode });

            // Log to Sentry securely (strip sensitive card data, log amounts and user)
            Sentry.captureMessage(`Ödeme Başarısız: ${errCode}`, {
                level: 'error',
                extra: {
                    errorCode: errCode,
                    bookingId: MOCK_CHECKOUT.bookingId,
                    amount: summary.total,
                    sitterName: MOCK_CHECKOUT.sitterName
                }
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white pb-12">
            <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-semibold">Ödeme</h1>
                        <p className="text-sm text-muted-foreground">
                            Rezervasyon için ödeme adımı
                        </p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Rezervasyon Özeti</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span>Bakıcı</span>
                            <span className="font-medium">{MOCK_CHECKOUT.sitterName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Tarih</span>
                            <span className="font-medium">{MOCK_CHECKOUT.date}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Süre</span>
                            <span className="font-medium">{MOCK_CHECKOUT.durationHours} saat</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Ara toplam</span>
                            <span>₺{summary.subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Platform hizmet bedeli</span>
                            <span>₺{summary.serviceFee.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-base font-semibold pt-2 border-t">
                            <span>Toplam</span>
                            <span>₺{summary.total.toLocaleString()}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Ödeme Yöntemi</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {savedCards.length === 0 ? (
                            <Alert>
                                <CreditCard className="h-4 w-4" />
                                <AlertTitle>Kayıtlı kart bulunamadı</AlertTitle>
                                <AlertDescription>
                                    Ödeme yapabilmek için kart eklemeniz gerekir. Ayarlardan kart ekleyebilirsiniz.
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <RadioGroup value={selectedCardId} onValueChange={setSelectedCardId}>
                                {savedCards.map((card) => (
                                    <div
                                        key={card.id}
                                        className="flex items-start gap-3 p-3 border rounded-lg"
                                    >
                                        <RadioGroupItem value={card.id} id={card.id} className="mt-1" />
                                        <div className="flex-1">
                                            <Label htmlFor={card.id} className="font-medium cursor-pointer">
                                                {card.brand} •••• {card.last4}
                                            </Label>
                                            <p className="text-sm text-muted-foreground">
                                                {card.cardholderName} • {card.expiryMonth}/{card.expiryYear}
                                            </p>
                                        </div>
                                        {card.isDefault && (
                                            <span className="text-xs text-green-600">Varsayılan</span>
                                        )}
                                    </div>
                                ))}
                            </RadioGroup>
                        )}
                    </CardContent>
                </Card>

                <Alert>
                    <ShieldCheck className="h-4 w-4" />
                    <AlertTitle>Güvenli Ödeme</AlertTitle>
                    <AlertDescription>
                        Ödeme bilgileriniz şifrelenerek saklanır ve KVKK kapsamında korunur.
                    </AlertDescription>
                </Alert>

                {!isVerified && (
                    <Alert variant="destructive">
                        <ShieldCheck className="h-4 w-4" />
                        <AlertTitle>Kimlik Doğrulama Gerekli</AlertTitle>
                        <AlertDescription>
                            Ödeme yapabilmek ve rezervasyonu tamamlamak için kimlik doğrulamanızı tamamlamanız gerekmektedir.
                            <Button variant="link" className="p-0 h-auto text-white underline ml-2" onClick={() => navigate("/verification")}>
                                Doğrulamaya Git (Mock)
                            </Button>
                        </AlertDescription>
                    </Alert>
                )}

                {paymentError && (
                    <ErrorAlert
                        title="Ödeme İşlemi Başarısız"
                        error={paymentError.message}
                        onRetry={() => {
                            setPaymentError(null);
                            handlePayment();
                        }}
                    />
                )}

                <Button
                    className="w-full"
                    onClick={handlePayment}
                    disabled={!selectedCardId || isSubmitting || !isVerified}
                >
                    {isSubmitting ? "Ödeme Alınıyor..." : `₺${summary.total.toLocaleString()} Öde`}
                </Button>
            </div>
        </div>
    );
}
