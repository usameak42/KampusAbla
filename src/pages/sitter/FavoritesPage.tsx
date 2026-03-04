/**
 * FavoritesPage - List of saved/favorite sitters
 */

import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import {
    ArrowLeft,
    Heart,
    Star,
    Shield,
    MessageCircle,
    Calendar,
    ChevronRight,
    Trash2,
    GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/hooks/useFavorites";
import { MOCK_SITTERS, getBadgeInfo } from "@/types/sitter";
import type { SitterProfile } from "@/types/sitter";

export default function FavoritesPage() {
    const navigate = useNavigate();
    const { favorites, toggleFavorite, count } = useFavorites();

    // Get full sitter profiles for favorites
    const favoriteSitters: SitterProfile[] = MOCK_SITTERS.filter((s) =>
        favorites.includes(s.id)
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-white">
            <div className="container max-w-3xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-semibold flex items-center gap-2">
                            <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                            Favorilerim
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {count} kayıtlı bakıcı
                        </p>
                    </div>
                </div>

                {/* Content */}
                {favoriteSitters.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="font-medium mb-2">Henüz favori bakıcınız yok</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Beğendiğiniz bakıcıları favorilere ekleyerek kolayca ulaşın
                            </p>
                            <Button onClick={() => navigate("/")}>
                                Bakıcıları Keşfet
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {favoriteSitters.map((sitter) => {
                            const badgeInfo = sitter.isVerified
                                ? { label: "Doğrulanmış", color: "bg-green-100 text-green-700" }
                                : null;

                            return (
                                <Card
                                    key={sitter.id}
                                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => navigate(`/sitter/${sitter.id}`)}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex gap-4">
                                            {/* Avatar */}
                                            <div className="relative">
                                                <Avatar className="h-16 w-16">
                                                    <AvatarImage src={sitter.photo} />
                                                    <AvatarFallback>
                                                        {sitter.firstName[0]}{sitter.lastName[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div
                                                    className={cn(
                                                        "absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white",
                                                        sitter.isOnline ? "bg-green-500" : "bg-gray-300"
                                                    )}
                                                />
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold truncate">
                                                        {sitter.firstName} {sitter.lastName.charAt(0)}.
                                                    </h3>
                                                    {badgeInfo && (
                                                        <Badge className={cn("text-xs", badgeInfo.color)}>
                                                            <Shield className="h-3 w-3 mr-0.5" />
                                                            {badgeInfo.label}
                                                        </Badge>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                                    <div className="flex items-center gap-1">
                                                        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                                                        <span>{sitter.rating}</span>
                                                        <span className="text-xs">({sitter.reviewCount})</span>
                                                    </div>
                                                    <span>•</span>
                                                    <span>{sitter.completedSessions} seans</span>
                                                </div>

                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <GraduationCap className="h-3 w-3" />
                                                    <span className="truncate">
                                                        {sitter.university} - {sitter.department}
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between mt-3">
                                                    <p className="font-semibold text-purple-600">
                                                        ₺{sitter.hourlyRate}/saat
                                                    </p>
                                                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0"
                                                            onClick={() => navigate(`/messages?sitter=${sitter.id}`)}
                                                        >
                                                            <MessageCircle className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0"
                                                            onClick={() => navigate(`/book/${sitter.id}`)}
                                                        >
                                                            <Calendar className="h-4 w-4" />
                                                        </Button>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>
                                                                        Favorilerden Çıkar
                                                                    </AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        {sitter.firstName} isimli bakıcıyı
                                                                        favorilerinizden çıkarmak istediğinize
                                                                        emin misiniz?
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={() => toggleFavorite(sitter.id)}
                                                                        className="bg-red-600 hover:bg-red-700"
                                                                    >
                                                                        Çıkar
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </div>
                                            </div>

                                            <ChevronRight className="h-5 w-5 text-muted-foreground self-center" />
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
