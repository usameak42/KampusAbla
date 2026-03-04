/**
 * ReviewCard - Single review display component
 */

import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Star, Shield, Repeat, CreditCard, Clock, Crown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Review, TrustReason } from "@/types/review";
import { TRUST_REASON_LABELS } from "@/types/review";

interface ReviewCardProps {
    review: Review;
    showReviewee?: boolean;
}

const TRUST_ICONS: Record<TrustReason, React.ReactNode> = {
    verified_user: <Shield className="h-3 w-3" />,
    repeat_booking: <Repeat className="h-3 w-3" />,
    completed_payment: <CreditCard className="h-3 w-3" />,
    long_session: <Clock className="h-3 w-3" />,
    premium_subscriber: <Crown className="h-3 w-3" />,
};

export function ReviewCard({ review, showReviewee = false }: ReviewCardProps) {
    const displayName = showReviewee ? review.revieweeName : review.reviewerName;
    const displayPhoto = showReviewee ? undefined : review.reviewerPhoto;

    return (
        <div className="border rounded-xl p-4 space-y-3 bg-card hover:shadow-sm transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={displayPhoto} />
                        <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-sm">
                            {displayName.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{displayName}</span>
                            {review.isTrusted && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <Badge variant="secondary" className="text-xs gap-1 bg-emerald-100 text-emerald-700">
                                                <Shield className="h-3 w-3" />
                                                Güvenilir
                                            </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Bu değerlendirme güvenilir kabul edilir</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {format(new Date(review.createdAt), "d MMM yyyy", { locale: tr })}
                        </p>
                    </div>
                </div>

                {/* Rating Stars */}
                <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                            key={star}
                            className={`h-4 w-4 ${star <= review.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-200"
                                }`}
                        />
                    ))}
                </div>
            </div>

            {/* Comment */}
            <p className="text-sm text-foreground/80 leading-relaxed">
                {review.comment}
            </p>

            {/* Trust Reasons */}
            {review.trustReasons.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                    {review.trustReasons.map((reason) => (
                        <TooltipProvider key={reason}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Badge
                                        variant="outline"
                                        className="text-xs gap-1 text-muted-foreground cursor-help"
                                    >
                                        {TRUST_ICONS[reason]}
                                        {TRUST_REASON_LABELS[reason]}
                                    </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Bu değerlendirme ağırlığına katkı sağlar</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    ))}
                </div>
            )}
        </div>
    );
}
