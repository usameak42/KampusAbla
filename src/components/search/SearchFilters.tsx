/**
 * Search Filters Component - Filter sitters by various criteria
 */

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { X, ChevronDown, ChevronUp, Star, Award, GraduationCap } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

export interface SearchFiltersType {
    location?: string;
    locationCoords?: { lat: number; lng: number }; // Added for geospatial search
    radius?: number; // Added for geospatial search
    minRate: number;
    maxRate: number;
    minRating: number;
    languages: string[];
    university?: string;
    gender?: string;
    skills: string[];
    minAge: number;
    maxAge: number;
    // verifiedOnly removed (Task 13)
    joinQueue: boolean; // Added Task 14
    availableNow: boolean;
    badgeLevel?: string;
    minStudentYear?: number;
    minReviewCount?: number;
}

interface SearchFiltersProps {
    filters: SearchFiltersType;
    onFiltersChange: (filters: SearchFiltersType) => void;
    onClearFilters: () => void;
}

export function SearchFilters({
    filters,
    onFiltersChange,
    onClearFilters,
}: SearchFiltersProps) {
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

    const languages = [
        "Türkçe",
        "İngilizce",
        "Almanca",
        "Fransızca",
        "Arapça",
        "İspanyolca",
        "İtalyanca",
        "Rusça",
    ];

    const universities = [
        "Boğaziçi Üniversitesi",
        "İTÜ",
        "ODTÜ",
        "Koç Üniversitesi",
        "Sabancı Üniversitesi",
        "Bilkent Üniversitesi",
        "İstanbul Üniversitesi",
        "Hacettepe Üniversitesi",
    ];

    const districts = [
        "Beşiktaş",
        "Şişli",
        "Kadıköy",
        "Üsküdar",
        "Sarıyer",
        "Bakırköy",
        "Beyoğlu",
        "Fatih",
    ];

    const genders = [
        { label: "Kadın", value: "female" },
        { label: "Erkek", value: "male" },
    ];

    const skills = [
        "Soru Çözümü",
        "Yabancı Dil Pratiği",
        "Kitap Okuma Saati",
        "Oyun ve Aktivite",
        "Sanat Aktiviteleri",
        "Müzik ve Enstrüman",
        "Bilgisayar/Kodlama",
        "Spor/Egzersiz",
    ];

    const handleSkillToggle = (skill: string) => {
        const newSkills = filters.skills.includes(skill)
            ? filters.skills.filter((s) => s !== skill)
            : [...filters.skills, skill];

        onFiltersChange({ ...filters, skills: newSkills });
    };

    const handleLanguageToggle = (language: string) => {
        const newLanguages = filters.languages.includes(language)
            ? filters.languages.filter((l) => l !== language)
            : [...filters.languages, language];

        onFiltersChange({ ...filters, languages: newLanguages });
    };

    const activeFilterCount =
        (filters.location ? 1 : 0) +
        (filters.minRate > 50 || filters.maxRate < 200 ? 1 : 0) +
        (filters.minRating > 0 ? 1 : 0) +
        (filters.languages.length > 0 ? 1 : 0) +
        (filters.university ? 1 : 0) +
        (filters.gender ? 1 : 0) +
        (filters.gender ? 1 : 0) +
        // minExperience removed
        (filters.skills.length > 0 ? 1 : 0) +
        (filters.minAge > 18 || filters.maxAge < 35 ? 1 : 0) +
        (filters.joinQueue ? 1 : 0) +
        (filters.availableNow ? 1 : 0) +
        (filters.badgeLevel ? 1 : 0) +
        (filters.minStudentYear && filters.minStudentYear > 1 ? 1 : 0) +
        (filters.minReviewCount && filters.minReviewCount > 0 ? 1 : 0);

    return (
        <Card>
            <CardContent className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-lg">
                        Filtreler
                        {activeFilterCount > 0 && (
                            <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                                {activeFilterCount}
                            </span>
                        )}
                    </h2>
                    {activeFilterCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClearFilters}
                            className="text-xs"
                        >
                            <X className="h-3 w-3 mr-1" />
                            Temizle
                        </Button>
                    )}
                </div>

                <div className="space-y-6">
                    {/* Location */}
                    <div>
                        <Label className="text-sm font-medium mb-2 block">Konum</Label>
                        <Select
                            value={filters.location}
                            onValueChange={(value) =>
                                onFiltersChange({ ...filters, location: value })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="İlçe seçin" />
                            </SelectTrigger>
                            <SelectContent>
                                {districts.map((district) => (
                                    <SelectItem key={district} value={district}>
                                        {district}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Hourly Rate */}
                    <div>
                        <Label className="text-sm font-medium mb-2 block">
                            Saatlik Ücret
                        </Label>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">₺{filters.minRate}</span>
                                <span className="text-muted-foreground">₺{filters.maxRate}</span>
                            </div>
                            <Slider
                                min={450}
                                max={2000}
                                step={50}
                                value={[filters.minRate, filters.maxRate]}
                                onValueChange={([min, max]) =>
                                    onFiltersChange({ ...filters, minRate: min, maxRate: max })
                                }
                                className="w-full"
                            />
                        </div>
                    </div>

                    {/* Rating */}
                    <div>
                        <Label className="text-sm font-medium mb-2 block">
                            Minimum Puan
                        </Label>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">
                                    {filters.minRating > 0
                                        ? `${filters.minRating.toFixed(1)} ⭐`
                                        : "Herhangi"}
                                </span>
                            </div>
                            <Slider
                                min={0}
                                max={5}
                                step={0.5}
                                value={[filters.minRating]}
                                onValueChange={([value]) =>
                                    onFiltersChange({ ...filters, minRating: value })
                                }
                                className="w-full"
                            />
                        </div>
                    </div>

                    {/* Languages */}
                    <div>
                        <Label className="text-sm font-medium mb-2 block">Diller</Label>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {languages.map((language) => (
                                <div key={language} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`lang-${language}`}
                                        checked={filters.languages.includes(language)}
                                        onCheckedChange={() => handleLanguageToggle(language)}
                                    />
                                    <label
                                        htmlFor={`lang-${language}`}
                                        className="text-sm cursor-pointer"
                                    >
                                        {language}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* University */}
                    <div>
                        <Label className="text-sm font-medium mb-2 block">Üniversite</Label>
                        <Select
                            value={filters.university}
                            onValueChange={(value) =>
                                onFiltersChange({ ...filters, university: value })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Tümü" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tümü</SelectItem>
                                {universities.map((university) => (
                                    <SelectItem key={university} value={university}>
                                        {university}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Quick Filters */}
                    <div className="border-t pt-4 space-y-3">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="available"
                                checked={filters.availableNow}
                                onCheckedChange={(checked) =>
                                    onFiltersChange({
                                        ...filters,
                                        availableNow: checked as boolean,
                                    })
                                }
                            />
                            <label htmlFor="available" className="text-sm cursor-pointer">
                                Şu an müsait
                            </label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="joinQueue"
                                checked={filters.joinQueue}
                                onCheckedChange={(checked) =>
                                    onFiltersChange({ ...filters, joinQueue: checked as boolean })
                                }
                            />
                            <label htmlFor="joinQueue" className="text-sm cursor-pointer">
                                Sıraya katıl
                            </label>
                        </div>
                    </div>

                    {/* Gender */}
                    <div>
                        <Label className="text-sm font-medium mb-2 block">Cinsiyet Tercihi</Label>
                        <Select
                            value={filters.gender}
                            onValueChange={(value) =>
                                onFiltersChange({ ...filters, gender: value === "all" ? undefined : value })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Tümü" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tümü</SelectItem>
                                {genders.map((g) => (
                                    <SelectItem key={g.value} value={g.value}>
                                        {g.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>



                    {/* Age Range */}
                    <div>
                        <Label className="text-sm font-medium mb-2 block">
                            Yaş Aralığı
                        </Label>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">{filters.minAge}</span>
                                <span className="text-muted-foreground">{filters.maxAge}</span>
                            </div>
                            <Slider
                                min={18}
                                max={35}
                                step={1}
                                value={[filters.minAge, filters.maxAge]}
                                onValueChange={([min, max]) =>
                                    onFiltersChange({ ...filters, minAge: min, maxAge: max })
                                }
                                className="w-full"
                            />
                        </div>
                    </div>

                    {/* Skills */}
                    <div>
                        <Label className="text-sm font-medium mb-2 block">Yetenekler</Label>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {skills.map((skill) => (
                                <div key={skill} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`skill-${skill}`}
                                        checked={filters.skills.includes(skill)}
                                        onCheckedChange={() => handleSkillToggle(skill)}
                                    />
                                    <label
                                        htmlFor={`skill-${skill}`}
                                        className="text-sm cursor-pointer"
                                    >
                                        {skill}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Advanced Filters Toggle */}
                    <Collapsible
                        open={isAdvancedOpen}
                        onOpenChange={setIsAdvancedOpen}
                        className="border-t pt-4"
                    >
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" className="w-full flex items-center justify-between p-0 h-auto font-semibold hover:bg-transparent">
                                <span>Gelişmiş Filtreler</span>
                                {isAdvancedOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-6 pt-4">
                            {/* Minimum Student Year */}
                            <div>
                                <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                                    <GraduationCap className="h-4 w-4 text-primary" /> Minimum Sınıf
                                </Label>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            {filters.minStudentYear === 0 ? "Hazırlık" : `${filters.minStudentYear}. Sınıf`} ve üzeri
                                        </span>
                                    </div>
                                    <Slider
                                        min={0}
                                        max={7}
                                        step={1}
                                        value={[filters.minStudentYear || 0]}
                                        onValueChange={([value]) =>
                                            onFiltersChange({ ...filters, minStudentYear: value })
                                        }
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            {/* Minimum Review Count */}
                            <div>
                                <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" /> Minimum Değerlendirme Sayısı
                                </Label>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">{filters.minReviewCount || 0} değerlendirme</span>
                                    </div>
                                    <Slider
                                        min={0}
                                        max={5}
                                        step={0.5}
                                        value={[filters.minReviewCount || 0]}
                                        onValueChange={([value]) =>
                                            onFiltersChange({ ...filters, minReviewCount: value })
                                        }
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                </div>
            </CardContent>
        </Card>
    );
}
