/**
 * Document Upload Component - Drag-and-drop file upload with inline preview for verification documents
 * Features: PDF-only enforcement (5MB max), local preview before submit, 90-day document age validation
 */

import { useState, useRef, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
    Upload,
    File,
    X,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Eye,
    FileText,
    ZoomIn,
    ZoomOut,
    RotateCw,
    Calendar,
    Send,
} from "lucide-react";
import { cn } from "@/lib/utils";

type DocumentType = "student-id" | "government-id" | "selfie" | "background-check" | "transcript" | "student-certificate";

interface DocumentUploadProps {
    documentType: DocumentType;
    title: string;
    description: string;
    acceptedFormats: string;
    maxSize: number; // in MB
    currentFileUrl?: string;
    onUploadComplete: (url: string) => void;
    disabled?: boolean;
}

const MAX_DOCUMENT_AGE_DAYS = 90;

function isDocumentTooOld(dateString: string): boolean {
    const docDate = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - docDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays > MAX_DOCUMENT_AGE_DAYS;
}

export function DocumentUpload({
    documentType,
    title,
    description,
    acceptedFormats,
    maxSize,
    currentFileUrl,
    onUploadComplete,
    disabled = false,
}: DocumentUploadProps) {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [imageZoom, setImageZoom] = useState(1);
    const [imageRotation, setImageRotation] = useState(0);

    // Staged file state (preview before upload)
    const [stagedFile, setStagedFile] = useState<File | null>(null);
    const [stagedPreviewUrl, setStagedPreviewUrl] = useState<string | null>(null);
    const [documentDate, setDocumentDate] = useState<string>("");
    const [dateError, setDateError] = useState<string | null>(null);

    const isImage = documentType !== "background-check" && documentType !== "transcript" && documentType !== "student-certificate";
    const isPdf = documentType === "background-check" || documentType === "transcript" || documentType === "student-certificate";

    // Whether this document type requires a date check (official documents)
    const requiresDateValidation = isPdf;

    const validateFile = (file: File): boolean => {
        const maxBytes = maxSize * 1024 * 1024;
        if (file.size > maxBytes) {
            setError(`Dosya boyutu ${maxSize}MB'dan küçük olmalıdır`);
            return false;
        }

        if (isPdf) {
            if (file.type !== "application/pdf") {
                setError("Sadece PDF dosyaları kabul edilmektedir. Lütfen PDF formatında yükleyin.");
                return false;
            }
        } else if (isImage) {
            if (!file.type.startsWith("image/")) {
                setError("Lütfen geçerli bir resim dosyası yükleyin (JPG, PNG, WebP)");
                return false;
            }
        }

        setError(null);
        return true;
    };

    const stageFile = (file: File) => {
        if (!validateFile(file)) return;

        // For PDF files, create a local preview URL and stage for confirmation
        if (isPdf) {
            const objectUrl = URL.createObjectURL(file);
            setStagedFile(file);
            setStagedPreviewUrl(objectUrl);
            setDocumentDate("");
            setDateError(null);
            setError(null);
        } else {
            // For images, upload immediately (existing behavior)
            uploadFile(file);
        }
    };

    const handleDateChange = (value: string) => {
        setDocumentDate(value);
        if (value && isDocumentTooOld(value)) {
            setDateError(`Bu belge 90 günden eski. Lütfen son ${MAX_DOCUMENT_AGE_DAYS} gün içinde alınmış güncel bir belge yükleyin.`);
        } else {
            setDateError(null);
        }
    };

    const canConfirmUpload = useMemo(() => {
        if (!stagedFile) return false;
        if (requiresDateValidation) {
            if (!documentDate) return false;
            if (isDocumentTooOld(documentDate)) return false;
        }
        return true;
    }, [stagedFile, requiresDateValidation, documentDate]);

    const handleConfirmUpload = () => {
        if (!stagedFile || !canConfirmUpload) return;
        uploadFile(stagedFile);
    };

    const handleCancelStage = () => {
        if (stagedPreviewUrl) {
            URL.revokeObjectURL(stagedPreviewUrl);
        }
        setStagedFile(null);
        setStagedPreviewUrl(null);
        setDocumentDate("");
        setDateError(null);
        setError(null);
        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const uploadFile = async (file: File) => {
        if (!validateFile(file)) return;

        setIsUploading(true);
        setUploadProgress(0);

        try {
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) throw new Error("Not authenticated");

            const { data: sitterData } = await supabase
                .from("sitters")
                .select("id")
                .eq("user_id", user.id)
                .single();

            if (!sitterData) throw new Error("Sitter profile not found");

            const sitterId = sitterData.id;
            const fileExt = file.name.split(".").pop();
            const fileName = `${documentType}-${Date.now()}.${fileExt}`;
            const filePath = `${sitterId}/${documentType}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from("verification-documents")
                .upload(filePath, file, {
                    cacheControl: "3600",
                    upsert: false,
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from("verification-documents")
                .getPublicUrl(filePath);

            const columnName = `${documentType.replace("-", "_")}_url`;
            await supabase
                .from("sitter_verifications")
                .upsert({
                    sitter_id: sitterId,
                    [columnName]: publicUrl,
                }, {
                    onConflict: "sitter_id",
                });

            setUploadProgress(100);
            setShowPreview(true);

            // Clean up staged state
            if (stagedPreviewUrl) {
                URL.revokeObjectURL(stagedPreviewUrl);
            }
            setStagedFile(null);
            setStagedPreviewUrl(null);
            setDocumentDate("");
            setDateError(null);

            toast({
                title: "Yükleme başarılı",
                description: `${title} başarıyla yüklendi`,
            });

            onUploadComplete(publicUrl);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Yükleme başarısız");
            toast({
                title: "Yükleme başarısız",
                description: "Lütfen tekrar deneyin",
                variant: "destructive",
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) stageFile(files[0]);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) stageFile(files[0]);
    };

    const handleDelete = async () => {
        if (!currentFileUrl) return;
        try {
            const urlParts = currentFileUrl.split("/verification-documents/");
            const path = urlParts[urlParts.length - 1];
            await supabase.storage.from("verification-documents").remove([path]);
            setShowPreview(false);
            setImageZoom(1);
            setImageRotation(0);
            onUploadComplete("");
            toast({ title: "Dosya silindi" });
        } catch {
            toast({ title: "Silme başarısız", variant: "destructive" });
        }
    };

    const renderUploadedPreview = () => {
        if (!currentFileUrl) return null;

        if (isImage) {
            return (
                <div className="space-y-3">
                    <div className="relative overflow-hidden rounded-lg border border-border bg-muted/30">
                        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/50">
                            <span className="text-xs font-medium text-muted-foreground">Önizleme</span>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => setImageZoom((z) => Math.max(0.5, z - 0.25))}
                                >
                                    <ZoomOut className="h-3.5 w-3.5" />
                                </Button>
                                <span className="text-xs text-muted-foreground w-10 text-center">
                                    {Math.round(imageZoom * 100)}%
                                </span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => setImageZoom((z) => Math.min(3, z + 0.25))}
                                >
                                    <ZoomIn className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => setImageRotation((r) => (r + 90) % 360)}
                                >
                                    <RotateCw className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                        <div className="flex items-center justify-center p-4 min-h-[200px] max-h-[320px] overflow-auto">
                            <img
                                src={currentFileUrl}
                                alt={title}
                                className="max-w-full transition-transform duration-200 rounded"
                                style={{
                                    transform: `scale(${imageZoom}) rotate(${imageRotation}deg)`,
                                }}
                            />
                        </div>
                    </div>
                </div>
            );
        }

        if (isPdf) {
            return (
                <div className="space-y-3">
                    <div className="relative overflow-hidden rounded-lg border border-border bg-muted/30">
                        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/50">
                            <span className="text-xs font-medium text-muted-foreground">PDF Önizleme</span>
                        </div>
                        <div className="h-[300px]">
                            <iframe
                                src={`${currentFileUrl}#toolbar=0&navpanes=0`}
                                className="w-full h-full border-0"
                                title={`${title} önizleme`}
                            />
                        </div>
                    </div>
                </div>
            );
        }

        return null;
    };

    const renderStagedPreview = () => {
        if (!stagedFile || !stagedPreviewUrl) return null;

        return (
            <div className="space-y-4 border-2 border-primary/30 rounded-lg p-4 bg-primary/5">
                {/* File info */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                            <p className="font-medium text-sm">{stagedFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                                {(stagedFile.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelStage}
                        className="text-destructive hover:text-destructive"
                    >
                        <X className="h-4 w-4 mr-1" />
                        İptal
                    </Button>
                </div>

                {/* PDF Preview */}
                <div className="relative overflow-hidden rounded-lg border border-border bg-muted/30">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/50">
                        <span className="text-xs font-medium text-muted-foreground">PDF Önizleme (yükleme öncesi)</span>
                    </div>
                    <div className="h-[250px]">
                        <iframe
                            src={`${stagedPreviewUrl}#toolbar=0&navpanes=0`}
                            className="w-full h-full border-0"
                            title={`${title} önizleme`}
                        />
                    </div>
                </div>

                {/* Document date validation */}
                {requiresDateValidation && (
                    <div className="space-y-2">
                        <Label htmlFor={`doc-date-${documentType}`} className="flex items-center gap-2 text-sm font-medium">
                            <Calendar className="h-4 w-4" />
                            Belge Tarihi
                        </Label>
                        <Input
                            id={`doc-date-${documentType}`}
                            type="date"
                            value={documentDate}
                            onChange={(e) => handleDateChange(e.target.value)}
                            max={new Date().toISOString().split("T")[0]}
                            className="max-w-[200px]"
                        />
                        <p className="text-xs text-muted-foreground">
                            Belge son {MAX_DOCUMENT_AGE_DAYS} gün içinde alınmış olmalıdır
                        </p>
                        {dateError && (
                            <Alert variant="destructive" className="py-2">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription className="text-sm">{dateError}</AlertDescription>
                            </Alert>
                        )}
                    </div>
                )}

                {/* Confirm upload button */}
                <Button
                    onClick={handleConfirmUpload}
                    disabled={!canConfirmUpload || isUploading}
                    className="w-full"
                >
                    {isUploading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Yükleniyor... {uploadProgress}%
                        </>
                    ) : (
                        <>
                            <Send className="mr-2 h-4 w-4" />
                            Belgeyi Yükle
                        </>
                    )}
                </Button>
            </div>
        );
    };

    return (
        <Card>
            <CardContent className="p-6">
                <div className="space-y-4">
                    <div>
                        <h3 className="font-semibold text-lg mb-1">{title}</h3>
                        <p className="text-sm text-muted-foreground">{description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Kabul edilen formatlar: {acceptedFormats} • Maksimum: {maxSize}MB
                            {requiresDateValidation && ` • Son ${MAX_DOCUMENT_AGE_DAYS} gün içinde alınmış olmalı`}
                        </p>
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Staged PDF preview (before upload) */}
                    {stagedFile && !currentFileUrl && renderStagedPreview()}

                    {/* Already uploaded file */}
                    {currentFileUrl ? (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-success/10 border border-success/30 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-success" />
                                    <div>
                                        <p className="font-medium text-sm">Dosya Yüklendi</p>
                                        <p className="text-xs text-muted-foreground">Doküman başarıyla yüklendi</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowPreview(!showPreview)}
                                    >
                                        <Eye className="h-4 w-4 mr-1.5" />
                                        {showPreview ? "Gizle" : "Önizle"}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.open(currentFileUrl, "_blank")}
                                    >
                                        {isPdf ? <FileText className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleDelete}
                                        disabled={disabled}
                                        className="text-destructive hover:text-destructive"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {showPreview && renderUploadedPreview()}
                        </div>
                    ) : !stagedFile ? (
                        /* Drop zone - only show when no file is staged and nothing uploaded */
                        <div
                            className={cn(
                                "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                                isDragging ? "border-primary bg-primary/5" : "border-border",
                                disabled && "opacity-50 cursor-not-allowed"
                            )}
                            onDrop={handleDrop}
                            onDragOver={(e) => {
                                e.preventDefault();
                                if (!disabled) setIsDragging(true);
                            }}
                            onDragLeave={() => setIsDragging(false)}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept={isPdf ? ".pdf,application/pdf" : "image/*"}
                                onChange={handleFileSelect}
                                className="hidden"
                                disabled={disabled || isUploading}
                            />

                            {isUploading ? (
                                <div className="space-y-3">
                                    <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin" />
                                    <p className="text-sm text-muted-foreground">
                                        Yükleniyor... {uploadProgress}%
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <p className="font-medium mb-2">
                                        Dosyayı sürükleyip bırakın veya seçin
                                    </p>
                                    <p className="text-xs text-muted-foreground mb-4">
                                        {isPdf ? "Sadece PDF dosyaları kabul edilir" : "JPG, PNG, WebP formatları kabul edilir"}
                                        {" • "}Maksimum {maxSize}MB
                                    </p>
                                    <Button
                                        variant="outline"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={disabled}
                                    >
                                        <File className="h-4 w-4 mr-2" />
                                        Dosya Seç
                                    </Button>
                                </>
                            )}
                        </div>
                    ) : null}
                </div>
            </CardContent>
        </Card>
    );
}
