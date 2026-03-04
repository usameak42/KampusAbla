/**
 * ReviewsList - Reviews list with filtering and sorting
 */

import { useState, useMemo } from "react";
import { Star, Filter, ArrowUpDown, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { ReviewCard } from "./ReviewCard";
import type { Review } from "@/types/review";

interface ReviewsListProps {
    reviews: Review[];
    isLoading?: boolean;
    emptyMessage?: string;
}

type SortOption = "newest" | "oldest" | "highest" | "lowest" | "trusted";
type FilterOption = "all" | "5" | "4" | "3" | "2" | "1" | "trusted";

const SORT_LABELS: Record<SortOption, string> = {
    newest: "En Yeni",
    oldest: "En Eski",
    highest: "En Yüksek Puan",
    lowest: "En Düşük Puan",
    trusted: "Güvenilir Önce",
};

const FILTER_LABELS: Record<FilterOption, string> = {
    all: "Tümü",
    "5": "5 Yıldız",
    "4": "4 Yıldız",
    "3": "3 Yıldız",
    "2": "2 Yıldız",
    "1": "1 Yıldız",
    trusted: "Sadece Güvenilir",
};

export function ReviewsList({
    reviews,
    isLoading = false,
    emptyMessage = "Henüz değerlendirme yok",
}: ReviewsListProps) {
    const [sortBy, setSortBy] = useState<SortOption>("newest");
    const [filterBy, setFilterBy] = useState<FilterOption>("all");

    const processedReviews = useMemo(() => {
        let result = [...reviews];

        // Filter
        if (filterBy === "trusted") {
            result = result.filter((r) => r.isTrusted);
        } else if (filterBy !== "all") {
            result = result.filter((r) => r.rating === parseInt(filterBy));
        }

        // Sort
        switch (sortBy) {
            case "newest":
                result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                break;
            case "oldest":
                result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                break;
            case "highest":
                result.sort((a, b) => b.rating - a.rating);
                break;
            case "lowest":
                result.sort((a, b) => a.rating - b.rating);
                break;
            case "trusted":
                result.sort((a, b) => {
                    if (a.isTrusted === b.isTrusted) return b.rating - a.rating;
                    return a.isTrusted ? -1 : 1;
                });
                break;
        }

        return result;
    }, [reviews, sortBy, filterBy]);

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Controls */}
            {reviews.length > 0 && (
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="text-sm text-muted-foreground">
                        {processedReviews.length} / {reviews.length} değerlendirme
                    </p>
                    <div className="flex items-center gap-2">
                        {/* Filter */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2">
                                    <Filter className="h-4 w-4" />
                                    {FILTER_LABELS[filterBy]}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Filtrele</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {(Object.keys(FILTER_LABELS) as FilterOption[]).map((option) => (
                                    <DropdownMenuItem
                                        key={option}
                                        onClick={() => setFilterBy(option)}
                                        className={filterBy === option ? "bg-accent" : ""}
                                    >
                                        {option !== "all" && option !== "trusted" && (
                                            <span className="flex items-center gap-1 mr-2">
                                                {Array.from({ length: parseInt(option) }).map((_, i) => (
                                                    <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                ))}
                                            </span>
                                        )}
                                        {FILTER_LABELS[option]}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Sort */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2">
                                    <ArrowUpDown className="h-4 w-4" />
                                    {SORT_LABELS[sortBy]}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Sırala</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {(Object.keys(SORT_LABELS) as SortOption[]).map((option) => (
                                    <DropdownMenuItem
                                        key={option}
                                        onClick={() => setSortBy(option)}
                                        className={sortBy === option ? "bg-accent" : ""}
                                    >
                                        {SORT_LABELS[option]}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            )}

            {/* Reviews List */}
            {processedReviews.length > 0 ? (
                <div className="space-y-3">
                    {processedReviews.map((review) => (
                        <ReviewCard key={review.id} review={review} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        <MessageSquare className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">{emptyMessage}</p>
                </div>
            )}
        </div>
    );
}
