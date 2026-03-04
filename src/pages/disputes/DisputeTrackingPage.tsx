/**
 * DisputeTrackingPage - Track dispute submissions and their status
 */

import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { FileText, Clock, CheckCircle2, AlertTriangle, ShieldAlert } from "lucide-react";

const DISPUTE_STATUSES = [
    { id: "all", label: "Tümü" },
    { id: "open", label: "Açık" },
    { id: "in_review", label: "İncelemede" },
    { id: "resolved", label: "Çözüldü" },
] as const;

type DisputeStatus = (typeof DISPUTE_STATUSES)[number]["id"];

interface DisputeItem {
    id: string;
    title: string;
    type: string;
    status: string;
    submittedAt: string;
    updatedAt: string;
    summary: string;
}

const MOCK_DISPUTES: DisputeItem[] = [
    {
        id: "DSP-2024-001",
        title: "Rezervasyon iptali ücret anlaşmazlığı",
        type: "Ödeme",
        status: "open",
        submittedAt: "12 Ağustos 2024",
        updatedAt: "13 Ağustos 2024",
        summary: "Veli, iptal ücretinin yanlış hesaplandığını belirtiyor.",
    },
    {
        id: "DSP-2024-014",
        title: "Hizmet kalitesi geri bildirimi",
        type: "Hizmet",
        status: "in_review",
        submittedAt: "05 Ağustos 2024",
        updatedAt: "07 Ağustos 2024",
        summary: "Seans sırasında iletişim sorunları yaşandığı bildirildi.",
    },
    {
        id: "DSP-2024-020",
        title: "Rezervasyon anlaşmazlığı çözümü",
        type: "Rezervasyon",
        status: "resolved",
        submittedAt: "25 Temmuz 2024",
        updatedAt: "29 Temmuz 2024",
        summary: "Taraflarla uzlaşma sağlandı ve ödeme güncellendi.",
    },
];

const statusStyles: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    open: {
        label: "Açık",
        icon: <AlertTriangle className="h-4 w-4" />,
        color: "bg-amber-100 text-amber-800",
    },
    in_review: {
        label: "İncelemede",
        icon: <Clock className="h-4 w-4" />,
        color: "bg-blue-100 text-blue-800",
    },
    resolved: {
        label: "Çözüldü",
        icon: <CheckCircle2 className="h-4 w-4" />,
        color: "bg-green-100 text-green-800",
    },
};

export default function DisputeTrackingPage() {
    const [activeStatus, setActiveStatus] = useState<DisputeStatus>("all");
    const [disputes, setDisputes] = useState<DisputeItem[]>(MOCK_DISPUTES);
    const [selectedDispute, setSelectedDispute] = useState<DisputeItem | null>(null);
    const [resolutionNote, setResolutionNote] = useState("");
    const [isResolving, setIsResolving] = useState(false);

    const filteredDisputes = useMemo(() => {
        if (activeStatus === "all") {
            return disputes;
        }
        return disputes.filter((dispute) => dispute.status === activeStatus);
    }, [activeStatus, disputes]);

    const handleOpenResolution = (dispute: DisputeItem) => {
        setSelectedDispute(dispute);
        setResolutionNote("");
    };

    const handleCloseResolution = () => {
        setSelectedDispute(null);
        setResolutionNote("");
    };

    const handleResolveDispute = async () => {
        if (!selectedDispute) return;
        if (resolutionNote.trim().length < 10) return;

        setIsResolving(true);
        await new Promise((resolve) => setTimeout(resolve, 700));

        setDisputes((prev) =>
            prev.map((dispute) =>
                dispute.id === selectedDispute.id
                    ? {
                        ...dispute,
                        status: "resolved",
                        updatedAt: new Date().toLocaleDateString("tr-TR"),
                        summary: resolutionNote.trim(),
                    }
                    : dispute
            )
        );
        setIsResolving(false);
        handleCloseResolution();
    };

    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5 text-purple-600" />
                            Anlaşmazlık Takibi
                        </CardTitle>
                        <CardDescription>
                            Gönderdiğiniz anlaşmazlıkları ve güncel durumlarını takip edin.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <Tabs value={activeStatus} onValueChange={(value) => setActiveStatus(value as DisputeStatus)}>
                            <TabsList className="grid w-full grid-cols-4">
                                {DISPUTE_STATUSES.map((status) => (
                                    <TabsTrigger key={status.id} value={status.id}>
                                        {status.label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </Tabs>

                        <div className="space-y-4">
                            {filteredDisputes.length === 0 ? (
                                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                                    Seçtiğiniz filtreye uygun anlaşmazlık bulunamadı.
                                </div>
                            ) : (
                                filteredDisputes.map((dispute) => {
                                    const status = statusStyles[dispute.status];
                                    return (
                                        <div key={dispute.id} className="rounded-lg border p-4 space-y-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">
                                                        Başvuru ID: {dispute.id}
                                                    </p>
                                                    <h4 className="text-base font-semibold">{dispute.title}</h4>
                                                    <p className="text-sm text-muted-foreground">{dispute.summary}</p>
                                                </div>
                                                <Badge className={`flex items-center gap-1 ${status.color}`}>
                                                    {status.icon}
                                                    {status.label}
                                                </Badge>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <FileText className="h-3.5 w-3.5" />
                                                    Tür: {dispute.type}
                                                </span>
                                                <span>Gönderim: {dispute.submittedAt}</span>
                                                <span>Güncelleme: {dispute.updatedAt}</span>
                                            </div>
                                            <div className="flex justify-end">
                                                {dispute.status !== "resolved" ? (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleOpenResolution(dispute)}
                                                    >
                                                        Çözüm Öner
                                                    </Button>
                                                ) : (
                                                    <Button variant="outline" size="sm" disabled>
                                                        Detayları Gör
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={!!selectedDispute} onOpenChange={handleCloseResolution}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Çözüm Önerisi Oluştur</DialogTitle>
                        <DialogDescription>
                            {selectedDispute
                                ? `${selectedDispute.id} için çözüm notu ekleyin.`
                                : "Çözüm notu ekleyin."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <Label htmlFor="resolution-note">Çözüm Notu</Label>
                        <Textarea
                            id="resolution-note"
                            value={resolutionNote}
                            onChange={(event) => setResolutionNote(event.target.value)}
                            placeholder="Örn: İade tutarı güncellendi ve taraflara bildirildi."
                            rows={4}
                        />
                        <p className="text-xs text-muted-foreground">
                            {resolutionNote.length}/300 karakter
                        </p>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={handleCloseResolution} disabled={isResolving}>
                            İptal
                        </Button>
                        <Button
                            onClick={handleResolveDispute}
                            disabled={isResolving || resolutionNote.trim().length < 10}
                        >
                            {isResolving ? "Kaydediliyor..." : "Çözümü Kaydet"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
