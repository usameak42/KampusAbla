/**
 * Sitter Verification Page - Upload documents and track verification status
 */

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DocumentUpload } from "@/components/verification/DocumentUpload";
import { VerificationStatus } from "@/components/verification/VerificationStatus";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Send, AlertCircle, Loader2 } from "lucide-react";

interface VerificationData {
    status: "not_started" | "pending" | "in_review" | "verified" | "rejected";
    studentIdUrl?: string;
    transcriptUrl?: string;
    studentCertificateUrl?: string;
    governmentIdUrl?: string;
    selfieUrl?: string;
    backgroundCheckUrl?: string;
    rejectionReason?: string;
}

export default function SitterVerification() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [verificationData, setVerificationData] = useState<VerificationData>({
        status: "not_started",
    });

    useEffect(() => {
        fetchVerificationData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchVerificationData = async () => {
        try {
            const userId = user?.id;
            if (!userId) return;

            // Get sitter ID
            const { data: sitterData } = await supabase
                .from("sitters")
                .select("id, verification_status")
                .eq("user_id", userId)
                .single();

            if (!sitterData) return;

            // Get verification details
            const { data: rawVerificationData } = await supabase
                .from("sitter_verifications")
                .select("*")
                .eq("sitter_id", sitterData.id)
                .single();

            const vData = rawVerificationData as any;

            if (vData) {
                setVerificationData({
                    status: (vData.verification_status as "not_started" | "pending" | "in_review" | "verified" | "rejected") || "not_started",
                    studentIdUrl: vData.student_id_url,
                    transcriptUrl: vData.transcript_url,
                    studentCertificateUrl: vData.student_certificate_url,
                    governmentIdUrl: vData.government_id_url,
                    selfieUrl: vData.selfie_url,
                    backgroundCheckUrl: vData.background_check_url,
                    rejectionReason: vData.rejection_reason,
                });
            }
        } catch (error) {
            console.error("Error fetching verification data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const calculateProgress = (): number => {
        let progress = 0;
        if (verificationData.studentIdUrl) progress += 15;
        if (verificationData.transcriptUrl) progress += 15;
        if (verificationData.studentCertificateUrl) progress += 15;
        if (verificationData.governmentIdUrl) progress += 15;
        if (verificationData.selfieUrl) progress += 20;
        if (verificationData.backgroundCheckUrl) progress += 20;
        return progress;
    };

    const canSubmitForReview = (): boolean => {
        return !!(
            verificationData.studentIdUrl &&
            verificationData.transcriptUrl &&
            verificationData.studentCertificateUrl &&
            verificationData.governmentIdUrl &&
            verificationData.selfieUrl &&
            verificationData.backgroundCheckUrl &&
            verificationData.status !== "in_review" &&
            verificationData.status !== "verified"
        );
    };

    const handleSubmitForReview = async () => {
        setIsSubmitting(true);

        try {
            const userId = user?.id;
            if (!userId) throw new Error("Not authenticated");

            const { data: sitterData } = await supabase
                .from("sitters")
                .select("id")
                .eq("user_id", userId)
                .single();

            if (!sitterData) throw new Error("Sitter not found");

            // Update verification status
            await supabase
                .from("sitter_verifications")
                .update({
                    verification_status: "in_review",
                    submitted_at: new Date().toISOString(),
                })
                .eq("sitter_id", sitterData.id);

            // Update sitter status
            await supabase
                .from("sitters")
                .update({
                    verification_status: "in_review",
                })
                .eq("id", sitterData.id);

            setVerificationData({
                ...verificationData,
                status: "in_review",
            });

            toast({
                title: "Gönderildi!",
                description: "Belgeleriniz inceleme için gönderildi. Sonuç e-posta ile bildirilecektir.",
            });
        } catch (error) {
            toast({
                title: "Hata",
                description: "Bir sorun oluştu. Lütfen tekrar deneyin.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <AppLayout>
                <div className="flex justify-center items-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </AppLayout>
        );
    }

    const progress = calculateProgress();

    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Doğrulama Merkezi</h1>
                    <p className="text-muted-foreground">
                        Platformda aktif olarak çalışabilmek için kimlik doğrulamasını tamamlayın
                    </p>
                </div>

                {/* Status Card */}
                <div className="mb-8">
                    <VerificationStatus
                        status={verificationData.status}
                        progress={progress}
                        rejectionReason={verificationData.rejectionReason}
                    />
                </div>

                {/* Info Alert */}
                <Alert className="mb-8">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        <strong>Önemli:</strong> Tüm belgeler net, güncel ve okunabilir olmalıdır.
                        Eksik veya bulanık belgeler reddedilecektir.
                    </AlertDescription>
                </Alert>

                {/* Document Uploads */}
                <div className="space-y-6 mb-8">
                    <DocumentUpload
                        documentType="student-id"
                        title="Öğrenci Kimlik Kartı"
                        description="Üniversite öğrenci kimlik kartınızın fotoğrafı"
                        acceptedFormats="JPG, PNG, WebP"
                        maxSize={5}
                        currentFileUrl={verificationData.studentIdUrl}
                        onUploadComplete={(url) => {
                            setVerificationData({ ...verificationData, studentIdUrl: url });
                            fetchVerificationData();
                        }}
                        disabled={verificationData.status === "in_review" || verificationData.status === "verified"}
                    />

                    <DocumentUpload
                        documentType="transcript"
                        title="Transkript"
                        description="Güncel not dökümü belgesi (e-Devlet veya Öğrenci İşleri)"
                        acceptedFormats="PDF"
                        maxSize={10}
                        currentFileUrl={verificationData.transcriptUrl}
                        onUploadComplete={(url) => {
                            setVerificationData({ ...verificationData, transcriptUrl: url });
                            fetchVerificationData();
                        }}
                        disabled={verificationData.status === "in_review" || verificationData.status === "verified"}
                    />

                    <DocumentUpload
                        documentType="student-certificate"
                        title="Öğrenci Belgesi"
                        description="Aktif öğrencilik durumunu gösteren belge (e-Devlet)"
                        acceptedFormats="PDF"
                        maxSize={5}
                        currentFileUrl={verificationData.studentCertificateUrl}
                        onUploadComplete={(url) => {
                            setVerificationData({ ...verificationData, studentCertificateUrl: url });
                            fetchVerificationData();
                        }}
                        disabled={verificationData.status === "in_review" || verificationData.status === "verified"}
                    />

                    <DocumentUpload
                        documentType="government-id"
                        title="Kimlik Belgesi"
                        description="TC Kimlik Kartı veya Pasaport (ön yüz)"
                        acceptedFormats="JPG, PNG, WebP"
                        maxSize={5}
                        currentFileUrl={verificationData.governmentIdUrl}
                        onUploadComplete={(url) => {
                            setVerificationData({ ...verificationData, governmentIdUrl: url });
                            fetchVerificationData();
                        }}
                        disabled={verificationData.status === "in_review" || verificationData.status === "verified"}
                    />

                    <DocumentUpload
                        documentType="selfie"
                        title="Kimlikli Selfie"
                        description="Kimlik belgenizi yüzünüzün yanında tutarak çekilmiş fotoğraf"
                        acceptedFormats="JPG, PNG, WebP"
                        maxSize={5}
                        currentFileUrl={verificationData.selfieUrl}
                        onUploadComplete={(url) => {
                            setVerificationData({ ...verificationData, selfieUrl: url });
                            fetchVerificationData();
                        }}
                        disabled={verificationData.status === "in_review" || verificationData.status === "verified"}
                    />

                    <DocumentUpload
                        documentType="background-check"
                        title="Adli Sicil Kaydı"
                        description="e-Devlet'ten alınan adli sicil belgesi"
                        acceptedFormats="PDF"
                        maxSize={10}
                        currentFileUrl={verificationData.backgroundCheckUrl}
                        onUploadComplete={(url) => {
                            setVerificationData({ ...verificationData, backgroundCheckUrl: url });
                            fetchVerificationData();
                        }}
                        disabled={verificationData.status === "in_review" || verificationData.status === "verified"}
                    />
                </div>

                {/* Submit Button */}
                {canSubmitForReview() && (
                    <div className="flex justify-end">
                        <Button
                            size="lg"
                            onClick={handleSubmitForReview}
                            disabled={isSubmitting}
                        >
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Send className="mr-2 h-4 w-4" />
                            İnceleme İçin Gönder
                        </Button>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
