import { Star, Shield, MessageCircle, Clock, CheckCircle, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ReviewSummaryProps {
    role: "parent" | "sitter";
    rating: number;
    reviewCount: number;
    reviews?: any[]; // Replace with proper Review type
}

export function ReviewSummary({ role, rating, reviewCount, reviews = [] }: ReviewSummaryProps) {
    // Mock analysis data based on role
    // In production, calculating these from actual review tags would be ideal

    // For Parents viewing Sitter: "Families love this"
    const positiveTraits = [
        { label: "Güvenli Ortam", count: 12, icon: Shield, color: "text-blue-500", bg: "bg-blue-50" },
        { label: "İletişim", count: 9, icon: MessageCircle, color: "text-purple-500", bg: "bg-purple-50" },
        { label: "Dakiklik", count: 8, icon: Clock, color: "text-green-500", bg: "bg-green-50" },
    ];

    // For Sitters viewing themselves: "Parent Feedback"
    const feedbackStats = [
        { label: "5 Yıldız", count: 15, percentage: 80 },
        { label: "4 Yıldız", count: 3, percentage: 15 },
        { label: "3 Yıldız", count: 1, percentage: 5 },
        { label: "2 Yıldız", count: 0, percentage: 0 },
        { label: "1 Yıldız", count: 0, percentage: 0 },
    ];

    if (role === "parent") {
        return (
            <Card className="mb-6">
                <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Heart className="h-5 w-5 text-red-500" />
                        Aileler neleri sevdi?
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {positiveTraits.map((trait) => (
                            <div key={trait.label} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                                <div className={cn("h-10 w-10 rounded-full flex items-center justify-center", trait.bg)}>
                                    <trait.icon className={cn("h-5 w-5", trait.color)} />
                                </div>
                                <div>
                                    <div className="font-semibold text-sm">{trait.label}</div>
                                    <div className="text-xs text-muted-foreground">{trait.count} aile belirtti</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Role == sitter
    return (
        <Card className="mb-6">
            <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base flex items-center gap-2">
                    <Star className="h-5 w-5 text-amber-500" />
                    Aile Geri Bildirimleri
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
                <div className="flex items-start gap-8">
                    {/* Overall Rating */}
                    <div className="text-center min-w-[100px]">
                        <div className="text-4xl font-bold">{rating}</div>
                        <div className="flex justify-center gap-0.5 my-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    className={cn(
                                        "h-4 w-4",
                                        star <= Math.round(rating)
                                            ? "text-amber-500 fill-amber-500"
                                            : "text-gray-200"
                                    )}
                                />
                            ))}
                        </div>
                        <div className="text-xs text-muted-foreground">{reviewCount} değerlendirme</div>
                    </div>

                    {/* Breakdown */}
                    <div className="flex-1 space-y-2">
                        {feedbackStats.map((stat) => (
                            <div key={stat.label} className="flex items-center gap-2 text-sm">
                                <span className="w-12">{stat.label}</span>
                                <Progress value={stat.percentage} className="h-2" />
                                <span className="w-8 text-right text-xs text-muted-foreground">{stat.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
