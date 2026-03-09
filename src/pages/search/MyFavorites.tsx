/**
 * My Favorites Page - View and manage favorite sitters
 */

import { AppLayout } from "@/components/layout/AppLayout";
import { SitterCard } from "@/components/search/SitterCard";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/useFavorites";
import { useSearchSitters, Sitter } from "@/hooks/useSearchSitters";
import { Heart, ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";

export default function MyFavorites() {
    const navigate = useNavigate();
    const { favorites, isLoading: favoritesLoading, toggleFavorite, isFavorite } = useFavorites();

    // Get all sitters to filter favorites
    const { sitters: allSitters } = useSearchSitters({
        filters: {
            minRate: 450,
            maxRate: 2000,
            minRating: 0,
            languages: [],
            availableNow: false,
            joinQueue: false,
            skills: [],
            minAge: 18,
            maxAge: 99,
        },
        sortBy: "relevance",
        searchQuery: "",
        page: 1,
        pageSize: 100, // Get all for filtering
    });

    // Filter to show only favorited sitters
    const favoriteSitters = useMemo(() => {
        return allSitters.filter((sitter: Sitter) => favorites.includes(sitter.id));
    }, [allSitters, favorites]);

    const handleViewProfile = (sitterId: string) => {
        navigate(`/sitters/${sitterId}`);
    };

    if (favoritesLoading) {
        return (
            <AppLayout>
                <div className="flex justify-center items-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Button
                        variant="ghost"
                        className="mb-4"
                        onClick={() => navigate("/search")}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Aramaya Dön
                    </Button>

                    <div className="flex items-center gap-3 mb-2">
                        <Heart className="h-8 w-8 text-red-500 fill-red-500" />
                        <h1 className="text-3xl font-bold">Favorilerim</h1>
                    </div>
                    <p className="text-muted-foreground">
                        {favoriteSitters.length > 0
                            ? `${favoriteSitters.length} favori bakıcınız var`
                            : "Henüz favori bakıcınız yok"}
                    </p>
                </div>

                {/* Content */}
                {favoriteSitters.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {favoriteSitters.map((sitter) => (
                            <SitterCard
                                key={sitter.id}
                                sitter={sitter}
                                onViewProfile={handleViewProfile}
                                onToggleFavorite={toggleFavorite}
                                isFavorited={isFavorite(sitter.id)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="mb-4">
                            <Heart className="h-16 w-16 mx-auto text-muted-foreground/50" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">
                            Henüz favori yok
                        </h3>
                        <p className="text-muted-foreground mb-6">
                            Beğendiğiniz bakıcıları favorilere ekleyerek kolayca erişebilirsiniz
                        </p>
                        <Button onClick={() => navigate("/search")}>
                            Bakıcı Ara
                        </Button>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
