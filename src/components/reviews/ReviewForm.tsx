/**
 * ReviewForm - Rating and comment submission form
 */

import { useState } from "react";
import { Star, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RATING_INFO } from "@/types/review";

interface ReviewFormProps {
    revieweeName: string;
    revieweePhoto?: string;
    revieweeRole: "parent" | "sitter";
    onSubmit: (rating: number, comment: string) => Promise<void>;
    onCancel?: () => void;
    isLoading?: boolean;
    error?: string | null;
}

export function ReviewForm({
    revieweeName,
    revieweePhoto,
    revieweeRole,
    onSubmit,
    onCancel,
    isLoading = false,
    error,
}: ReviewFormProps) {
    const [rating, setRating] = useState<number>(0);
    const [hoveredRating, setHoveredRating] = useState<number>(0);
    const [comment, setComment] = useState("");

    const displayRating = hoveredRating || rating;
    const ratingInfo = displayRating ? RATING_INFO[displayRating] : null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) return;
        await onSubmit(rating, comment);
    };

    const roleLabel = revieweeRole === "sitter" ? "Bakıcı" : "Aile/Çocuk";

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Reviewee Info */}
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                <Avatar className="h-14 w-14">
                    <AvatarImage src={revieweePhoto} />
                    <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-lg">
                        {revieweeName.charAt(0)}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <p className="text-sm text-muted-foreground">{roleLabel} değerlendirmesi</p>
                    <p className="font-semibold text-lg">{revieweeName}</p>
                </div>
            </div>

            {/* Star Rating */}
            <div className="space-y-3">
                <Label className="text-base font-medium">Puanınız</Label>
                <div className="flex flex-col items-center gap-3 py-4">
                    <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoveredRating(star)}
                                onMouseLeave={() => setHoveredRating(0)}
                                className="p-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary rounded"
                            >
                                <Star
                                    className={`h-10 w-10 transition-colors ${star <= displayRating
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-gray-300 hover:text-yellow-300"
                                        }`}
                                />
                            </button>
                        ))}
                    </div>
                    {ratingInfo && (
                        <p className={`text-lg font-medium ${ratingInfo.color}`}>
                            {ratingInfo.emoji} {ratingInfo.label}
                        </p>
                    )}
                </div>
            </div>

            {/* Comment */}
            <div className="space-y-2">
                <Label htmlFor="comment" className="text-base font-medium">
                    Yorumunuz
                </Label>
                <Textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Deneyiminizi paylaşın... (opsiyonel)"
                    className="min-h-[120px] resize-none"
                    maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right">
                    {comment.length}/500 karakter
                </p>
            </div>

            {/* Two-sided Review Info */}
            <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                <AlertDescription className="text-sm text-blue-700">
                    Değerlendirmeler, her iki taraf da değerlendirme gönderdiğinde görünür olur.
                    Bu sistem, adil ve dürüst geri bildirim sağlar.
                </AlertDescription>
            </Alert>

            {/* Error */}
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Actions */}
            <div className="flex gap-3">
                {onCancel && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        className="flex-1"
                        disabled={isLoading}
                    >
                        Daha Sonra
                    </Button>
                )}
                <Button
                    type="submit"
                    disabled={rating === 0 || isLoading}
                    className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Gönderiliyor...
                        </>
                    ) : (
                        "Değerlendirmeyi Gönder"
                    )}
                </Button>
            </div>
        </form>
    );
}
