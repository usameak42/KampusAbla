/**
 * Need Post Card Component - Displays a single need post
 * Used by both parents (to view their posts) and sitters (to browse needs)
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
    MapPin,
    Calendar,
    Clock,
    Users,
    MessageSquare,
    BookOpen,
    Car,
    Banknote,
    Timer
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

export interface NeedPost {
    id: string;
    parentId: string;
    parentName: string;
    parentPhoto?: string;
    title: string;
    description?: string;
    needDate: Date;
    startTime: string;
    durationHours: number;
    childrenCount: number;
    childrenAges: number[];
    languageGoal?: string;
    homeworkHelp: boolean;

    address: string;
    district: string;
    hourlyRateOffered: number;
    status: "open" | "matched" | "cancelled" | "expired";
    applicationsCount: number;
    createdAt: Date;
}

interface NeedPostCardProps {
    needPost: NeedPost;
    viewMode: "parent" | "sitter";
    onApply?: () => void;
    onViewApplications?: () => void;
    onEdit?: () => void;
    onCancel?: () => void;
    hasApplied?: boolean;
}

export function NeedPostCard({
    needPost,
    viewMode,
    onApply,
    onViewApplications,
    onEdit,
    onCancel,
    hasApplied = false,
}: NeedPostCardProps) {
    const isOpen = needPost.status === "open";
    const totalAmount = needPost.hourlyRateOffered * needPost.durationHours;

    // Format date for display
    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat("tr-TR", {
            day: "numeric",
            month: "long",
            year: "numeric",
        }).format(date);
    };

    // Format time range
    const formatTimeRange = () => {
        const [hours, minutes] = needPost.startTime.split(":").map(Number);
        const endHours = hours + Math.floor(needPost.durationHours);
        const endMinutes = minutes + ((needPost.durationHours % 1) * 60);

        const startStr = needPost.startTime;
        const endStr = `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`;

        return `${startStr} - ${endStr}`;
    };

    // Format children ages
    const formatChildrenAges = () => {
        if (needPost.childrenAges.length === 0) return "";
        if (needPost.childrenAges.length === 1) return `${needPost.childrenAges[0]} yaş`;
        return needPost.childrenAges.join(", ") + " yaş";
    };

    // Status badge color
    const getStatusColor = () => {
        switch (needPost.status) {
            case "open": return "bg-green-100 text-green-700 border-green-200";
            case "matched": return "bg-blue-100 text-blue-700 border-blue-200";
            case "cancelled": return "bg-red-100 text-red-700 border-red-200";
            case "expired": return "bg-gray-100 text-gray-700 border-gray-200";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    const getStatusText = () => {
        switch (needPost.status) {
            case "open": return "Açık";
            case "matched": return "Eşleşti";
            case "cancelled": return "İptal Edildi";
            case "expired": return "Süresi Doldu";
            default: return needPost.status;
        }
    };

    return (
        <Card className={`hover:shadow-lg transition-shadow ${!isOpen ? "opacity-75" : ""}`}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h3 className="font-semibold text-lg line-clamp-1">
                            {needPost.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>{needPost.district}</span>
                            <span className="text-gray-300">•</span>
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{formatDate(needPost.needDate)}</span>
                        </div>
                    </div>
                    <Badge variant="outline" className={getStatusColor()}>
                        {getStatusText()}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Time & Duration */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="font-medium">{formatTimeRange()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Timer className="h-4 w-4" />
                        <span>{needPost.durationHours} saat</span>
                    </div>
                </div>

                {/* Rate & Total */}
                <div className="flex items-center gap-4 p-3 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg">
                    <div className="flex items-center gap-2">
                        <Banknote className="h-5 w-5 text-primary" />
                        <span className="font-bold text-lg text-primary">
                            ₺{needPost.hourlyRateOffered}/saat
                        </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Toplam: <span className="font-semibold text-foreground">₺{totalAmount}</span>
                    </div>
                </div>

                {/* Children Info */}
                <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span>
                        {needPost.childrenCount} çocuk
                        {needPost.childrenAges.length > 0 && (
                            <span className="text-muted-foreground"> ({formatChildrenAges()})</span>
                        )}
                    </span>
                </div>

                {/* Features */}
                <div className="flex flex-wrap gap-2">

                    {needPost.homeworkHelp && (
                        <Badge variant="secondary" className="text-xs">
                            <BookOpen className="h-3 w-3 mr-1" />
                            Ödev Yardımı
                        </Badge>
                    )}
                    {needPost.languageGoal && (
                        <Badge variant="secondary" className="text-xs">
                            🌐 {needPost.languageGoal}
                        </Badge>
                    )}
                </div>

                {/* Description Preview */}
                {needPost.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                        "{needPost.description}"
                    </p>
                )}

                {/* Meta Info */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                    <div className="flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>{needPost.applicationsCount} başvuru</span>
                    </div>
                    <span>
                        {formatDistanceToNow(needPost.createdAt, {
                            addSuffix: true,
                            locale: tr
                        })}
                    </span>
                </div>
            </CardContent>

            <CardFooter className="pt-0">
                {viewMode === "sitter" && isOpen && (
                    <Button
                        className="w-full"
                        onClick={onApply}
                        disabled={hasApplied}
                    >
                        {hasApplied ? "Başvuruldu ✓" : "Başvur"}
                    </Button>
                )}

                {viewMode === "parent" && (
                    <div className="flex gap-2 w-full">
                        {isOpen && (
                            <>
                                {needPost.applicationsCount > 0 ? (
                                    <Button
                                        className="flex-1"
                                        onClick={onViewApplications}
                                    >
                                        Başvuruları Gör ({needPost.applicationsCount})
                                    </Button>
                                ) : (
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={onEdit}
                                    >
                                        Düzenle
                                    </Button>
                                )}
                                <Button
                                    variant="destructive"
                                    className={needPost.applicationsCount > 0 ? "w-10 px-0" : "flex-1"}
                                    onClick={onCancel}
                                    title="İlanı İptal Et"
                                >
                                    {needPost.applicationsCount > 0 ? "X" : "İptal Et"}
                                </Button>
                            </>
                        )}
                    </div>
                )}
            </CardFooter>
        </Card>
    );
}
