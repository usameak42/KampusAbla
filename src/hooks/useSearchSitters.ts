import { useMemo } from "react";
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

// Stable serialization for query key to prevent unnecessary refetches
function buildQueryKey(
    filters: SearchFiltersType,
    sortBy: SortOption,
    searchQuery: string,
    page: number,
    pageSize: number
) {
    return [
        "sitters",
        {
            loc: filters.location,
            coords: filters.locationCoords,
            radius: filters.radius,
            minRate: filters.minRate,
            maxRate: filters.maxRate,
            minRating: filters.minRating,
            langs: filters.languages.slice().sort(),
            uni: filters.university,
            gender: filters.gender,
            badge: filters.badgeLevel,
            minYear: filters.minStudentYear,
            minReviews: filters.minReviewCount,
        },
        sortBy,
        searchQuery,
        page,
        pageSize,
    ] as const;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRpcSitter(s: any): Sitter {
    return {
        id: s.id,
        fullName: s.full_name,
        university: s.university || "",
        department: s.department || "",
        hourlyRate: s.hourly_rate || 0,
        rating: s.rating || 0,
        reviewCount: s.review_count || 0,
        isVerified: s.verification_status === "verified",
        languages: s.languages || [],
        bio: s.bio || "",
        profilePhotoUrl: s.profile_photo_url || undefined,
        isAvailable: s.is_available ?? true,
        distance: s.distance_km,
        latitude: s.latitude,
        longitude: s.longitude,
        isFeatured: s.is_featured,
        age: 20,
        verifiedAt: undefined,
        totalSessions: s.review_count,
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTableSitter(s: any): Sitter {
    return {
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
    };
}

function mapSortForRpc(sortBy: SortOption): string {
    switch (sortBy) {
        case "price-asc": return "price_asc";
        case "price-desc": return "price_desc";
        case "rating": return "rating";
        case "distance": return "distance";
        default: return "relevance";
    }
}

async function fetchByLocation(
    filters: SearchFiltersType,
    sortBy: SortOption,
    page: number,
    pageSize: number
) {
    const { lat, lng } = filters.locationCoords!;
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
        p_sort_by: mapSortForRpc(sortBy),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc("search_sitters_by_location", rpcParams);
    if (error) throw error;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sitters = ((data as any[]) || []).map(mapRpcSitter);
    const totalCount = sitters.length < pageSize
        ? sitters.length + (page - 1) * pageSize
        : 100;
    return { sitters, totalCount };
}

async function fetchByFilters(
    filters: SearchFiltersType,
    sortBy: SortOption,
    searchQuery: string,
    page: number,
    pageSize: number
) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
        .from("sitters")
        .select(
            `id, full_name, university, department, hourly_rate, rating, review_count, 
             verification_status, bio, profile_photo_url, is_available, latitude, longitude,
             badge_level, student_year, age, languages`,
            { count: "exact" }
        );

    // Always filter to verified sitters (KA-021)
    query = query.eq("verification_status", "verified");

    // Text search with trigram support
    if (searchQuery) {
        query = query.or(
            `full_name.ilike.%${searchQuery}%,university.ilike.%${searchQuery}%,department.ilike.%${searchQuery}%`
        );
    }

    // Price range
    if (filters.minRate) query = query.gte("hourly_rate", filters.minRate);
    if (filters.maxRate) query = query.lte("hourly_rate", filters.maxRate);

    // Rating filter - push to DB instead of client
    if (filters.minRating > 0) query = query.gte("rating", filters.minRating);

    // University
    if (filters.university && filters.university !== "all") {
        query = query.eq("university", filters.university);
    }

    // District (text only, no coords)
    if (filters.location && !filters.locationCoords) {
        query = query.eq("district", filters.location);
    }

    // Gender
    if (filters.gender) query = query.eq("gender", filters.gender);

    // Languages (array containment)
    if (filters.languages && filters.languages.length > 0) {
        query = query.contains("languages", filters.languages);
    }

    // Badge level
    if (filters.badgeLevel) query = query.eq("badge_level", filters.badgeLevel);

    // Student year
    if (filters.minStudentYear !== undefined && filters.minStudentYear > 0) {
        query = query.gte("student_year", filters.minStudentYear);
    }

    // Review count
    if (filters.minReviewCount) query = query.gte("review_count", filters.minReviewCount);

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
    query = query.range(from, from + pageSize - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sitters = (data || []).map(mapTableSitter);
    return { sitters, totalCount: count || 0 };
}

export function useSearchSitters({
    filters,
    sortBy,
    searchQuery,
    page,
    pageSize,
}: UseSearchSittersOptions) {
    const queryKey = useMemo(
        () => buildQueryKey(filters, sortBy, searchQuery, page, pageSize),
        [filters, sortBy, searchQuery, page, pageSize]
    );

    const { data, isLoading, error } = useQuery({
        queryKey,
        queryFn: () =>
            filters.locationCoords
                ? fetchByLocation(filters, sortBy, page, pageSize)
                : fetchByFilters(filters, sortBy, searchQuery, page, pageSize),
        staleTime: 1000 * 60 * 10,
        gcTime: 1000 * 60 * 30,
    });

    const sitters = data?.sitters || [];
    const totalCount = data?.totalCount || 0;
    const totalPages = Math.ceil(totalCount / pageSize);
    const hasMore = page < totalPages;

    return {
        sitters,
        totalCount,
        isLoading,
        error: error instanceof Error ? error : error ? new Error("Unknown error") : null,
        hasMore,
        totalPages,
    };
}
