/**
 * DisputeHistoryPage - Archive view for resolved disputes
 */

import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, CheckCircle2, Search, CalendarRange } from "lucide-react";

const HISTORY_FILTERS = [
    { id: "all", label: "Tümü" },
    { id: "booking", label: "Rezervasyon" },
    { id: "payment", label: "Ödeme" },
    { id: "service", label: "Hizmet" },
    { id: "behavior", label: "Davranış" },
] as const;

type HistoryFilter = (typeof HISTORY_FILTERS)[number]["id"];

const RESOLVED_DISPUTES = [
    {
        id: "DSP-2024-020",
        title: "Rezervasyon anlaşmazlığı çözümü",
        category: "booking",
        closedAt: "29 Temmuz 2024",
        outcome: "Taraflarla uzlaşma sağlandı, ödeme güncellendi.",
    },
    {
        id: "DSP-2024-017",
        title: "Hizmet kalitesi geri bildirim sonucu",
        category: "service",
        closedAt: "21 Temmuz 2024",
        outcome: "İyileştirme planı oluşturuldu ve kullanıcı bilgilendirildi.",
    },
    {
        id: "DSP-2024-009",
        title: "Ödeme anlaşmazlığı iade kararı",
        category: "payment",
        closedAt: "04 Temmuz 2024",
        outcome: "Kısmi iade yapıldı ve taraflara bildirim gönderildi.",
    },
] as const;

const categoryLabels: Record<string, string> = {
    booking: "Rezervasyon",
    payment: "Ödeme",
    service: "Hizmet",
    behavior: "Davranış",
};

export default function DisputeHistoryPage() {
    const [activeFilter, setActiveFilter] = useState<HistoryFilter>("all");
    const [search, setSearch] = useState("");

    const filteredDisputes = useMemo(() => {
        return RESOLVED_DISPUTES.filter((dispute) => {
            const matchesFilter = activeFilter === "all" || dispute.category === activeFilter;
            const matchesSearch = dispute.title.toLowerCase().includes(search.toLowerCase());
            return matchesFilter && matchesSearch;
        });
    }, [activeFilter, search]);

    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CalendarRange className="h-5 w-5 text-purple-600" />
                            Anlaşmazlık Geçmişi
                        </CardTitle>
                        <CardDescription>
                            Çözülmüş anlaşmazlıklarınızı görüntüleyin ve geçmiş kararları takip edin.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <Tabs value={activeFilter} onValueChange={(value) => setActiveFilter(value as HistoryFilter)}>
                                <TabsList className="grid w-full grid-cols-5">
                                    {HISTORY_FILTERS.map((filter) => (
                                        <TabsTrigger key={filter.id} value={filter.id}>
                                            {filter.label}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </Tabs>
                            <div className="relative md:w-64">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Başlık ara..."
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            {filteredDisputes.length === 0 ? (
                                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                                    Arama kriterinize uygun bir anlaşmazlık geçmişi bulunamadı.
                                </div>
                            ) : (
                                filteredDisputes.map((dispute) => (
                                    <div key={dispute.id} className="rounded-lg border p-4 space-y-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-sm text-muted-foreground">
                                                    Başvuru ID: {dispute.id}
                                                </p>
                                                <h4 className="text-base font-semibold">{dispute.title}</h4>
                                                <p className="text-sm text-muted-foreground">{dispute.outcome}</p>
                                            </div>
                                            <Badge className="flex items-center gap-1 bg-green-100 text-green-800">
                                                <CheckCircle2 className="h-4 w-4" />
                                                Çözüldü
                                            </Badge>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <FileText className="h-3.5 w-3.5" />
                                                Tür: {categoryLabels[dispute.category]}
                                            </span>
                                            <span>Kapanış: {dispute.closedAt}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
