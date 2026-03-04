/**
 * ReviewPrompt - Post-session review trigger dialog
 */

import { useState } from "react";
import { Star, Clock, CheckCircle } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ReviewForm } from "./ReviewForm";

interface ReviewPromptProps {
    isOpen: boolean;
    onClose: () => void;
    sessionId: string;
    bookingId: string;
    revieweeId: string;
    revieweeName: string;
    revieweePhoto?: string;
    revieweeRole: "parent" | "sitter";
    onSubmit: (rating: number, comment: string) => Promise<void>;
    hasAlreadyReviewed?: boolean;
    waitingForOther?: boolean;
}

export function ReviewPrompt({
    isOpen,
    onClose,
    revieweeName,
    revieweePhoto,
    revieweeRole,
    onSubmit,
    hasAlreadyReviewed = false,
    waitingForOther = false,
}: ReviewPromptProps) {
    const [showForm, setShowForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (rating: number, comment: string) => {
        setIsSubmitting(true);
        setError(null);
        try {
            await onSubmit(rating, comment);
            setIsSuccess(true);
        } catch (err) {
            setError("Değerlendirme gönderilemedi. Lütfen tekrar deneyin.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setShowForm(false);
        setIsSuccess(false);
        setError(null);
        onClose();
    };

    // Already reviewed state
    if (hasAlreadyReviewed && !waitingForOther) {
        return (
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            Değerlendirme Tamamlandı
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-6 text-center space-y-4">
                        <div className="h-20 w-20 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle className="h-10 w-10 text-green-500" />
                        </div>
                        <p className="text-muted-foreground">
                            Bu oturum için değerlendirmenizi zaten gönderdiniz.
                        </p>
                    </div>
                    <Button onClick={handleClose} className="w-full">
                        Tamam
                    </Button>
                </DialogContent>
            </Dialog>
        );
    }

    // Waiting for other party
    if (waitingForOther) {
        return (
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-orange-500" />
                            Değerlendirme Bekleniyor
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-6 text-center space-y-4">
                        <div className="h-20 w-20 mx-auto rounded-full bg-orange-100 flex items-center justify-center animate-pulse">
                            <Clock className="h-10 w-10 text-orange-500" />
                        </div>
                        <div>
                            <p className="font-medium">Değerlendirmeniz gönderildi!</p>
                            <p className="text-muted-foreground text-sm mt-1">
                                Diğer taraf da değerlendirme gönderdiğinde her iki değerlendirme görünür olacak.
                            </p>
                        </div>
                    </div>
                    <Button onClick={handleClose} className="w-full">
                        Tamam
                    </Button>
                </DialogContent>
            </Dialog>
        );
    }

    // Success state
    if (isSuccess) {
        return (
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent className="max-w-md">
                    <div className="py-8 text-center space-y-4">
                        <div className="h-20 w-20 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle className="h-10 w-10 text-green-500" />
                        </div>
                        <div>
                            <p className="text-xl font-semibold">Teşekkürler!</p>
                            <p className="text-muted-foreground mt-2">
                                Değerlendirmeniz başarıyla gönderildi. Diğer taraf da değerlendirme
                                gönderdiğinde görünür olacak.
                            </p>
                        </div>
                        <Button onClick={handleClose} className="w-full">
                            Tamam
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                {!showForm ? (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Star className="h-5 w-5 text-yellow-500" />
                                Oturum Değerlendirmesi
                            </DialogTitle>
                        </DialogHeader>
                        <div className="py-6 text-center space-y-4">
                            <div className="h-20 w-20 mx-auto rounded-full bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
                                <Star className="h-10 w-10 text-violet-500" />
                            </div>
                            <div>
                                <p className="font-medium">Oturum nasıldı?</p>
                                <p className="text-muted-foreground text-sm mt-1">
                                    {revieweeName} ile deneyiminizi değerlendirin
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={handleClose} className="flex-1">
                                Daha Sonra
                            </Button>
                            <Button
                                onClick={() => setShowForm(true)}
                                className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600"
                            >
                                Değerlendir
                            </Button>
                        </div>
                    </>
                ) : (
                    <ReviewForm
                        revieweeName={revieweeName}
                        revieweePhoto={revieweePhoto}
                        revieweeRole={revieweeRole}
                        onSubmit={handleSubmit}
                        onCancel={() => setShowForm(false)}
                        isLoading={isSubmitting}
                        error={error}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}
