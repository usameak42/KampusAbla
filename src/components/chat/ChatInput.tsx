/**
 * Chat Input Component - Message composer with attachments
 */

import { useState, useRef, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Send,
    Image,
    Loader2,
    X,
    AlertTriangle,
} from "lucide-react";
import { containsBlockedContent } from "@/types/chat";

interface ChatInputProps {
    onSend: (content: string, type?: "text" | "image", imageUrl?: string) => Promise<boolean>;
    disabled?: boolean;
    placeholder?: string;
    error?: string | null;
    onClearError?: () => void;
}

export function ChatInput({
    onSend,
    disabled = false,
    placeholder = "Mesajınızı yazın...",
    error,
    onClearError,
}: ChatInputProps) {
    const [message, setMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [warning, setWarning] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Check content as user types
    const handleChange = (value: string) => {
        setMessage(value);

        // Check for blocked content
        const check = containsBlockedContent(value);
        if (check.blocked) {
            setWarning(check.reason || null);
        } else {
            setWarning(null);
        }
    };

    // Handle send
    const handleSend = async () => {
        const trimmed = message.trim();
        if (!trimmed && !selectedImage) return;
        if (warning) return;

        setIsSending(true);
        try {
            const success = await onSend(
                trimmed,
                selectedImage ? "image" : "text",
                selectedImage || undefined
            );
            if (success) {
                setMessage("");
                setSelectedImage(null);
                textareaRef.current?.focus();
            }
        } finally {
            setIsSending(false);
        }
    };

    // Handle Enter key
    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Handle image selection
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setWarning("Resim boyutu 5MB'dan küçük olmalıdır.");
                return;
            }
            setWarning(null); // Clear previous warnings if valid

            const reader = new FileReader();
            reader.onload = (event) => {
                setSelectedImage(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="border-t bg-background p-3 space-y-2">
            {/* Error Alert */}
            {error && (
                <Alert variant="destructive" className="py-2">
                    <AlertDescription className="flex items-center justify-between">
                        <span className="text-sm">{error}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClearError}>
                            <X className="h-4 w-4" />
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            {/* Warning Alert */}
            {warning && (
                <Alert className="py-2 border-yellow-500 bg-yellow-50">
                    <AlertDescription className="flex items-center gap-2 text-yellow-700">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm">{warning}</span>
                    </AlertDescription>
                </Alert>
            )}

            {/* Selected Image Preview */}
            {selectedImage && (
                <div className="relative inline-block">
                    <img
                        src={selectedImage}
                        alt="Preview"
                        className="h-20 w-20 object-cover rounded-lg"
                        loading="lazy"
                    />
                    <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={() => setSelectedImage(null)}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            )}

            {/* Input Area */}
            <div className="flex items-end gap-2">
                {/* Attachment Button */}
                <div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageSelect}
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={disabled || isSending}
                    >
                        <Image className="h-5 w-5 text-muted-foreground" />
                    </Button>
                </div>

                {/* Text Input */}
                <Textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => handleChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled || isSending}
                    className="min-h-[40px] max-h-[120px] resize-none"
                    rows={1}
                />

                {/* Send Button */}
                <Button
                    onClick={handleSend}
                    disabled={disabled || isSending || (!message.trim() && !selectedImage) || !!warning}
                    size="icon"
                    className="h-10 w-10"
                >
                    {isSending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <Send className="h-5 w-5" />
                    )}
                </Button>
            </div>

            {/* Helper Text */}
            <p className="text-xs text-muted-foreground text-center">
                Güvenliğiniz için iletişim bilgileri paylaşımı engellenir
            </p>
        </div>
    );
}
