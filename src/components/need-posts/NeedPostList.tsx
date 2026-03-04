/**
 * Need Post List Component - Browse and filter need posts
 * Used by sitters to find available childcare opportunities
 */

import { useState, useMemo } from "react";
import { NeedPostCard, type NeedPost } from "./NeedPostCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
    Search,
    Filter,
    MapPin,
    Calendar,
    Banknote,
    ChevronDown,
    ChevronUp,
    RefreshCw,
    SlidersHorizontal,
    X,
} from "lucide-react";

interface NeedPostListProps {
    needPosts: NeedPost[];
    viewMode: "sitter" | "parent";
    onApply?: (needPostId: string) => void;
    onViewApplications?: (needPostId: string) => void;
    onEdit?: (needPostId: string) => void;
    onCancel?: (needPostId: string) => void;
    appliedPostIds?: string[];
    isLoading?: boolean;
}

const DISTRICTS = [
    "Tümü",
    "Beşiktaş",
    "Kadıköy",
    "Şişli",
    "Bakırköy",
    "Üsküdar",
    "Sarıyer",
    "Ataşehir",
    "Maltepe",
];

type SortOption = "newest" | "oldest" | "rate-high" | "rate-low" | "date-soon";

export function NeedPostList({
    needPosts,
    viewMode,
    onApply,
    onViewApplications,
    onEdit,
    onCancel,
    appliedPostIds = [],
    isLoading = false,
}: NeedPostListProps) {
    // Filter state
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDistrict, setSelectedDistrict] = useState("Tümü");
    const [minRate, setMinRate] = useState(50);
    const [maxRate, setMaxRate] = useState(300);

    const [showHomeworkOnly, setShowHomeworkOnly] = useState(false);
    const [sortBy, setSortBy] = useState<SortOption>("newest");
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);

    // Active filters count
    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (selectedDistrict !== "Tümü") count++;
        if (minRate > 50 || maxRate < 300) count++;

        if (showHomeworkOnly) count++;
        if (searchQuery) count++;
        return count;
    }, [selectedDistrict, minRate, maxRate, showHomeworkOnly, searchQuery]);

    // Filter and sort posts
    const filteredPosts = useMemo(() => {
        let result = [...needPosts];

        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (post) =>
                    post.title.toLowerCase().includes(query) ||
                    post.description?.toLowerCase().includes(query) ||
                    post.district.toLowerCase().includes(query)
            );
        }

        // Filter by district
        if (selectedDistrict !== "Tümü") {
            result = result.filter((post) => post.district === selectedDistrict);
        }

        // Filter by rate
        result = result.filter(
            (post) =>
                post.hourlyRateOffered >= minRate && post.hourlyRateOffered <= maxRate
        );



        // Filter by homework help
        if (showHomeworkOnly) {
            result = result.filter((post) => post.homeworkHelp);
        }

        // Sort
        switch (sortBy) {
            case "newest":
                result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
                break;
            case "oldest":
                result.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
                break;
            case "rate-high":
                result.sort((a, b) => b.hourlyRateOffered - a.hourlyRateOffered);
                break;
            case "rate-low":
                result.sort((a, b) => a.hourlyRateOffered - b.hourlyRateOffered);
                break;
            case "date-soon":
                result.sort((a, b) => a.needDate.getTime() - b.needDate.getTime());
                break;
        }

        return result;
    }, [
        needPosts,
        searchQuery,
        selectedDistrict,
        minRate,
        maxRate,

        showHomeworkOnly,
        sortBy,
    ]);

    // Clear all filters
    const clearFilters = () => {
        setSearchQuery("");
        setSelectedDistrict("Tümü");
        setMinRate(50);
        setMaxRate(300);

        setShowHomeworkOnly(false);
        setSortBy("newest");
    };

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="İlan ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        </button>
                    )}
                </div>
                <Button
                    variant="outline"
                    onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                    className="relative"
                >
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filtreler
                    {activeFiltersCount > 0 && (
                        <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                            {activeFiltersCount}
                        </Badge>
                    )}
                </Button>
            </div>

            {/* Filters Panel */}
            <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                <CollapsibleContent>
                    <Card>
                        <CardHeader className="py-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Filter className="h-4 w-4" />
                                    Filtreler
                                </CardTitle>
                                {activeFiltersCount > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={clearFilters}
                                    >
                                        <RefreshCw className="h-3 w-3 mr-1" />
                                        Temizle
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* District */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        İlçe
                                    </Label>
                                    <Select
                                        value={selectedDistrict}
                                        onValueChange={setSelectedDistrict}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {DISTRICTS.map((district) => (
                                                <SelectItem key={district} value={district}>
                                                    {district}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Banknote className="h-4 w-4" />
                                        Ücret Aralığı: ₺{minRate} - ₺{maxRate}
                                    </Label>
                                    <div className="pt-2 px-1">
                                        <Slider
                                            value={[minRate, maxRate]}
                                            onValueChange={([min, max]) => {
                                                setMinRate(min);
                                                setMaxRate(max);
                                            }}
                                            min={50}
                                            max={300}
                                            step={10}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Sıralama
                                    </Label>
                                    <Select
                                        value={sortBy}
                                        onValueChange={(value: SortOption) => setSortBy(value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="newest">En Yeni</SelectItem>
                                            <SelectItem value="oldest">En Eski</SelectItem>
                                            <SelectItem value="rate-high">En Yüksek Ücret</SelectItem>
                                            <SelectItem value="rate-low">En Düşük Ücret</SelectItem>
                                            <SelectItem value="date-soon">Yaklaşan Tarih</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Toggles */}
                            <div className="flex flex-wrap gap-4">


                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="homework-filter"
                                        checked={showHomeworkOnly}
                                        onCheckedChange={setShowHomeworkOnly}
                                    />
                                    <Label htmlFor="homework-filter" className="cursor-pointer">
                                        Ödev Yardımı İsteyenler
                                    </Label>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </CollapsibleContent>
            </Collapsible>

            {/* Results Count */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                    {filteredPosts.length} ilan bulundu
                    {activeFiltersCount > 0 && ` (${activeFiltersCount} filtre aktif)`}
                </span>
                {viewMode === "sitter" && appliedPostIds.length > 0 && (
                    <span className="text-primary">
                        {appliedPostIds.length} ilana başvurdunuz
                    </span>
                )}
            </div>

            {/* Posts Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <CardHeader>
                                <div className="h-6 bg-muted rounded w-3/4" />
                                <div className="h-4 bg-muted rounded w-1/2 mt-2" />
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="h-4 bg-muted rounded" />
                                <div className="h-4 bg-muted rounded w-2/3" />
                                <div className="h-10 bg-muted rounded" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : filteredPosts.length === 0 ? (
                <Card className="p-8 text-center">
                    <div className="text-4xl mb-4">📭</div>
                    <h3 className="text-lg font-semibold mb-2">İlan Bulunamadı</h3>
                    <p className="text-muted-foreground mb-4">
                        {activeFiltersCount > 0
                            ? "Filtreleri değiştirerek tekrar deneyin"
                            : "Henüz ilan yok, daha sonra tekrar kontrol edin"}
                    </p>
                    {activeFiltersCount > 0 && (
                        <Button variant="outline" onClick={clearFilters}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Filtreleri Temizle
                        </Button>
                    )}
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPosts.map((post) => (
                        <NeedPostCard
                            key={post.id}
                            needPost={post}
                            viewMode={viewMode}
                            onApply={() => onApply?.(post.id)}
                            onViewApplications={() => onViewApplications?.(post.id)}
                            onEdit={() => onEdit?.(post.id)}
                            onCancel={() => onCancel?.(post.id)}
                            hasApplied={appliedPostIds.includes(post.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
