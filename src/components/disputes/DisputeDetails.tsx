import React from "react";
import { Dispute } from "@/hooks/useDisputes";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { AlertCircle, Clock, CheckCircle2, FileText, User } from "lucide-react";

interface DisputeDetailsProps {
    dispute: Dispute;
}

export function DisputeDetails({ dispute }: DisputeDetailsProps) {
    const getStatusBadge = (status: string) => {
        switch (status) {
            case "open":
                return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Açık</Badge>;
            case "resolved":
                return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Çözüldü</Badge>;
            case "closed":
                return <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">Kapalı</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-xl font-bold">{dispute.reason}</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        ID: {dispute.id} • {format(new Date(dispute.created_at), "d MMMM yyyy HH:mm", { locale: tr })}
                    </p>
                </div>
                {getStatusBadge(dispute.status)}
            </div>

            <Separator />

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="bg-muted/30 border-none shadow-none">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <FileText className="h-4 w-4" /> Açıklama
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm whitespace-pre-wrap">{dispute.description || "Açıklama belirtilmemiş."}</p>
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">İlgili Rezervasyon</p>
                            <p className="text-sm font-medium">{dispute.booking_id || "Belirtilmemiş"}</p>
                        </div>
                    </div>

                    {dispute.resolved_at && (
                        <Card className="bg-green-50/50 border-green-100 shadow-none">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-green-800 flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4" /> Çözüm Notları
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-green-700">{dispute.resolution_notes || "Çözüm notu eklenmemiş."}</p>
                                <p className="text-xs text-green-600 mt-2">
                                    {format(new Date(dispute.resolved_at), "d MMMM yyyy", { locale: tr })} tarihinde çözüldü.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                    <p className="font-medium">Destek Süreci</p>
                    <p className="mt-1 opacity-90">
                        Anlaşmazlık talebiniz inceleme aşamasındadır. Takımımız her iki tarafla da iletişime geçebilir.
                        Gelişmeleri bu panelden takip edebilirsiniz.
                    </p>
                </div>
            </div>
        </div>
    );
}
