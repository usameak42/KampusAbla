import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SearchFiltersType } from "@/components/search/SearchFilters";
import type { SortOption } from "@/components/search/SortDropdown";

export interface Sitter {
    id: string;
    fullName: string;
    university: string;
    department: string;
    age: number;
    hourlyRate: number;
    rating: number;
    reviewCount: number;
    isVerified: boolean;
    distance?: number;
    languages: string[];
    bio: string;
    profilePhotoUrl?: string;
    isAvailable: boolean;
    verifiedAt?: string;
    totalSessions?: number;
    latitude?: number;
    longitude?: number;
    isFeatured?: boolean;
}

interface UseSearchSittersOptions {
    filters: SearchFiltersType;
    sortBy: SortOption;
    searchQuery: string;
    page: number;
    pageSize: number;
}

export function useSearchSitters({
    filters,
    sortBy,
    searchQuery,
    page,
    pageSize,
}: UseSearchSittersOptions) {
    const { data, isLoading, error } = useQuery({
        queryKey: ["sitters", filters, sortBy, searchQuery, page, pageSize],
        queryFn: async () => {
            // 1. GEOSPATIAL SEARCH (RPC)
            // If location coordinates are available (even if text search exists), prioritize RPC for distance sorting
            if (filters.locationCoords) {
                const { lat, lng } = filters.locationCoords;

                const rpcParams = {
                    p_lat: lat,
                    p_lng: lng,
                    p_radius_km: filters.radius || 10,
                    p_min_price: filters.minRate || 0,
                    p_max_price: filters.maxRate || 10000,
                    p_min_rating: filters.minRating || 0,
                    p_languages: filters.languages?.length ? filters.languages : null,
                    p_limit: pageSize,
                    p_offset: (page - 1) * pageSize,
                    p_sort_by: sortBy === "price-asc" ? "price_asc" :
                        sortBy === "price-desc" ? "price_desc" :
                            sortBy === "rating" ? "rating" :
                                sortBy === "distance" ? "distance" : "relevance"
                };

                const { data, error } = await (supabase as any).rpc("search_sitters_by_location", rpcParams);

                if (error) throw error;

                // Map RPC result to Sitter interface
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const mappedSitters: Sitter[] = ((data as any[]) || []).map((s: any) => ({
                    id: s.id,
                    fullName: s.full_name,
                    university: s.university || "",
                    department: s.department || "",
                    hourlyRate: s.hourly_rate || 0,
                    rating: s.rating || 0, // RPC returns 0 if null
                    reviewCount: s.review_count || 0,
                    isVerified: s.verification_status === "verified",
                    languages: s.languages || [],
                    bio: s.bio || "",
                    profilePhotoUrl: s.profile_photo_url || undefined,
                    isAvailable: s.is_available ?? true,
                    // RPC specific fields
                    distance: s.distance_km,
                    latitude: s.latitude,
                    longitude: s.longitude,
                    isFeatured: s.is_featured,
                    // Fields not in RPC response yet, default them safely
                    age: 20, // Default or add to RPC if needed
                    verifiedAt: undefined as string | undefined,
                    totalSessions: s.review_count
                }));

                // Get total count (approximation or separate count query needed for pagination in production)
                // For now, if we got full page, assume there's more. 
                // Optimize: RPC could return full count in header or separate query.
                return { sitters: mappedSitters, totalCount: mappedSitters.length < pageSize ? mappedSitters.length + ((page - 1) * pageSize) : 100 };
            }

            // 2. TEXT/STANDARD SEARCH (Existing Logic)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let query = (supabase as any)
                .from("sitters")
                .select(`
                    id, 
                    full_name, 
                    university, 
                    department, 
                    hourly_rate, 
                    rating, 
                    review_count, 
                    verification_status, 
                    bio, 
                    profile_photo_url, 
                    is_available, 
                    latitude, 
                    longitude,
                    badge_level,
                    student_year
                `, { count: "exact" });

            // Enforce verification (KA-021)
            query = query.eq("verification_status", "verified");

            // Search query
            if (searchQuery) {
                // Using trigram-friendly OR query
                query = query.or(`full_name.ilike.%${searchQuery}%,university.ilike.%${searchQuery}%,department.ilike.%${searchQuery}%`);
            }

            // Filters
            if (filters.minRate) query = query.gte("hourly_rate", filters.minRate);
            if (filters.maxRate) query = query.lte("hourly_rate", filters.maxRate);

            if (filters.university && filters.university !== "all") {
                query = query.eq("university", filters.university);
            }
            if (filters.location && !filters.locationCoords) {
                // Only use text district filter if no coords provided
                query = query.eq("district", filters.location);
            }
            if (filters.gender) query = query.eq("gender", filters.gender);
            if (filters.languages && filters.languages.length > 0) {
                query = query.contains("languages", filters.languages);
            }

            // Advanced Filters
            if (filters.badgeLevel) {
                query = query.eq("badge_level", filters.badgeLevel);
            }
            if (filters.minStudentYear !== undefined) {
                query = query.gte("student_year", filters.minStudentYear);
            }
            if (filters.minReviewCount) {
                query = query.gte("review_count", filters.minReviewCount);
            }

            // Sorting
            switch (sortBy) {
                case "price-asc":
                    query = query.order("hourly_rate", { ascending: true });
                    break;
                case "price-desc":
                    query = query.order("hourly_rate", { ascending: false });
                    break;
                case "rating":
                    query = query.order("rating", { ascending: false });
                    break;
                case "experience":
                    query = query.order("review_count", { ascending: false });
                    break;
                default:
                    query = query.order("rating", { ascending: false });
            }

            // Pagination
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;
            query = query.range(from, to);

            const { data, count, error: supabaseError } = await query;

            if (supabaseError) throw supabaseError;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const mappedSitters: Sitter[] = (data || []).map((s: any) => ({
                id: s.id,
                fullName: s.full_name,
                university: s.university || "",
                department: s.department || "",
                hourlyRate: s.hourly_rate || 0,
                rating: s.rating || 5.0,
                reviewCount: s.review_count || 0,
                isVerified: s.verification_status === "verified",
                languages: s.languages || [],
                bio: s.bio || "",
                profilePhotoUrl: s.profile_photo_url || undefined,
                isAvailable: s.is_available ?? true,
                verifiedAt: s.verified_at || undefined,
                totalSessions: s.review_count || 0,
                age: s.age || 20,
                latitude: s.latitude || undefined,
                longitude: s.longitude || undefined,
            }));

            return { sitters: mappedSitters, totalCount: count || 0 };
        },
        staleTime: 1000 * 60 * 10, // 10 minutes - user profiles change infrequently
        gcTime: 1000 * 60 * 30, // 30 minutes
    });

    const sitters = data?.sitters || [];
    const totalCount = data?.totalCount || 0;
    const totalPages = Math.ceil(totalCount / pageSize);
    const hasMore = page < totalPages;

    return {
        sitters,
        totalCount,
        isLoading,
        error: error instanceof Error ? error : (error ? new Error("Unknown error") : null),
        hasMore,
        totalPages,
    };
}
