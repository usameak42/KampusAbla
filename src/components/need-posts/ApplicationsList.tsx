/**
 * Applications List Component - Parent reviews applications for a need post
 */

import { useState, useMemo } from "react";
import { ApplicationCard, type Application } from "./ApplicationCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Users,
    CheckCircle,
    XCircle,
    Clock,
    Star,
    TrendingUp,
    Filter,
} from "lucide-react";

interface ApplicationsListProps {
    applications: Application[];
    onAccept: (applicationId: string) => Promise<void>;
    onReject: (applicationId: string) => Promise<void>;
    onViewProfile: (sitterId: string) => void;
    onMessage: (sitterId: string) => void;
    isLoading?: boolean;
}

type SortOption = "newest" | "rating" | "sessions" | "rate-low" | "rate-high";

export function ApplicationsList({
    applications,
    onAccept,
    onReject,
    onViewProfile,
    onMessage,
    isLoading = false,
}: ApplicationsListProps) {
    const [activeTab, setActiveTab] = useState<"pending" | "accepted" | "rejected">("pending");
    const [sortBy, setSortBy] = useState<SortOption>("newest");
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Filter by status
    const pendingApps = applications.filter(a => a.status === "pending");
    const acceptedApps = applications.filter(a => a.status === "accepted");
    const rejectedApps = applications.filter(a => a.status === "rejected");

    // Sort applications
    const sortApplications = (apps: Application[]) => {
        return [...apps].sort((a, b) => {
            switch (sortBy) {
                case "rating":
                    return b.sitterRating - a.sitterRating;
                case "sessions":
                    return b.sitterCompletedSessions - a.sitterCompletedSessions;
                case "rate-low":
                    return (a.proposedRate || a.originalRate) - (b.proposedRate || b.originalRate);
                case "rate-high":
                    return (b.proposedRate || b.originalRate) - (a.proposedRate || a.originalRate);
                case "newest":
                default:
                    return b.createdAt.getTime() - a.createdAt.getTime();
            }
        });
    };

    const currentApps = useMemo(() => {
        switch (activeTab) {
            case "accepted": return sortApplications(acceptedApps);
            case "rejected": return sortApplications(rejectedApps);
            default: return sortApplications(pendingApps);
        }
    }, [activeTab, sortBy, applications]);

    const handleAccept = async (applicationId: string) => {
        setProcessingId(applicationId);
        try {
            await onAccept(applicationId);
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (applicationId: string) => {
        setProcessingId(applicationId);
        try {
            await onReject(applicationId);
        } finally {
            setProcessingId(null);
        }
    };

    // Stats
    const avgRating = pendingApps.length > 0
        ? (pendingApps.reduce((sum, a) => sum + a.sitterRating, 0) / pendingApps.length).toFixed(1)
        : "—";
    const avgSessions = pendingApps.length > 0
        ? Math.round(pendingApps.reduce((sum, a) => sum + a.sitterCompletedSessions, 0) / pendingApps.length)
        : "—";

    return (
        <div className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-yellow-500" />
                            <div>
                                <p className="text-2xl font-bold">{pendingApps.length}</p>
                                <p className="text-xs text-muted-foreground">Bekleyen</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <div>
                                <p className="text-2xl font-bold">{acceptedApps.length}</p>
                                <p className="text-xs text-muted-foreground">Kabul Edilen</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                            <Star className="h-5 w-5 text-yellow-400" />
                            <div>
                                <p className="text-2xl font-bold">{avgRating}</p>
                                <p className="text-xs text-muted-foreground">Ort. Puan</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-blue-500" />
                            <div>
                                <p className="text-2xl font-bold">{avgSessions}</p>
                                <p className="text-xs text-muted-foreground">Ort. Seans</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs & Sort */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
                    <TabsList>
                        <TabsTrigger value="pending" className="gap-2">
                            <Clock className="h-4 w-4" />
                            Bekleyen
                            {pendingApps.length > 0 && (
                                <Badge variant="secondary">{pendingApps.length}</Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="accepted" className="gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Kabul Edilen
                            {acceptedApps.length > 0 && (
                                <Badge variant="secondary">{acceptedApps.length}</Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="rejected" className="gap-2">
                            <XCircle className="h-4 w-4" />
                            Reddedilen
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={sortBy} onValueChange={(v: SortOption) => setSortBy(v)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Sırala" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="newest">En Yeni</SelectItem>
                            <SelectItem value="rating">En Yüksek Puan</SelectItem>
                            <SelectItem value="sessions">En Deneyimli</SelectItem>
                            <SelectItem value="rate-low">En Düşük Ücret</SelectItem>
                            <SelectItem value="rate-high">En Yüksek Ücret</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Applications Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <CardHeader>
                                <div className="flex gap-4">
                                    <div className="h-14 w-14 bg-muted rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-5 bg-muted rounded w-1/2" />
                                        <div className="h-4 bg-muted rounded w-3/4" />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="h-16 bg-muted rounded" />
                                <div className="h-10 bg-muted rounded" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : currentApps.length === 0 ? (
                <Card className="p-8 text-center">
                    <div className="text-4xl mb-4">
                        {activeTab === "pending" ? "📭" : activeTab === "accepted" ? "✅" : "❌"}
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                        {activeTab === "pending" && "Henüz Başvuru Yok"}
                        {activeTab === "accepted" && "Kabul Edilen Başvuru Yok"}
                        {activeTab === "rejected" && "Reddedilen Başvuru Yok"}
                    </h3>
                    <p className="text-muted-foreground">
                        {activeTab === "pending" && "Bakıcılar ilanınıza başvurduğunda burada görünecek"}
                        {activeTab === "accepted" && "Kabul ettiğiniz başvurular burada görünecek"}
                        {activeTab === "rejected" && "Reddettiğiniz başvurular burada görünecek"}
                    </p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {currentApps.map((application) => (
                        <ApplicationCard
                            key={application.id}
                            application={application}
                            onAccept={handleAccept}
                            onReject={handleReject}
                            onViewProfile={onViewProfile}
                            onMessage={onMessage}
                            isProcessing={processingId === application.id}
                        />
                    ))}
                </div>
            )}

            {/* Recommendation for pending */}
            {activeTab === "pending" && pendingApps.length > 0 && (
                <Card className="bg-blue-50 border-blue-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base text-blue-700 flex items-center gap-2">
                            💡 Öneri
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-blue-600">
                            Başvuruları değerlendirirken bakıcının puan ortalaması, tamamlanan seans sayısı
                            ve rozet seviyesine dikkat edin. Altın ve platin rozetli bakıcılar kapsamlı
                            doğrulama sürecinden geçmiştir.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
