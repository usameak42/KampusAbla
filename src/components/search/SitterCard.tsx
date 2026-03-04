/**
 * Sitter Card Component - Display sitter information in search results
 */

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MapPin, Star, Shield, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { maskEmail, maskPhone } from "@/lib/privacy";
import { LazyImage } from "@/components/ui/lazy-image";

interface SitterCardProps {
    sitter: {
        id: string;
        fullName: string;
        university: string;
        department: string;
        age?: number;
        hourlyRate: number;
        rating: number;
        reviewCount: number;
        // verificationBadge removed for KA-020
        isVerified?: boolean; // Replaced badgeLevel
        distance?: number; // in km
        languages: string[];
        bio: string;
        profilePhotoUrl?: string;
        isAvailable: boolean;
        verifiedAt?: string;
    };
    onViewProfile: (sitterId: string) => void;
    onToggleFavorite?: (sitterId: string) => void;
    isFavorited?: boolean;
}

export function SitterCard({
    sitter,
    onViewProfile,
    onToggleFavorite,
    isFavorited = false,
}: SitterCardProps) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <Card
            className={cn(
                "transition-all duration-200 cursor-pointer hover:shadow-lg",
                isHovered && "shadow-lg"
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => onViewProfile(sitter.id)}
        >
            <CardContent className="p-4">
                {/* Header with Photo and Basic Info */}
                <div className="flex items-start gap-3 mb-3">
                    {/* Profile Photo */}
                    <div className="relative shrink-0">
                        <div className="h-16 w-16 rounded-full bg-blue-200 flex items-center justify-center overflow-hidden">
                            {sitter.profilePhotoUrl ? (
                                <LazyImage
                                    src={sitter.profilePhotoUrl}
                                    alt={sitter.fullName}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <span className="text-2xl font-bold text-blue-700">
                                    {sitter.fullName.charAt(0)}
                                </span>
                            )}
                        </div>
                        {sitter.isAvailable && (
                            <div className="absolute bottom-0 right-0 h-4 w-4 bg-green-500 border-2 border-white rounded-full" />
                        )}
                    </div>

                    {/* Name and University */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-lg truncate">{sitter.fullName}</h3>
                            {onToggleFavorite && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleFavorite(sitter.id);
                                    }}
                                    className="shrink-0 p-1 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <Heart
                                        className={cn(
                                            "h-5 w-5",
                                            isFavorited
                                                ? "fill-red-500 text-red-500"
                                                : "text-gray-400"
                                        )}
                                    />
                                </button>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                            {sitter.university}
                        </p>
                        <p className="text-xs text-muted-foreground">{sitter.department}</p>
                    </div>
                </div>

                {/* Rating and Badge */}
                <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold text-sm">{sitter.rating.toFixed(1)}</span>
                        <span className="text-xs text-muted-foreground">
                            ({sitter.reviewCount})
                        </span>
                    </div>

                    {(sitter.isVerified || sitter.verifiedAt) && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                            <Shield className="h-3 w-3 mr-1" />
                            Doğrulanmış
                        </Badge>
                    )}

                    {sitter.verifiedAt && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Doğrulanmış
                        </Badge>
                    )}
                </div>

                {/* Distance and Age */}
                <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                    {sitter.distance !== undefined && (
                        <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {sitter.distance.toFixed(1)} km
                        </span>
                    )}
                    {sitter.age && (
                        <>
                            <span>•</span>
                            <span>{sitter.age} yaş</span>
                        </>
                    )}
                </div>

                {/* Languages */}
                <div className="mb-3">
                    <p className="text-sm">
                        <span className="font-medium">Diller:</span>{" "}
                        {sitter.languages.slice(0, 3).join(", ")}
                        {sitter.languages.length > 3 && ` +${sitter.languages.length - 3}`}
                    </p>
                </div>

                {/* Bio Preview */}
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {sitter.bio.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, (m) => maskEmail(m))
                        .replace(/(\+?\d[\d\s-]{8,}\d)/g, (m) => maskPhone(m))}
                </p>

                {/* Price and CTA */}
                <div className="flex items-center justify-between pt-3 border-t">
                    <div>
                        <span className="text-2xl font-bold text-primary">
                            ₺{sitter.hourlyRate}
                        </span>
                        <span className="text-sm text-muted-foreground">/saat</span>
                    </div>
                    <Button
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onViewProfile(sitter.id);
                        }}
                    >
                        Profil Gör →
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
