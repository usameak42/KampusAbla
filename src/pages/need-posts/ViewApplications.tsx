/**
 * View Applications Page - Parent reviews applications for a specific need post
 */

import { useParams, useNavigate } from "react-router-dom";
import { ApplicationsList } from "@/components/need-posts/ApplicationsList";
import { useApplications } from "@/hooks/useApplications";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    ArrowLeft,
    Calendar,
    Clock,
    MapPin,
    Users,
    Banknote,
    RefreshCw,
    CheckCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

// Mock need post data - would come from API/context
const MOCK_NEED_POST = {
    id: "1",
    title: "2 çocuğum için öğleden sonra bakıcı arıyorum",
    needDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    startTime: "14:00",
    durationHours: 4,
    childrenCount: 2,
    childrenAges: [5, 8],
    district: "Beşiktaş",
    hourlyRateOffered: 100,
    status: "open" as const,
};

export default function ViewApplications() {
    const { needPostId } = useParams<{ needPostId: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();

    const {
        applications,
        isLoading,
        stats,
        acceptApplication,
        rejectApplication,
        refreshApplications,
    } = useApplications({ needPostId: needPostId || "1" });

    const needPost = MOCK_NEED_POST; // Would fetch based on needPostId
    const totalAmount = needPost.hourlyRateOffered * needPost.durationHours;

    const handleAccept = async (applicationId: string) => {
        try {
            await acceptApplication(applicationId);
            toast({
                title: "Başvuru Kabul Edildi! ✓",
                description: "Bakıcı ile iletişime geçebilirsiniz. Diğer başvurular otomatik olarak reddedildi.",
            });
        } catch {
            toast({
                title: "Hata",
                description: "Başvuru kabul edilemedi. Lütfen tekrar deneyin.",
                variant: "destructive",
            });
        }
    };

    const handleReject = async (applicationId: string) => {
        try {
            await rejectApplication(applicationId);
            toast({
                title: "Başvuru Reddedildi",
                description: "Başvuru reddedildi.",
            });
        } catch {
            toast({
                title: "Hata",
                description: "Başvuru reddedilemedi. Lütfen tekrar deneyin.",
                variant: "destructive",
            });
        }
    };

    const handleViewProfile = (sitterId: string) => {
        navigate(`/sitters/${sitterId}`);
    };

    const handleMessage = (sitterId: string) => {
        navigate(`/messages?recipientId=${sitterId}`);
    };

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Back Button */}
            <Button
                variant="ghost"
                className="gap-2"
                onClick={() => navigate("/my-needs")}
            >
                <ArrowLeft className="h-4 w-4" />
                İlanlarıma Dön
            </Button>

            {/* Need Post Summary */}
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle className="text-xl">{needPost.title}</CardTitle>
                            <CardDescription className="mt-1">
                                Bu ilana gelen başvuruları inceleyin ve uygun bakıcıyı seçin
                            </CardDescription>
                        </div>
                        <Badge
                            variant={needPost.status === "open" ? "default" : "secondary"}
                            className={needPost.status === "open" ? "bg-green-500" : ""}
                        >
                            {needPost.status === "open" ? "Açık" : "Eşleşti"}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{format(needPost.needDate, "d MMM", { locale: tr })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{needPost.startTime} ({needPost.durationHours} saat)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{needPost.district}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{needPost.childrenCount} çocuk</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Banknote className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">₺{needPost.hourlyRateOffered}/saat</span>
                            <span className="text-muted-foreground">(₺{totalAmount})</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Header with refresh */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Başvurular</h2>
                    <p className="text-muted-foreground">
                        {stats.total} başvuru • {stats.pending} bekliyor
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={refreshApplications}
                    disabled={isLoading}
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                    Yenile
                </Button>
            </div>

            {/* Accepted Alert */}
            {stats.accepted > 0 && (
                <Card className="bg-green-50 border-green-200">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                            <div>
                                <p className="font-medium text-green-700">
                                    Bakıcı seçildi!
                                </p>
                                <p className="text-sm text-green-600">
                                    Seçtiğiniz bakıcı ile mesajlaşarak detayları konuşabilirsiniz.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Applications List */}
            <ApplicationsList
                applications={applications}
                onAccept={handleAccept}
                onReject={handleReject}
                onViewProfile={handleViewProfile}
                onMessage={handleMessage}
                isLoading={isLoading}
            />
        </div>
    );
}
