/**
 * Admin Verification Queue - Review and approve/reject sitter verifications
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
    CheckCircle,
    XCircle,
    Eye,
    Clock,
    Loader2,
    User,
    FileText
} from "lucide-react";

interface PendingVerification {
    id: string;
    sitterId: string;
    sitterName: string;
    sitterEmail: string;
    university: string;
    submittedAt: string;
    studentIdUrl?: string;
    governmentIdUrl?: string;
    selfieUrl?: string;
    backgroundCheckUrl?: string;
}

export default function VerificationQueue() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [pendingVerifications, setPendingVerifications] = useState<PendingVerification[]>([]);
    const [selectedVerification, setSelectedVerification] = useState<PendingVerification | null>(null);
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        fetchPendingVerifications();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchPendingVerifications = async () => {
        try {
            const { data, error } = await supabase
                .from("sitter_verifications")
                .select("*")
                .eq("verification_status", "pending")
                .order("created_at", { ascending: true });

            if (error) throw error;

            const verifications = data || [];

            // Fetch sitter details separately to avoid FK join issues
            const sitterIds = [...new Set(verifications.map((v: any) => v.sitter_id).filter(Boolean))];
            const { data: sittersData }: { data: { id: string; full_name: string; university: string }[] | null } = sitterIds.length
                ? await supabase
                    .from("sitters")
                    .select("id, full_name, university")
                    .in("id", sitterIds)
                : { data: [] };

            const sitterMap: Record<string, { full_name: string; university: string }> = {};
            (sittersData || []).forEach((s: any) => {
                sitterMap[s.id] = { full_name: s.full_name, university: s.university };
            });

            const formattedVerifications: PendingVerification[] = verifications.map((item: any) => ({
                id: item.id,
                sitterId: item.sitter_id,
                sitterName: sitterMap[item.sitter_id]?.full_name || "Bilinmiyor",
                sitterEmail: item.university_email || "-",
                university: sitterMap[item.sitter_id]?.university || "-",
                submittedAt: item.created_at,
                studentIdUrl: item.student_id_url,
                governmentIdUrl: item.government_id_url,
                selfieUrl: item.selfie_url,
                backgroundCheckUrl: item.background_check_url,
            }));

            setPendingVerifications(formattedVerifications);
        } catch (error) {
            console.error("Error fetching verifications:", error);
            toast({
                title: "Hata",
                description: "Doğrulamalar yüklenemedi",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async (verification: PendingVerification) => {
        setIsProcessing(true);

        try {
            // Update Verification Record
            const { error: matchError } = await supabase
                .from("sitter_verifications")
                .update({
                    verification_status: "verified",
                })
                .eq("id", verification.id);

            if (matchError) throw matchError;

            // Update Sitter Profile
            const { error: sitterError } = await supabase
                .from("sitters")
                .update({
                    verification_status: "verified",
                })
                .eq("id", verification.sitterId);

            if (sitterError) throw sitterError;

            toast({
                title: "Onaylandı!",
                description: `${verification.sitterName} başarıyla doğrulandı.`,
            });

            // Remove from pending list
            setPendingVerifications(pendingVerifications.filter(v => v.id !== verification.id));
            setSelectedVerification(null);
        } catch (error) {
            console.error("Error approving verification:", error);
            toast({
                title: "Hata",
                description: "Onaylama işlemi başarısız",
                variant: "destructive",
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!selectedVerification || !rejectionReason.trim()) {
            toast({
                title: "Uyarı",
                description: "Lütfen ret sebebini belirtin",
                variant: "destructive",
            });
            return;
        }

        setIsProcessing(true);

        try {
            // Update Sitter Verification Record
            const { error: verifyError } = await supabase
                .from("sitter_verifications")
                .update({
                    verification_status: "rejected",
                })
                .eq("id", selectedVerification.id);

            if (verifyError) throw verifyError;

            // Update Sitter Profile
            const { error: sitterError } = await supabase
                .from("sitters")
                .update({
                    verification_status: "rejected",
                })
                .eq("id", selectedVerification.sitterId);

            if (sitterError) throw sitterError;

            toast({
                title: "Reddedildi",
                description: `${selectedVerification.sitterName} doğrulaması reddedildi`,
            });

            setPendingVerifications(pendingVerifications.filter(v => v.id !== selectedVerification.id));
            setSelectedVerification(null);
            setIsRejectDialogOpen(false);
            setRejectionReason("");
        } catch (error) {
            console.error("Error rejecting verification:", error);
            toast({
                title: "Hata",
                description: "Reddetme işlemi başarısız",
                variant: "destructive",
            });
        } finally {
            setIsProcessing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-950 text-slate-100 flex justify-center items-center">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
        );
    }

        return (
        <div className="min-h-screen bg-slate-950 text-slate-100 pb-12">
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Doğrulama Kuyruğu</h1>
                    <p className="text-muted-foreground">
                        Bekleyen bakıcı doğrulamalarını inceleyin ve onaylayın
                    </p>
                </div>

                <Tabs defaultValue="pending">
                    <TabsList>
                        <TabsTrigger value="pending">
                            <Clock className="h-4 w-4 mr-2" />
                            Bekleyen ({pendingVerifications.length})
                        </TabsTrigger>
                        <TabsTrigger value="completed">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Tamamlanan
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="pending" className="space-y-4 mt-6">
                        {pendingVerifications.length === 0 ? (
                            <Card>
                                <CardContent className="p-12 text-center">
                                    <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <p className="text-lg font-semibold mb-2">Bekleyen Doğrulama Yok</p>
                                    <p className="text-sm text-muted-foreground">
                                        Tüm doğrulamalar tamamlandı.
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            pendingVerifications.map((verification) => (
                                <Card key={verification.id}>
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-4 flex-1">
                                                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                                    <User className="h-6 w-6 text-blue-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-lg">{verification.sitterName}</h3>
                                                    <p className="text-sm text-muted-foreground mb-2">
                                                        {verification.sitterEmail}
                                                    </p>
                                                    <div className="flex items-center gap-4 text-sm">
                                                        <span className="flex items-center gap-1">
                                                            <FileText className="h-4 w-4" />
                                                            {verification.university}
                                                        </span>
                                                        <span className="text-muted-foreground">
                                                            Gönderildi: {new Date(verification.submittedAt).toLocaleDateString("tr-TR")}
                                                        </span>
                                                    </div>

                                                    {/* Documents */}
                                                    <div className="flex gap-2 mt-4">
                                                        {verification.studentIdUrl && (
                                                            <Badge variant="secondary">Öğrenci Kimliği ✓</Badge>
                                                        )}
                                                        {verification.governmentIdUrl && (
                                                            <Badge variant="secondary">Kimlik Belgesi ✓</Badge>
                                                        )}
                                                        {verification.selfieUrl && (
                                                            <Badge variant="secondary">Selfie ✓</Badge>
                                                        )}
                                                        {verification.backgroundCheckUrl && (
                                                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                                                                Adli Sicil ✓
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-2 shrink-0">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setSelectedVerification(verification)}
                                                >
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    İncele
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </TabsContent>

                    <TabsContent value="completed">
                        <Card>
                            <CardContent className="p-6 text-center text-muted-foreground">
                                Tamamlanan doğrulamalar burada görünecek
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Review Dialog */}
                {selectedVerification && (
                    <Dialog open={!!selectedVerification} onOpenChange={() => setSelectedVerification(null)}>
                        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Doğrulama İncelemesi</DialogTitle>
                                <DialogDescription>
                                    {selectedVerification.sitterName} - {selectedVerification.university}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 my-4">
                                {/* Student ID */}
                                {selectedVerification.studentIdUrl && (
                                    <div>
                                        <h4 className="font-semibold mb-2">Öğrenci Kimlik Kartı</h4>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.open(selectedVerification.studentIdUrl, "_blank")}
                                        >
                                            <Eye className="h-4 w-4 mr-2" />
                                            Görüntüle
                                        </Button>
                                    </div>
                                )}

                                {/* Government ID */}
                                {selectedVerification.governmentIdUrl && (
                                    <div>
                                        <h4 className="font-semibold mb-2">Kimlik Belgesi</h4>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.open(selectedVerification.governmentIdUrl, "_blank")}
                                        >
                                            <Eye className="h-4 w-4 mr-2" />
                                            Görüntüle
                                        </Button>
                                    </div>
                                )}

                                {/* Selfie */}
                                {selectedVerification.selfieUrl && (
                                    <div>
                                        <h4 className="font-semibold mb-2">Kimlikli Selfie</h4>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.open(selectedVerification.selfieUrl, "_blank")}
                                        >
                                            <Eye className="h-4 w-4 mr-2" />
                                            Görüntüle
                                        </Button>
                                    </div>
                                )}

                                {/* Background Check */}
                                {selectedVerification.backgroundCheckUrl && (
                                    <div>
                                        <h4 className="font-semibold mb-2">Adli Sicil Kaydı</h4>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.open(selectedVerification.backgroundCheckUrl, "_blank")}
                                        >
                                            <Eye className="h-4 w-4 mr-2" />
                                            Görüntüle (PDF)
                                        </Button>

                                    </div>
                                )}
                            </div>

                            <DialogFooter className="gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSelectedVerification(null);
                                        setIsRejectDialogOpen(false);
                                    }}
                                    disabled={isProcessing}
                                >
                                    İptal
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => setIsRejectDialogOpen(true)}
                                    disabled={isProcessing}
                                >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reddet
                                </Button>
                                <Button
                                    onClick={() => handleApprove(selectedVerification)}
                                    disabled={isProcessing}
                                >
                                    {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Onayla
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}

                {/* Reject Dialog */}
                <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Doğrulamayı Reddet</DialogTitle>
                            <DialogDescription>
                                Lütfen reddetme sebebini açıklayın. Bu sebep bakıcıya gönderilecektir.
                            </DialogDescription>
                        </DialogHeader>

                        <Textarea
                            placeholder="Örn: Öğrenci kimlik kartı bulanık ve okunamıyor..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            rows={4}
                        />

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
                                İptal
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleReject}
                                disabled={!rejectionReason.trim() || isProcessing}
                            >
                                {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Reddet
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
