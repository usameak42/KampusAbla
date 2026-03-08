/**
 * Document Upload Component - Drag-and-drop file upload for verification documents
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
    Eye
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

    const isImage = documentType !== "background-check" && documentType !== "transcript" && documentType !== "student-certificate";
    const isPdf = documentType === "background-check" || documentType === "transcript" || documentType === "student-certificate";

    const validateFile = (file: File): boolean => {
        // Check file size
        const maxBytes = maxSize * 1024 * 1024;
        if (file.size > maxBytes) {
            setError(`Dosya boyutu ${maxSize}MB'dan küçük olmalıdır`);
            return false;
        }

        // Check file type
        // const isImage ... (already defined above)
        // const isPdf ... (already defined above)

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

            // Get sitter ID from user metadata or sitters table
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

            // Upload to Supabase Storage
            const { error: uploadError, data } = await supabase.storage
                .from("verification-documents")
                .upload(filePath, file, {
                    cacheControl: "3600",
                    upsert: false,
                });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from("verification-documents")
                .getPublicUrl(filePath);

            // Update sitter_verifications table
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
        if (files.length > 0) {
            uploadFile(files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            uploadFile(files[0]);
        }
    };

    const handleDelete = async () => {
        if (!currentFileUrl) return;

        try {
            // Extract file path from URL
            const urlParts = currentFileUrl.split("/verification-documents/");
            const path = urlParts[urlParts.length - 1];

            await supabase.storage
                .from("verification-documents")
                .remove([path]);

            onUploadComplete("");
            toast({ title: "Dosya silindi" });
        } catch (err) {
            toast({
                title: "Silme başarısız",
                variant: "destructive",
            });
        }
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
                        <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                <div>
                                    <p className="font-medium text-green-900">Dosya Yüklendi</p>
                                    <p className="text-sm text-green-700">Doküman başarıyla yüklendi</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(currentFileUrl, "_blank")}
                                >
                                    <Eye className="h-4 w-4 mr-2" />
                                    Görüntüle
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDelete}
                                    disabled={disabled}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div
                            className={cn(
                                "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                                isDragging ? "border-primary bg-primary/5" : "border-gray-300",
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
                                    <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
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
