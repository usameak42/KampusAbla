import React, { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useEarnings } from "@/hooks/useEarnings";
import { EarningsSummary } from "@/components/sitter/EarningsSummary";
import { TransactionList } from "@/components/sitter/TransactionList";
import { PayoutRequestModal } from "@/components/sitter/PayoutRequestModal";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
import { PlusCircle, Download, History, List, ArrowLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { formatPrice } from "@/types/subscription";
import { useNavigate } from "react-router-dom";

export default function EarningsPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const {
        transactions,
        payouts,
        balances,
        isLoading,
        requestPayout
    } = useEarnings(user?.id || "");

    const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);

    return (
        <AppLayout>
            <div className="flex flex-col gap-8 pb-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Kazançlarım</h1>
                            <p className="text-muted-foreground mt-1">
                                Kazançlarınızı takip edin ve ödeme taleplerinizi yönetin.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" />
                            Rapor İndir
                        </Button>
                        <Button
                            size="sm"
                            disabled={balances.availableBalance < 20}
                            onClick={() => setIsPayoutModalOpen(true)}
                        >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Ödeme Talep Et
                        </Button>
                    </div>
                </div>

                {/* Summary Cards */}
                <EarningsSummary balances={balances} />

                {/* Main Content Tabs */}
                <Tabs defaultValue="transactions" className="w-full">
                    <TabsList className="grid w-full max-w-[400px] grid-cols-2 mb-6">
                        <TabsTrigger value="transactions">
                            <List className="mr-2 h-4 w-4" />
                            İşlemler
                        </TabsTrigger>
                        <TabsTrigger value="payouts">
                            <History className="mr-2 h-4 w-4" />
                            Ödemeler
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="transactions" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Son Kazançlar</CardTitle>
                                <CardDescription>
                                    Tamamlanan seanslardan elde ettiğiniz kazanç listesi.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="flex justify-center py-8 text-sm text-muted-foreground">Yükleniyor...</div>
                                ) : (
                                    <TransactionList transactions={transactions} />
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="payouts" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle>Ödeme Geçmişi</CardTitle>
                                        <CardDescription>
                                            Geçmiş ödeme talepleriniz ve durumları.
                                        </CardDescription>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-primary hover:text-primary/80"
                                        onClick={() => navigate("/earnings/history")}
                                    >
                                        Tümünü Gör
                                        <ChevronRight className="ml-1 h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="flex justify-center py-8 text-sm text-muted-foreground">Yükleniyor...</div>
                                ) : payouts.length === 0 ? (
                                    <div className="text-center py-10 text-muted-foreground border rounded-lg bg-card text-sm">
                                        Henüz ödeme talebiniz bulunmuyor.
                                    </div>
                                ) : (
                                    <div className="rounded-md border overflow-hidden">
                                        <div className="grid grid-cols-4 bg-muted/50 p-3 text-xs font-medium text-muted-foreground">
                                            <div>Tarih</div>
                                            <div>Tutar</div>
                                            <div>Durum</div>
                                            <div className="text-right">İşlem Tarihi</div>
                                        </div>
                                        <div className="divide-y text-sm">
                                            {payouts.map((payout) => (
                                                <div key={payout.id} className="grid grid-cols-4 p-4 items-center">
                                                    <div className="font-medium text-xs">
                                                        {format(new Date(payout.createdAt), "d MMM yyyy", { locale: tr })}
                                                    </div>
                                                    <div className="font-semibold">
                                                        {formatPrice(payout.amount)}
                                                    </div>
                                                    <div>
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${payout.status === 'processed' ? 'bg-green-100 text-green-700' :
                                                            payout.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                                'bg-red-100 text-red-700'
                                                            }`}>
                                                            {payout.status === 'processed' ? 'Tamamlandı' :
                                                                payout.status === 'pending' ? 'Bekliyor' : 'Hata'}
                                                        </span>
                                                    </div>
                                                    <div className="text-right text-xs text-muted-foreground">
                                                        {payout.processedAt ?
                                                            format(new Date(payout.processedAt), "d MMM yyyy", { locale: tr }) :
                                                            "-"}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            <PayoutRequestModal
                open={isPayoutModalOpen}
                onOpenChange={setIsPayoutModalOpen}
                availableBalance={balances.availableBalance}
                isPriorityEligible={balances.isPriorityEligible}
                onRequest={async (amount) => {
                    await requestPayout(amount);
                }}
            />
        </AppLayout>
    );
}
