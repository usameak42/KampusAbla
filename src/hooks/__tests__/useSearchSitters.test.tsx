import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSearchSitters } from "../useSearchSitters";
import { mockSupabase } from "../../test/mocks/supabase";
import type { SearchFiltersType } from "@/components/search/SearchFilters";

vi.mock("@/integrations/supabase/client", async () => {
    const { mockSupabase } = await import("../../test/mocks/supabase");
    return { supabase: mockSupabase };
});

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);
describe("useSearchSitters", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        queryClient.clear();
        // Setup default chaining
        mockSupabase.from.mockReturnValue(mockSupabase);
        mockSupabase.select.mockReturnThis();
        mockSupabase.or.mockReturnThis();
        mockSupabase.gte.mockReturnThis();
        mockSupabase.lte.mockReturnThis();
        mockSupabase.not.mockReturnThis();
        mockSupabase.eq.mockReturnThis();
        mockSupabase.contains.mockReturnThis();
        mockSupabase.order.mockReturnThis();
    });

    const mockFilters: SearchFiltersType = {
        minRate: 450,
        maxRate: 2000,
        minRating: 0,
        languages: [],
        skills: [],
        minAge: 18,
        maxAge: 35,
        availableNow: false,
        joinQueue: false,
    };

    it("should fetch and map sitters correctly", async () => {
        const mockData = [
            {
                id: "1",
                full_name: "Test Sitter",
                university: "Test Uni",
                department: "Test Dept",
                hourly_rate: 100,
                rating: 4.5,
                review_count: 10,
                verification_status: "verified",
            },
        ];

        // Setup mock response for the final call in the chain
        mockSupabase.range.mockResolvedValue({ data: mockData, count: 1, error: null });

        const { result } = renderHook(() =>
            useSearchSitters({
                filters: mockFilters,
                sortBy: "rating",
                searchQuery: "",
                page: 1,
                pageSize: 10,
            }),
            { wrapper }
        );

        // Wait for loading to finish
        await waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 3000 });

        expect(result.current.sitters).toHaveLength(1);
        expect(result.current.sitters[0].fullName).toBe("Test Sitter");
        expect(result.current.totalCount).toBe(1);
        expect(mockSupabase.from).toHaveBeenCalledWith("sitters");
    });

    it("should apply advanced filters correctly", async () => {
        const advancedFilters: SearchFiltersType = {
            ...mockFilters,
            badgeLevel: "gold",
            minStudentYear: 3,
            minReviewCount: 10,
        };

        mockSupabase.range.mockResolvedValue({ data: [], count: 0, error: null });

        renderHook(() =>
            useSearchSitters({
                filters: advancedFilters,
                sortBy: "rating",
                searchQuery: "",
                page: 1,
                pageSize: 10,
            }),
            { wrapper }
        );

        await waitFor(() => expect(mockSupabase.eq).toHaveBeenCalledWith("badge_level", "gold"));
        await waitFor(() => expect(mockSupabase.gte).toHaveBeenCalledWith("student_year", 3));
        await waitFor(() => expect(mockSupabase.gte).toHaveBeenCalledWith("review_count", 10));
    });

    it("should handle error correctly", async () => {
        mockSupabase.range.mockResolvedValue({
            data: [],
            count: 0,
            error: new Error("Database error")
        });

        const { result } = renderHook(() =>
            useSearchSitters({
                filters: mockFilters,
                sortBy: "rating",
                searchQuery: "",
                page: 1,
                pageSize: 10,
            }),
            { wrapper }
        );

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.error).toBeDefined();
        expect(result.current.sitters).toHaveLength(0);
    });
});
