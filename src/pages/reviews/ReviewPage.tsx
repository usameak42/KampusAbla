/**
 * ReviewPage - Post-session review submission page
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Star, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ReviewForm } from "@/components/reviews";
import { SitterReviewForm } from "@/components/reviews/forms/SitterReviewForm";
import { FamilyReviewForm } from "@/components/reviews/forms/FamilyReviewForm";
import { useReviews } from "@/hooks/useReviews";

// Mock session data (in production fetch from API)
const MOCK_SESSION = {
    id: "session-1",
    bookingId: "booking-3",
    parentId: "parent-1",
    parentName: "Ayşe Demir",
    parentPhoto: "/images/parent1.jpg",
    sitterId: "sitter-2",
    sitterName: "Selin Öz",
    sitterPhoto: "/images/sitter2.jpg",
    completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
};

// Mock children data (for sitter reviews)
const MOCK_CHILDREN = [
    { id: "child-1", name: "Aylin" },
    { id: "child-2", name: "Can" },
];

export default function ReviewPage() {
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [searchParams] = useSearchParams();
    const [isLoading, setIsLoading] = useState(true);
    const [session, setSession] = useState<typeof MOCK_SESSION | null>(null);

    // Mock current user (in production get from auth context)
    // Use URL param ?role=sitter to test sitter view
    const roleParam = searchParams.get("role");
    const isSitterRole = roleParam === "sitter";

    const currentUserId = isSitterRole ? "sitter-2" : "parent-1";
    const currentUserName = isSitterRole ? "Selin Öz" : "Ayşe Demir";
    const currentUserRole: "parent" | "sitter" = isSitterRole ? "sitter" : "parent";

    const { submitReview, submitDetailedReview, hasReviewed, sessionReviewPair, isLoading: isSubmitting } = useReviews({
        userId: currentUserId,
        sessionId: sessionId,
    });

    // State for enhanced review system
    const [children, setChildren] = useState<Array<{ id: string; name: string }>>([]);
    const [showReportModal, setShowReportModal] = useState(false);

    // Fetch session data
    useEffect(() => {
        const fetchSession = async () => {
            setIsLoading(true);
            await new Promise((resolve) => setTimeout(resolve, 500));
            setSession(MOCK_SESSION);

            // If current user is sitter, fetch children
            if (currentUserRole === "sitter") {
                setChildren(MOCK_CHILDREN);
            }

            setIsLoading(false);
        };
        fetchSession();
    }, [sessionId, currentUserRole]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white">
                <div className="container max-w-lg mx-auto px-4 py-6">
                    <Skeleton className="h-8 w-32 mb-6" />
                    <Card>
                        <CardContent className="p-6 space-y-4">
                            <Skeleton className="h-32 w-full" />
                            <Skeleton className="h-40 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white flex items-center justify-center">
                <div className="text-center">
                    <p className="text-muted-foreground">Oturum bulunamadı</p>
                    <Button variant="link" onClick={() => navigate(-1)}>
                        Geri Dön
                    </Button>
                </div>
            </div>
        );
    }

    // Determine reviewee based on current user
    const isParent = currentUserRole === "parent";
    const revieweeId = isParent ? session.sitterId : session.parentId;
    const revieweeName = isParent ? session.sitterName : session.parentName;
    const revieweePhoto = isParent ? session.sitterPhoto : session.parentPhoto;
    const revieweeRole: "parent" | "sitter" = isParent ? "sitter" : "parent";

    const alreadyReviewed = sessionId ? hasReviewed(sessionId) : false;
    const waitingForOther = alreadyReviewed && sessionReviewPair && !sessionReviewPair.bothSubmitted;

    const handleSubmit = async (rating: number, comment: string) => {
        if (!sessionId) return;

        await submitReview({
            sessionId,
            bookingId: session.bookingId,
            revieweeId,
            revieweeName,
            revieweeRole,
            rating,
            comment,
            reviewerName: currentUserName,
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white">
            <div className="container max-w-lg mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-xl font-semibold">Değerlendirme</h1>
                </div>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Star className="h-5 w-5 text-yellow-500" />
                            Oturum Değerlendirmesi
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        {alreadyReviewed ? (
                            <div className="py-8 text-center space-y-4">
                                {waitingForOther ? (
                                    <>
                                        <div className="h-20 w-20 mx-auto rounded-full bg-orange-100 flex items-center justify-center">
                                            <Clock className="h-10 w-10 text-orange-500" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-lg">Değerlendirmeniz gönderildi!</p>
                                            <p className="text-muted-foreground mt-2">
                                                {revieweeName} de değerlendirme gönderdiğinde her iki değerlendirme
                                                görünür olacak.
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="h-20 w-20 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                                            <CheckCircle className="h-10 w-10 text-green-500" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-lg">Değerlendirme Tamamlandı</p>
                                            <p className="text-muted-foreground mt-2">
                                                Bu oturum için değerlendirmeler görünür durumda.
                                            </p>
                                        </div>
                                    </>
                                )}
                                <Button onClick={() => navigate("/bookings")} className="mt-4">
                                    Randevularıma Git
                                </Button>
                            </div>
                        ) : (
                            // Use enhanced forms for detailed reviews
                            currentUserRole === "sitter" ? (
                                <SitterReviewForm
                                    sessionId={sessionId!}
                                    bookingId={session.bookingId}
                                    familyId={revieweeId}
                                    familyName={revieweeName}
                                    children={children}
                                    onSubmit={async (data) => {
                                        await submitDetailedReview(data);
                                        toast({
                                            title: "Teşekkürler! 🎉",
                                            description: "Değerlendirmeniz başarıyla kaydedildi.",
                                        });
                                        navigate("/bookings");
                                    }}
                                    onReportTrigger={() => {
                                        setShowReportModal(true);
                                    }}
                                    onCancel={() => navigate(-1)}
                                    isLoading={isSubmitting}
                                />
                            ) : (
                                <FamilyReviewForm
                                    sessionId={sessionId!}
                                    bookingId={session.bookingId}
                                    sitterId={revieweeId}
                                    sitterName={revieweeName}
                                    sitterPhoto={revieweePhoto}
                                    onSubmit={async (data) => {
                                        await submitDetailedReview(data);
                                        toast({
                                            title: "Teşekkürler! 🎉",
                                            description: "Değerlendirmeniz başarıyla kaydedildi.",
                                        });
                                        navigate("/bookings");
                                    }}
                                    onReportTrigger={() => {
                                        setShowReportModal(true);
                                    }}
                                    onCancel={() => navigate(-1)}
                                    isLoading={isSubmitting}
                                />
                            )
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
