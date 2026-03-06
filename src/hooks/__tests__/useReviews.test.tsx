import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useReviews } from "../useReviews";
import React from "react";

// ---------------------------------------------------------------------------
// Chainable Supabase query builder mock
// ---------------------------------------------------------------------------

/** Creates a thenable query-builder mock where every method returns itself. */
function createQueryBuilder(resolveValue: { data: unknown; error: unknown | null }) {
    const builder: Record<string, unknown> = {};
    // Chain methods all return the builder itself
    ["select", "eq", "order"].forEach((method) => {
        builder[method] = vi.fn().mockReturnValue(builder);
    });
    // insert returns a builder whose .select() also returns a chainable builder
    const insertBuilder: Record<string, unknown> = {};
    ["select", "eq", "order"].forEach((method) => {
        insertBuilder[method] = vi.fn().mockReturnValue(insertBuilder);
    });
    insertBuilder.single = vi.fn().mockResolvedValue(resolveValue);
    builder["insert"] = vi.fn().mockReturnValue(insertBuilder);

    // Make the builder itself awaitable (thenable) so `await query` works
    builder["then"] = (resolve: (v: unknown) => void, reject: (e: unknown) => void) =>
        Promise.resolve(resolveValue).then(resolve, reject);

    return { builder, insertBuilder };
}

let queryResolveValue: { data: unknown[]; error: unknown | null } = { data: [] as unknown[], error: null };
let insertResolveValue: { data: unknown; error: unknown | null } = { data: null as unknown, error: null };
let currentBuilder: Record<string, unknown>;
let currentInsertBuilder: Record<string, unknown>;

vi.mock("@/integrations/supabase/client", () => ({
    supabase: {
        from: vi.fn(() => {
            const { builder, insertBuilder } = createQueryBuilder(queryResolveValue);
            currentBuilder = builder;
            currentInsertBuilder = insertBuilder;
            (insertBuilder.single as ReturnType<typeof vi.fn>).mockResolvedValue(insertResolveValue);
            return builder;
        }),
    },
}));

// Shared fixture strings used across multiple tests
const VALID_COMMENT = "Güzel bir deneyimdi, teşekkürler.";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal review row as the DB returns it. */
function buildDbRow(overrides: Partial<Record<string, unknown>> = {}) {
    return {
        id: "review-1",
        session_id: "session-1",
        booking_id: "booking-1",
        reviewer_id: "user-1",
        reviewee_id: "sitter-1",
        reviewer_role: "parent",
        reviewee_role: "sitter",
        rating: 5,
        comment: VALID_COMMENT,
        status: "visible",
        created_at: new Date().toISOString(),
        visible_at: null as string | null,
        reviewer: { full_name: "Anne", profile_photo_url: null as string | null },
        reviewee: { full_name: "Bakıcı Adı" },
        ...overrides,
    };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("useReviews", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        queryResolveValue = { data: [buildDbRow()], error: null };
        insertResolveValue = { data: { id: "review-new", created_at: new Date().toISOString() }, error: null };
    });

    it("should load visible reviews on mount", async () => {
        const { result } = renderHook(() =>
            useReviews({ sitterId: "sitter-1" })
        );

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.sitterReviews).toHaveLength(1);
        expect(result.current.sitterReviews[0].id).toBe("review-1");
    });

    it("hasReviewed should return true when the user already reviewed a session", async () => {
        const { result } = renderHook(() =>
            useReviews({ userId: "user-1", sessionId: "session-1" })
        );

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.hasReviewed("session-1")).toBe(true);
        expect(result.current.hasReviewed("session-999")).toBe(false);
    });

    it("hasReviewed should return false when userId is not set", async () => {
        const { result } = renderHook(() => useReviews({}));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.hasReviewed("session-1")).toBe(false);
    });

    it("sessionReviewPair should return null when no sessionId is provided", async () => {
        const { result } = renderHook(() => useReviews({ userId: "user-1" }));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.sessionReviewPair).toBeNull();
    });

    it("sessionReviewPair should contain parent review when available", async () => {
        const { result } = renderHook(() =>
            useReviews({ userId: "user-1", sessionId: "session-1" })
        );

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.sessionReviewPair?.sessionId).toBe("session-1");
        expect(result.current.sessionReviewPair?.parentReview).toBeDefined();
    });

    it("getSitterStats should return zero count when no reviews exist", async () => {
        queryResolveValue = { data: [], error: null };

        const { result } = renderHook(() => useReviews({ sitterId: "sitter-1" }));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        const stats = result.current.getSitterStats("sitter-1");
        expect(stats.totalReviews).toBe(0);
        expect(stats.averageRating).toBe(0);
    });

    it("submitReview should throw when comment is too short (< 10 chars)", async () => {
        const { result } = renderHook(() =>
            useReviews({ userId: "user-1" })
        );

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await expect(
                result.current.submitReview({
                    sessionId: "session-1",
                    bookingId: "booking-1",
                    revieweeId: "sitter-1",
                    revieweeName: "Bakıcı Adı",
                    revieweeRole: "sitter",
                    rating: 5,
                    comment: "Kısa", // too short
                    reviewerName: "Anne",
                })
            ).rejects.toThrow();
        });
    });

    it("submitReview should throw when rating is out of range", async () => {
        const { result } = renderHook(() =>
            useReviews({ userId: "user-1" })
        );

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await expect(
                result.current.submitReview({
                    sessionId: "session-1",
                    bookingId: "booking-1",
                    revieweeId: "sitter-1",
                    revieweeName: "Bakıcı Adı",
                    revieweeRole: "sitter",
                    rating: 6, // out of range
                    comment: VALID_COMMENT,
                    reviewerName: "Anne",
                })
            ).rejects.toThrow();
        });
    });

    it("submitReview should succeed with valid data", async () => {
        const { result } = renderHook(() =>
            useReviews({ userId: "user-1" })
        );

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        let newReview: Awaited<ReturnType<typeof result.current.submitReview>> | undefined;

        await act(async () => {
            newReview = await result.current.submitReview({
                sessionId: "session-2",
                bookingId: "booking-2",
                revieweeId: "sitter-1",
                revieweeName: "Bakıcı Adı",
                revieweeRole: "sitter",
                rating: 4,
                comment: VALID_COMMENT,
                reviewerName: "Anne",
            });
        });

        expect(newReview?.id).toBe("review-new");
        expect(newReview?.rating).toBe(4);
        expect(newReview?.reviewerRole).toBe("parent");
    });
});

