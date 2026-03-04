/**
 * SitterReviewsPage - View all reviews for a sitter
 */

import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ReviewsList, ReviewStats } from "@/components/reviews";
import { useReviews } from "@/hooks/useReviews";

// Mock sitter data (in production fetch from API)
const MOCK_SITTER = {
    id: "sitter-1",
    name: "Elif Kaya",
    photo: "/images/sitter1.jpg",
    university: "Boğaziçi Üniversitesi",
    department: "Psikoloji",
    verified: true,
    badgeLevel: "gold" as const,
};

export default function SitterReviewsPage() {
    const { sitterId } = useParams<{ sitterId: string }>();
    const navigate = useNavigate();

    const { sitterReviews, isLoading, getSitterStats } = useReviews({
        sitterId: sitterId || MOCK_SITTER.id,
    });

    const stats = getSitterStats(sitterId || MOCK_SITTER.id);
    const sitter = MOCK_SITTER; // In production: fetch sitter data

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white">
                <div className="container max-w-2xl mx-auto px-4 py-6">
                    <Skeleton className="h-8 w-32 mb-6" />
                    <Card className="mb-6">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4 mb-6">
                                <Skeleton className="h-16 w-16 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-32" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                            </div>
                            <Skeleton className="h-40 w-full" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white">
            <div className="container max-w-2xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-xl font-semibold">Değerlendirmeler</h1>
                </div>

                {/* Sitter Info Card */}
                <Card className="mb-6">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-6">
                            <Avatar className="h-16 w-16">
                                <AvatarImage src={sitter.photo} />
                                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-xl">
                                    {sitter.name.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-lg font-semibold">{sitter.name}</h2>
                                    {sitter.verified && (
                                        <Badge
                                            className={
                                                sitter.badgeLevel === "gold"
                                                    ? "bg-yellow-100 text-yellow-700"
                                                    : "bg-gray-100 text-gray-700"
                                            }
                                        >
                                            {sitter.badgeLevel === "gold" ? "Altın" : "Gümüş"} Rozet
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {sitter.university} • {sitter.department}
                                </p>
                            </div>
                        </div>

                        {/* Stats */}
                        <ReviewStats stats={stats} />
                    </CardContent>
                </Card>

                {/* Reviews List */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Star className="h-5 w-5 text-yellow-500" />
                            Tüm Değerlendirmeler
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <ReviewsList
                            reviews={sitterReviews}
                            isLoading={isLoading}
                            emptyMessage="Bu bakıcı için henüz değerlendirme yok"
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
