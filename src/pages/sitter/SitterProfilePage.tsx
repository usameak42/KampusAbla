/**
 * SitterProfilePage - Public sitter profile view
 */

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import {
    ArrowLeft,
    Heart,
    MessageCircle,
    Calendar,
    Star,
    Shield,
    GraduationCap,
    Clock,
    MapPin,
    Phone,
    CheckCircle,
    Award,
    Briefcase,
    Languages,
    Share2,
    Flag,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/hooks/useFavorites";
import { useToast } from "@/hooks/use-toast";
import { maskEmail, maskPhone } from "@/lib/privacy";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ReviewSummary } from "@/components/reviews/ReviewSummary";

type SitterProfile = {
    id: string;
    verification_status?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    full_name?: string | null;
    profile_photo_url?: string | null;
    isPremium?: boolean | null;
    rating?: number | null;
    review_count?: number | null;
    total_sessions?: number | null;
    response_time?: string | null;
    isOnline?: boolean | null;
    lastActive?: string | Date | null;
    bio?: string | null;
    university?: string | null;
    department?: string | null;
    year?: number | null;
    experience_years?: number | null;
    skills?: string[] | null;
    certificates?: string[] | null;
    languages?: string[] | null;
    responseRate?: number | null;
    response_rate?: number | null;
    created_at?: string | null;
    reviewCount?: number | null;
    hourlyRate?: number | null;
    is_available?: boolean | null;
};
import { useQuery } from "@tanstack/react-query";

export default function SitterProfilePage() {
    const { sitterId } = useParams<{ sitterId: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { isFavorite, toggleFavorite } = useFavorites();
    const { user } = useAuth();

    const { data: sitter, isLoading: isLoadingSitter } = useQuery({
        queryKey: ["sitter", sitterId],
        queryFn: async () => {
            if (!sitterId) return null;
            const { data, error } = await supabase
                .from("sitters")
                .select(`
                    id, 
                    full_name, 
                    profile_photo_url, 
                    verification_status, 
                    rating, 
                    review_count, 
                    bio, 
                    university, 
                    department, 
                    student_year, 
                    hourly_rate, 
                    is_available, 
                    created_at
                `)
                .eq("id", sitterId)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!sitterId,
    });

    const [showReportDialog, setShowReportDialog] = useState(false);
    const [reportReason, setReportReason] = useState("");
    const [isReporting, setIsReporting] = useState(false);

    if (isLoadingSitter) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!sitter) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-muted-foreground mb-4">Bakıcı bulunamadı</p>
                    <Button onClick={() => navigate(-1)}>Geri Dön</Button>
                </div>
            </div>
        );
    }

    const favorite = isFavorite(sitter.id);
    const isVerified = sitter.verification_status === "verified";
    const isOwnProfile = user?.id === sitter.id;
    const viewerRole = isOwnProfile ? "sitter" : "parent";

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: `${sitter.full_name} - KampusAbla`,
                url: window.location.href,
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast({
                title: "Link kopyalandı",
                description: "Profil linki panoya kopyalandı",
            });
        }
    };

    const handleReport = async () => {
        if (!reportReason.trim()) return;

        setIsReporting(true);
        // Mock API call
        await new Promise((r) => setTimeout(r, 1000));
        setIsReporting(false);
        setShowReportDialog(false);
        setReportReason("");

        toast({
            title: "Rapor gönderildi",
            description: "Bildiriminiz incelenecektir. Teşekkürler.",
        });
    };

    // Mock reviews data
    const reviews = [
        {
            id: "r1",
            parentName: "Ayşe K.",
            rating: 5,
            comment: "Harika bir bakıcı! Çocuklarımız onu çok seviyor.",
            date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
        },
        {
            id: "r2",
            parentName: "Mehmet Y.",
            rating: 5,
            comment: "Çok güvenilir ve sorumluluk sahibi. Kesinlikle tavsiye ederim.",
            date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
        },
        {
            id: "r3",
            parentName: "Fatma D.",
            rating: 4,
            comment: "İyi bir deneyimdi, çocuklar eğlendi.",
            date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20),
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-white pb-24">
            <div className="container max-w-3xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={handleShare}>
                            <Share2 className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleFavorite(sitter.id)}
                        >
                            <Heart
                                className={cn(
                                    "h-5 w-5",
                                    favorite && "fill-red-500 text-red-500"
                                )}
                            />
                        </Button>
                    </div>
                </div>

                {/* Profile Header */}
                <Card className="mb-6 overflow-hidden">
                    <div className="h-20 bg-gradient-to-r from-purple-500 to-violet-600" />
                    <CardContent className="pt-0 -mt-10">
                        <div className="flex flex-col items-center text-center">
                            <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                                <AvatarImage src={sitter.profile_photo_url} loading="lazy" />
                                <AvatarFallback className="text-2xl">
                                    {sitter.full_name?.[0]}
                                </AvatarFallback>
                            </Avatar>

                            <h1 className="text-xl font-bold mt-3">
                                {sitter.full_name}
                            </h1>

                            <div className="flex items-center gap-2 mt-1">
                                {isVerified && (
                                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                                        <Shield className="h-3 w-3 mr-1" />
                                        Doğrulanmış
                                    </Badge>
                                )}
                            </div>

                            {/* Quick Stats */}
                            <div className="flex items-center gap-4 mt-4 text-sm">
                                <div className="flex items-center gap-1">
                                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                                    <span className="font-medium">{sitter.rating || "5.0"}</span>
                                    <span className="text-muted-foreground">
                                        ({sitter.review_count || 0})
                                    </span>
                                </div>
                                <Separator orientation="vertical" className="h-4" />
                                <div className="flex items-center gap-1 text-muted-foreground">
                                    <Briefcase className="h-4 w-4" />
                                    <span>{sitter.review_count || 0} seans</span>
                                </div>
                                <Separator orientation="vertical" className="h-4" />
                                <div className="flex items-center gap-1 text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    <span>Hızlı</span>
                                </div>
                            </div>

                            {/* Online Status */}
                            <div className="flex items-center gap-1.5 mt-3">
                                <div
                                    className={cn(
                                        "h-2 w-2 rounded-full",
                                        sitter.is_available ? "bg-green-500" : "bg-gray-300"
                                    )}
                                />
                                <span className="text-xs text-muted-foreground">
                                    {sitter.is_available
                                        ? "Müsait"
                                        : "Müsait değil"}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Tabs defaultValue="about" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="about">Hakkında</TabsTrigger>
                        <TabsTrigger value="reviews">Değerlendirmeler</TabsTrigger>
                        <TabsTrigger value="availability">Uygunluk</TabsTrigger>
                    </TabsList>

                    {/* About Tab */}
                    <TabsContent value="about" className="space-y-4">
                        {/* Bio */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">Hakkımda</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    {sitter.bio?.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, (m) => maskEmail(m))
                                        .replace(/(\+?\d[\d\s-]{8,}\d)/g, (m) => maskPhone(m))}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Education */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <GraduationCap className="h-4 w-4" />
                                    Eğitim
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="font-medium">{sitter.university}</p>
                                <p className="text-sm text-muted-foreground">
                                    {sitter.department} {sitter.student_year ? `- ${sitter.student_year}. Sınıf` : ""}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Experience & Skills */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">Deneyim & Beceriler</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        Deneyimli Bakıcı
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {["Çocuk Bakımı", "Oyun", "Ödev Yardımı"].map((skill: string) => (
                                            <Badge key={skill} variant="secondary">
                                                {skill}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Languages */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Languages className="h-4 w-4" />
                                    Diller
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-1.5">
                                    {["Türkçe"].map((lang: string) => (
                                        <Badge key={lang} variant="outline">
                                            {lang}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Stats */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">İstatistikler</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-muted-foreground">Yanıt Oranı</span>
                                        <span className="font-medium">100%</span>
                                    </div>
                                    <Progress value={100} className="h-2" />
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Üye Olma Tarihi</span>
                                    <span>
                                        {sitter.created_at ? format(new Date(sitter.created_at), "MMMM yyyy", { locale: tr }) : "Ocak 2026"}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Reviews Tab */}
                    <TabsContent value="reviews" className="space-y-4">
                        <ReviewSummary
                            role={viewerRole}
                            rating={sitter.rating || 0}
                            reviewCount={sitter.review_count || 0}
                            reviews={reviews}
                        />
                        <Card>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base">
                                        Değerlendirmeler ({sitter.review_count || 0})
                                    </CardTitle>
                                    <Button
                                        variant="link"
                                        size="sm"
                                        className="h-auto p-0"
                                        onClick={() => navigate(`/reviews/${sitter.id}`)}
                                    >
                                        Tümünü Gör
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {/* Rating Summary */}
                                <div className="flex items-center gap-4 mb-4 pb-4 border-b">
                                    <div className="text-center">
                                        <div className="text-3xl font-bold">{sitter.rating}</div>
                                        <div className="flex gap-0.5">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    className={cn(
                                                        "h-3 w-3",
                                                        star <= Math.round(sitter.rating)
                                                            ? "text-amber-500 fill-amber-500"
                                                            : "text-gray-300"
                                                    )}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {sitter.review_count || 0} değerlendirme
                                    </div>
                                </div>

                                {/* Recent Reviews */}
                                <div className="space-y-4">
                                    {reviews.map((review) => (
                                        <div key={review.id} className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-sm">
                                                        {review.parentName}
                                                    </span>
                                                    <div className="flex gap-0.5">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <Star
                                                                key={star}
                                                                className={cn(
                                                                    "h-3 w-3",
                                                                    star <= review.rating
                                                                        ? "text-amber-500 fill-amber-500"
                                                                        : "text-gray-300"
                                                                )}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                                <span className="text-xs text-muted-foreground">
                                                    {formatDistanceToNow(review.date, {
                                                        addSuffix: true,
                                                        locale: tr,
                                                    })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {review.comment}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Availability Tab */}
                    <TabsContent value="availability" className="space-y-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">Haftalık Uygunluk</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"].map(
                                        (day, index) => {
                                            const available = index < 5 || index === 6;
                                            return (
                                                <div
                                                    key={day}
                                                    className="flex items-center justify-between py-2 border-b last:border-0"
                                                >
                                                    <span className="font-medium text-sm">{day}</span>
                                                    {available ? (
                                                        <Badge variant="secondary" className="text-green-600 bg-green-50">
                                                            09:00 - 18:00
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-muted-foreground">
                                                            Müsait Değil
                                                        </Badge>
                                                    )}
                                                </div>
                                            );
                                        }
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Report Button */}
                <div className="text-center mt-6">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground"
                        onClick={() => setShowReportDialog(true)}
                    >
                        <Flag className="h-4 w-4 mr-1" />
                        Profili Bildir
                    </Button>
                </div>
            </div>

            {/* Sticky Bottom CTA */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
                <div className="container max-w-3xl mx-auto flex items-center justify-between gap-4">
                    <div>
                        <p className="font-bold text-lg">₺{sitter.hourly_rate || 150}/saat</p>
                        <p className="text-xs text-muted-foreground">
                            {sitter.is_available ? "Hemen müsait" : "Takvimi kontrol et"}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => navigate(`/messages?sitter=${sitter.id}`)}
                        >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Mesaj
                        </Button>
                        <Button
                            className="bg-gradient-to-r from-purple-500 to-violet-500"
                            onClick={() => navigate(`/book/${sitter.id}`)}
                        >
                            <Calendar className="h-4 w-4 mr-2" />
                            Rezervasyon
                        </Button>
                    </div>
                </div>
            </div>

            {/* Report Dialog */}
            <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Profili Bildir</DialogTitle>
                        <DialogDescription>
                            Bu profille ilgili bir sorun mu yaşıyorsunuz?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Bildirim Sebebi</Label>
                            <Textarea
                                value={reportReason}
                                onChange={(e) => setReportReason(e.target.value)}
                                placeholder="Lütfen sorunu detaylı bir şekilde açıklayın..."
                                rows={4}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowReportDialog(false)}
                        >
                            İptal
                        </Button>
                        <Button
                            onClick={handleReport}
                            disabled={!reportReason.trim() || isReporting}
                        >
                            {isReporting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Gönder
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
