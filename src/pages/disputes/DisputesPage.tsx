import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, AlertTriangle, ChevronRight, MessageSquare } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { CreateDisputeForm } from "@/components/disputes/CreateDisputeForm";
import { useDisputes, Dispute } from "@/hooks/useDisputes";
import { useAuth } from "@/contexts/AuthContext";
import { DisputeDetails } from "@/components/disputes/DisputeDetails";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

export default function DisputesPage() {
    const { user, loading: authLoading } = useAuth();
    const { disputes, isLoading: disputesLoading } = useDisputes(user?.id || "");
    const isLoading = authLoading || disputesLoading;
    const [showNewDispute, setShowNewDispute] = useState(false);
    const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);

    const activeDisputes = disputes?.filter(d => d.status === "open") || [];
    const resolvedDisputes = disputes?.filter(d => d.status !== "open") || [];

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
        <div className="container mx-auto py-8 px-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Anlaşmazlık Çözüm Merkezi</h1>
                    <p className="text-muted-foreground mt-1">
                        Rezervasyonlarınızla ilgili sorunları bildirin ve çözüm sürecini takip edin.
                    </p>
                </div>
                <Button onClick={() => setShowNewDispute(true)} className="w-full md:w-auto">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Yeni Kayıt Oluştur
                </Button>
            </div>

            <Dialog open={showNewDispute} onOpenChange={setShowNewDispute}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Yeni Anlaşmazlık Bildirimi</DialogTitle>
                    </DialogHeader>
                    <CreateDisputeForm
                        onSuccess={() => setShowNewDispute(false)}
                        onCancel={() => setShowNewDispute(false)}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={!!selectedDispute} onOpenChange={(open) => !open && setSelectedDispute(null)}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Anlaşmazlık Detayları</DialogTitle>
                    </DialogHeader>
                    {selectedDispute && <DisputeDetails dispute={selectedDispute} />}
                </DialogContent>
            </Dialog>

            <Tabs defaultValue="active" className="w-full">
                <TabsList className="mb-6 bg-muted/50 p-1">
                    <TabsTrigger value="active" className="px-6">
                        Aktif ({activeDisputes.length})
                    </TabsTrigger>
                    <TabsTrigger value="resolved" className="px-6">
                        Geçmiş ({resolvedDisputes.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="space-y-4">
                    {isLoading ? (
                        <div className="flex justify-center py-12">Yükleniyor...</div>
                    ) : activeDisputes.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <AlertTriangle className="h-12 w-12 mb-4 opacity-20" />
                                <p>Henüz aktif bir anlaşmazlık kaydınız bulunmuyor.</p>
                                <Button variant="link" onClick={() => setShowNewDispute(true)}>Yeni bir tane oluşturun</Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {activeDisputes.map(dispute => (
                                <Card key={dispute.id} className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setSelectedDispute(dispute)}>
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-mono text-muted-foreground">ID: {dispute.id.slice(0, 8)}</span>
                                                    {getStatusBadge(dispute.status)}
                                                </div>
                                                <h3 className="font-semibold text-lg">{dispute.reason}</h3>
                                                <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                                                    {dispute.description}
                                                </p>
                                                <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <PlusCircle className="h-3 w-3" />
                                                        {format(new Date(dispute.created_at), "d MMM yyyy", { locale: tr })}
                                                    </span>
                                                    {dispute.booking_id && (
                                                        <span className="flex items-center gap-1">
                                                            <MessageSquare className="h-3 w-3" />
                                                            Rezervasyon: {dispute.booking_id.slice(0, 8)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="resolved" className="space-y-4">
                    {isLoading ? (
                        <div className="flex justify-center py-12">Yükleniyor...</div>
                    ) : resolvedDisputes.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <AlertTriangle className="h-12 w-12 mb-4 opacity-10" />
                                <p>Geçmiş kayıt bulunamadı.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {resolvedDisputes.map(dispute => (
                                <Card key={dispute.id} className="opacity-80 hover:opacity-100 transition-opacity cursor-pointer" onClick={() => setSelectedDispute(dispute)}>
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-mono text-muted-foreground">ID: {dispute.id.slice(0, 8)}</span>
                                                    {getStatusBadge(dispute.status)}
                                                </div>
                                                <h3 className="font-semibold text-lg">{dispute.reason}</h3>
                                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                                    <span>Oluşturulma: {format(new Date(dispute.created_at), "d MMM yyyy", { locale: tr })}</span>
                                                    {dispute.resolved_at && <span>Çözülme: {format(new Date(dispute.resolved_at), "d MMM yyyy", { locale: tr })}</span>}
                                                </div>
                                            </div>
                                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
