/**
 * ReviewStats - Review statistics display component
 */

import { Star, Shield, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { ReviewStats as IReviewStats } from "@/types/review";

interface ReviewStatsProps {
    stats: IReviewStats;
}

export function ReviewStats({ stats }: ReviewStatsProps) {
    const { totalReviews, averageRating, weightedAverageRating, ratingDistribution, trustedReviewCount } = stats;

    if (totalReviews === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <Star className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Henüz değerlendirme yok</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Main Rating */}
            <div className="flex items-center gap-6">
                <div className="text-center">
                    <div className="text-5xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                        {weightedAverageRating.toFixed(1)}
                    </div>
                    <div className="flex items-center justify-center gap-0.5 mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                className={`h-4 w-4 ${star <= Math.round(weightedAverageRating)
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-gray-200"
                                    }`}
                            />
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {totalReviews} değerlendirme
                    </p>
                </div>

                {/* Rating Distribution */}
                <div className="flex-1 space-y-2">
                    {([5, 4, 3, 2, 1] as const).map((rating) => {
                        const count = ratingDistribution[rating];
                        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

                        return (
                            <div key={rating} className="flex items-center gap-2">
                                <span className="text-xs w-3 text-muted-foreground">{rating}</span>
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <Progress value={percentage} className="flex-1 h-2" />
                                <span className="text-xs w-8 text-right text-muted-foreground">
                                    {count}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-emerald-700">
                            {trustedReviewCount} Güvenilir
                        </p>
                        <p className="text-xs text-emerald-600">
                            Doğrulanmış değerlendirme
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-violet-50 rounded-lg">
                    <div className="h-10 w-10 rounded-full bg-violet-100 flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-violet-700">
                            {averageRating.toFixed(1)} Ortalama
                        </p>
                        <p className="text-xs text-violet-600">
                            Ham ortalama puan
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
