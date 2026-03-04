
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface Report {
    id: string;
    reporter_id: string;
    reported_id: string;
    session_id?: string;
    reason: string;
    description: string;
    status: "pending" | "investigating" | "resolved" | "dismissed";
    created_at: string;
    admin_notes?: string;
    reporter?: {
        first_name: string;
        last_name: string;
        email: string;
    };
    reported?: {
        first_name: string;
        last_name: string;
    };
}

export default function ReportsQueue() {
    const queryClient = useQueryClient();
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [resolutionNote, setResolutionNote] = useState("");
    const [isResolutionDialogOpen, setIsResolutionDialogOpen] = useState(false);
    const [actionType, setActionType] = useState<"resolve" | "dismiss" | "investigate">("resolve");

    // Fetch reports
    const { data: reports, isLoading } = useQuery({
        queryKey: ["admin-reports"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("reports")
                .select(`
          *,
          reporter:reporter_id(first_name, last_name, email),
          reported:reported_id(first_name, last_name)
        `)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data as any[]; // Type assertion needed due to join complexity
        },
    });

    // Update report status mutation
    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
            const { error } = await supabase
                .from("reports")
                .update({
                    status,
                    admin_notes: notes,
                    updated_at: new Date().toISOString()
                })
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
            toast.success("Rapor durumu güncellendi");
            setIsResolutionDialogOpen(false);
            setSelectedReport(null);
            setResolutionNote("");
        },
        onError: (error) => {
            toast.error(`Hata: ${error.message}`);
        },
    });

    const handleAction = (report: Report, action: "resolve" | "dismiss" | "investigate") => {
        setSelectedReport(report);
        setActionType(action);
        setResolutionNote(report.admin_notes || "");
        setIsResolutionDialogOpen(true);
    };

    const confirmAction = () => {
        if (!selectedReport) return;

        const statusMap = {
            resolve: "resolved",
            dismiss: "dismissed",
            investigate: "investigating"
        };

        updateStatusMutation.mutate({
            id: selectedReport.id,
            status: statusMap[actionType],
            notes: resolutionNote
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "pending":
                return <Badge variant="destructive">Bekliyor</Badge>;
            case "investigating":
                return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600">İnceleniyor</Badge>;
            case "resolved":
                return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Çözüldü</Badge>;
            case "dismissed":
                return <Badge variant="outline">Reddedildi</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center">Yükleniyor...</div>;
    }

    const pendingReports = reports?.filter(r => r.status === 'pending' || r.status === 'investigating') || [];
    const historyReports = reports?.filter(r => r.status === 'resolved' || r.status === 'dismissed') || [];

    return (
        <div className="space-y-6 p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Rapor Yönetimi</h1>
                    <p className="text-muted-foreground">
                        Kullanıcı şikayetlerini ve güvenlik raporlarını inceleyin.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="pending" className="w-full">
                <TabsList>
                    <TabsTrigger value="pending">
                        Bekleyen ({pendingReports.length})
                    </TabsTrigger>
                    <TabsTrigger value="history">
                        Geçmiş ({historyReports.length})
                    </TabsTrigger>
                </TabsList>

                {/* Pending Reports Content */}
                <TabsContent value="pending" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Bekleyen Raporlar</CardTitle>
                            <CardDescription>
                                İşlem gerektiren yeni raporlar.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tarih</TableHead>
                                        <TableHead>Rapor Eden</TableHead>
                                        <TableHead>Şikayet Edilen</TableHead>
                                        <TableHead>Sebep</TableHead>
                                        <TableHead>Durum</TableHead>
                                        <TableHead className="text-right">İşlemler</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pendingReports.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                Bekleyen rapor bulunmuyor.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        pendingReports.map((report) => (
                                            <TableRow key={report.id}>
                                                <TableCell className="font-medium">
                                                    {new Date(report.created_at).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span>{report.reporter?.first_name} {report.reporter?.last_name}</span>
                                                        <span className="text-xs text-muted-foreground">{report.reporter?.email}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {report.reported?.first_name} {report.reported?.last_name}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1">
                                                        <Badge variant="outline" className="w-fit">{report.reason}</Badge>
                                                        <span className="text-sm truncate max-w-[200px]" title={report.description}>
                                                            {report.description}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{getStatusBadge(report.status)}</TableCell>
                                                <TableCell className="text-right space-x-2">
                                                    {report.status === 'pending' && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleAction(report as Report, 'investigate')}
                                                        >
                                                            İncele
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleAction(report as Report, 'resolve')}
                                                    >
                                                        Çözümle
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* History Content */}
                <TabsContent value="history" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Rapor Geçmişi</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tarih</TableHead>
                                        <TableHead>Rapor Eden</TableHead>
                                        <TableHead>Şikayet Edilen</TableHead>
                                        <TableHead>Sebep</TableHead>
                                        <TableHead>Sonuç</TableHead>
                                        <TableHead>Notlar</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {historyReports.map((report) => (
                                        <TableRow key={report.id}>
                                            <TableCell>
                                                {new Date(report.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                {report.reporter?.first_name} {report.reporter?.last_name}
                                            </TableCell>
                                            <TableCell>
                                                {report.reported?.first_name} {report.reported?.last_name}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{report.reason}</Badge>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(report.status)}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate" title={report.admin_notes}>
                                                {report.admin_notes || "-"}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Resolution Dialog */}
            <Dialog open={isResolutionDialogOpen} onOpenChange={setIsResolutionDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rapor İşlemi: {actionType === 'resolve' ? 'Çözümle' : actionType === 'investigate' ? 'İncelemeye Al' : 'Reddet'}</DialogTitle>
                        <DialogDescription>
                            {selectedReport && (
                                <div className="mt-2 p-3 bg-muted rounded-md text-sm">
                                    <span className="font-semibold">Şikayet:</span> {selectedReport.description}
                                </div>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <label htmlFor="notes" className="text-sm font-medium">Yönetici Notları</label>
                            <Textarea
                                id="notes"
                                value={resolutionNote}
                                onChange={(e) => setResolutionNote(e.target.value)}
                                placeholder="İşlem detaylarını buraya giriniz..."
                                rows={4}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsResolutionDialogOpen(false)}>İptal</Button>

                        {actionType !== 'dismiss' && (
                            <Button variant="destructive" onClick={() => { setActionType('dismiss'); confirmAction(); }}>
                                Reddet / Kapat
                            </Button>
                        )}

                        <Button onClick={confirmAction}>
                            {actionType === 'resolve' ? 'Onayla ve Çöz' : 'Kaydet'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
