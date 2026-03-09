/**
 * Document Upload Component - Drag-and-drop file upload with inline preview for verification documents
 */

import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LazyImage } from "@/components/ui/lazy-image";

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

    const isImage = documentType !== "background-check" && documentType !== "transcript" && documentType !== "student-certificate";
    const isPdf = documentType === "background-check" || documentType === "transcript" || documentType === "student-certificate";

    const validateFile = (file: File): boolean => {
        const maxBytes = maxSize * 1024 * 1024;
        if (file.size > maxBytes) {
            setError(`Dosya boyutu ${maxSize}MB'dan küçük olmalıdır`);
            return false;
        }

        if (isImage && !file.type.startsWith("image/")) {
            setError("Lütfen geçerli bir resim dosyası yükleyin");
            return false;
        }

        if (isPdf && file.type !== "application/pdf") {
            setError("Lütfen PDF dosyası yükleyin");
            return false;
        }

        setError(null);
        return true;
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
        if (files.length > 0) uploadFile(files[0]);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) uploadFile(files[0]);
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

    const renderPreview = () => {
        if (!currentFileUrl) return null;

        if (isImage) {
            return (
                <div className="space-y-3">
                    {/* Image preview with zoom/rotate controls */}
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

    return (
        <Card>
            <CardContent className="p-6">
                <div className="space-y-4">
                    <div>
                        <h3 className="font-semibold text-lg mb-1">{title}</h3>
                        <p className="text-sm text-muted-foreground">{description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Kabul edilen formatlar: {acceptedFormats} • Maksimum: {maxSize}MB
                        </p>
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {currentFileUrl ? (
                        <div className="space-y-3">
                            {/* Status bar */}
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

                            {/* Inline preview */}
                            {showPreview && renderPreview()}
                        </div>
                    ) : (
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
                                accept={isPdf ? ".pdf" : "image/*"}
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
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
