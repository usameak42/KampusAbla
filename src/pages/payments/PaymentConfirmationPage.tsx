/**
 * PaymentConfirmationPage - Success page after payment
 */

import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, Calendar, ArrowRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PaymentConfirmationPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const transactionId = searchParams.get("transactionId") || "MOCK-TX-123";

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-white flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="flex justify-center">
                    <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                        <CheckCircle className="h-12 w-12" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold">Ödeme Başarılı!</h1>
                    <p className="text-muted-foreground">
                        Rezervasyonunuz onaylandı ve bakıcıya bildirildi.
                    </p>
                </div>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            İşlem Bilgileri
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span>İşlem No</span>
                            <span className="font-mono font-medium">{transactionId}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Tarih</span>
                            <span className="font-medium">
                                {new Date().toLocaleDateString("tr-TR", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 gap-3">
                    <Button
                        className="w-full bg-primary"
                        onClick={() => navigate("/bookings")}
                    >
                        <Calendar className="h-4 w-4 mr-2" />
                        Randevularıma Git
                    </Button>
                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => navigate(`/checkout/receipt?transactionId=${transactionId}`)}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Makbuz
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full"
                            onClick={() => navigate("/")}
                        >
                            Ana Sayfa
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
