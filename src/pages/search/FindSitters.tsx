/**
 * Find Sitters Page - Main search interface for parents (UPDATED with useFavorites)
 */

import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SitterCard } from "@/components/search/SitterCard";
import { SearchFilters, SearchFiltersType } from "@/components/search/SearchFilters";
import { SortDropdown, SortOption } from "@/components/search/SortDropdown";
import { useSearchSitters } from "@/hooks/useSearchSitters";
import { useFavorites } from "@/hooks/useFavorites";
import { Search, Grid3x3, Map, SlidersHorizontal, X, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { SitterMapView } from "@/components/search/SitterMapView";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

const DEFAULT_FILTERS: SearchFiltersType = {
    minRate: 450,
    maxRate: 2000,
    minRating: 0,
    languages: [],
    gender: undefined,
    skills: [],
    minAge: 18,
    maxAge: 35,
    joinQueue: false,
    availableNow: false,
};

export default function FindSitters() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [view, setView] = useState<"grid" | "map">("grid");
    const [filters, setFilters] = useState<SearchFiltersType>(DEFAULT_FILTERS);
    const [sortBy, setSortBy] = useState<SortOption>("relevance");
    const [page, setPage] = useState(1);

    const { sitters, totalCount, hasMore, isLoading } = useSearchSitters({
        filters,
        sortBy,
        searchQuery,
        page,
        pageSize: 20,
    });

    const { toggleFavorite, isFavorite, count: favoritesCount } = useFavorites();

    const handleViewProfile = (sitterId: string) => {
        navigate(`/sitters/${sitterId}`);
    };

    const handleClearFilters = () => {
        setFilters(DEFAULT_FILTERS);
        setSearchQuery("");
        setSortBy("relevance");
    };

    const handleLoadMore = () => {
        setPage((prev) => prev + 1);
    };

    return (
        <AppLayout>
            <div className="max-w-7xl mx-auto">
                {/* Search Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-3xl font-bold">Bakıcı Bul</h1>
                        {favoritesCount > 0 && (
                            <Button
                                variant="outline"
                                onClick={() => navigate("/favorites")}
                                className="gap-2"
                            >
                                <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                                Favorilerim
                                <Badge variant="secondary">{favoritesCount}</Badge>
                            </Button>
                        )}
                    </div>
                    <p className="text-muted-foreground">
                        Yakınınızdaki doğrulanmış üniversite öğrencisi bakıcıları keşfedin
                    </p>
                </div>

                {/* Search Bar and View Toggle */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder="İsim, üniversite veya bölüm ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    <div className="flex gap-2">
                        {/* Mobile Filters Trigger */}
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="md:hidden"
                                >
                                    <SlidersHorizontal className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-[300px] sm:w-[400px] overflow-y-auto">
                                <SheetHeader>
                                    <SheetTitle>Filtreler</SheetTitle>
                                </SheetHeader>
                                <div className="mt-4">
                                    <SearchFilters
                                        filters={filters}
                                        onFiltersChange={setFilters}
                                        onClearFilters={handleClearFilters}
                                    />
                                </div>
                            </SheetContent>
                        </Sheet>

                        <div className="flex border rounded-md">
                            <Button
                                variant={view === "grid" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setView("grid")}
                                className="rounded-r-none"
                            >
                                <Grid3x3 className="h-4 w-4 mr-2" />
                                Liste
                            </Button>
                            <Button
                                variant={view === "map" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setView("map")}
                                className="rounded-l-none"
                            >
                                <Map className="h-4 w-4 mr-2" />
                                Harita
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex gap-6">
                    {/* Filters Sidebar (Desktop Only) */}
                    <aside className="w-64 shrink-0 hidden md:block">
                        <div className="sticky top-4">
                            <SearchFilters
                                filters={filters}
                                onFiltersChange={setFilters}
                                onClearFilters={handleClearFilters}
                            />
                        </div>
                    </aside>

                    {/* Results Area */}
                    <main className="flex-1">
                        {/* Results Header */}
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm text-muted-foreground">
                                <span className="font-semibold text-foreground">
                                    {totalCount} bakıcı
                                </span>{" "}
                                bulundu
                            </p>
                            <SortDropdown value={sortBy} onChange={setSortBy} />
                        </div>

                        {/* Grid View */}
                        {view === "grid" && (
                            <>
                                {isLoading ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {[...Array(6)].map((_, i) => (
                                            <div
                                                key={i}
                                                className="h-[400px] bg-gray-100 animate-pulse rounded-lg"
                                            />
                                        ))}
                                    </div>
                                ) : sitters.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {sitters.map((sitter) => (
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
                                            <Search className="h-16 w-16 mx-auto text-muted-foreground/50" />
                                        </div>
                                        <h3 className="text-xl font-semibold mb-2">
                                            Sonuç bulunamadı
                                        </h3>
                                        <p className="text-muted-foreground mb-4">
                                            Arama kriterlerinize uygun bakıcı bulunamadı.
                                        </p>
                                        <Button variant="outline" onClick={handleClearFilters}>
                                            Filtreleri Temizle
                                        </Button>
                                    </div>
                                )}

                                {/* Load More Button */}
                                {hasMore && sitters.length > 0 && (
                                    <div className="mt-8 flex justify-center">
                                        <Button
                                            variant="outline"
                                            onClick={handleLoadMore}
                                            disabled={isLoading}
                                        >
                                            Daha Fazla Yükle
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Map View */}
                        {view === "map" && (
                            <SitterMapView
                                sitters={sitters}
                                onViewProfile={handleViewProfile}
                                onToggleFavorite={toggleFavorite}
                                isFavorite={isFavorite}
                            />
                        )}
                    </main>
                </div>
            </div>
        </AppLayout>
    );
}
