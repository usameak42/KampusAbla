/**
 * PaymentReceiptPage - Digital receipt for payments
 */

import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Printer, Download, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function PaymentReceiptPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const transactionId = searchParams.get("transactionId") || "MOCK-TX-123";

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-12 print:bg-white print:pb-0">
            <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
                <div className="flex items-center justify-between print:hidden">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <h1 className="text-xl font-semibold">Ödeme Makbuzu</h1>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={handlePrint}>
                            <Printer className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon">
                            <Download className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <Card className="shadow-lg print:shadow-none print:border-none">
                    <CardHeader className="text-center border-b space-y-1">
                        <div className="text-2xl font-bold text-primary">KampusAbla</div>
                        <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">
                            Elektronik Hizmet Makbuzu
                        </p>
                    </CardHeader>
                    <CardContent className="py-8 space-y-6">
                        {/* Status Header */}
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase font-bold">İşlem Durumu</p>
                                <p className="text-green-600 font-bold">BAŞARILI / TAHSİL EDİLDİ</p>
                            </div>
                            <div className="text-right space-y-1">
                                <p className="text-xs text-muted-foreground uppercase font-bold">İşlem Tarihi</p>
                                <p className="font-medium">{new Date().toLocaleDateString("tr-TR")}</p>
                            </div>
                        </div>

                        <Separator />

                        {/* Transaction ID */}
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground uppercase font-bold">İşlem Numarası</p>
                            <p className="font-mono text-sm">{transactionId}</p>
                        </div>

                        {/* Details Table */}
                        <div className="space-y-4">
                            <p className="text-xs text-muted-foreground uppercase font-bold">Hizmet Detayları</p>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Sitter Hizmeti (3 Saat)</span>
                                    <span>₺1.950,00</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Platform Hizmet Bedeli</span>
                                    <span>₺195,00</span>
                                </div>
                                <Separator className="my-2" />
                                <div className="flex justify-between font-bold text-lg">
                                    <span>TOPLAM</span>
                                    <span>₺2.145,00</span>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Footer Info */}
                        <div className="space-y-4 pt-4">
                            <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                    <p className="text-muted-foreground font-bold uppercase mb-1">Müşteri</p>
                                    <p className="font-medium">Ayşe Demir</p>
                                    <p className="text-muted-foreground">ayse.demir@example.com</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground font-bold uppercase mb-1">Bakıcı</p>
                                    <p className="font-medium">Elif Kaya</p>
                                    <p className="text-muted-foreground">Beşiktaş, İstanbul</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 text-center text-[10px] text-muted-foreground space-y-1">
                            <p>Bu bir bilgi fişidir, resmi fatura yerine geçmez.</p>
                            <p>KampusAbla Teknoloji A.Ş. tarafından dijital olarak üretilmiştir.</p>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex flex-col gap-3 print:hidden">
                    <Button variant="outline" className="w-full">
                        <Mail className="h-4 w-4 mr-2" />
                        E-posta ile Gönder
                    </Button>
                    <Button variant="ghost" className="w-full" onClick={() => navigate("/")}>
                        Ana Sayfaya Dön
                    </Button>
                </div>
            </div>
        </div>
    );
}
