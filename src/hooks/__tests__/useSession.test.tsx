import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { canTransitionTo, getNextStatuses } from "@/types/session";
import { useSession } from "../useSession";
import React from "react";

// ---------------------------------------------------------------------------
// Supabase mock
// ---------------------------------------------------------------------------
const mockSingle = vi.fn();
const mockEq = vi.fn(() => ({ single: mockSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });
const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq }));
const mockChannelOn = vi.fn().mockReturnThis();
const mockChannelSubscribe = vi.fn().mockReturnThis();

vi.mock("@/integrations/supabase/client", () => ({
    supabase: {
        from: vi.fn(() => ({ select: mockSelect, update: mockUpdate })),
        channel: vi.fn(() => ({
            on: mockChannelOn,
            subscribe: mockChannelSubscribe,
        })),
        removeChannel: vi.fn(),
    },
}));

vi.mock("@/contexts/AuthContext", () => ({
    useAuth: () => ({ user: { id: "user-1" } }),
}));

// ---------------------------------------------------------------------------
// Pure function tests — no React rendering needed
// ---------------------------------------------------------------------------
describe("Session status transitions (canTransitionTo)", () => {
    it("should allow pending → on-way", () => {
        expect(canTransitionTo("pending", "on-way")).toBe(true);
    });

    it("should allow on-way → arrived", () => {
        expect(canTransitionTo("on-way", "arrived")).toBe(true);
    });

    it("should allow arrived → in-progress", () => {
        expect(canTransitionTo("arrived", "in-progress")).toBe(true);
    });

    it("should allow in-progress → completed", () => {
        expect(canTransitionTo("in-progress", "completed")).toBe(true);
    });

    it("should allow cancellation from pending, on-way and arrived", () => {
        expect(canTransitionTo("pending", "cancelled")).toBe(true);
        expect(canTransitionTo("on-way", "cancelled")).toBe(true);
        expect(canTransitionTo("arrived", "cancelled")).toBe(true);
    });

    it("should NOT allow backward transitions", () => {
        expect(canTransitionTo("in-progress", "on-way")).toBe(false);
        expect(canTransitionTo("arrived", "pending")).toBe(false);
        expect(canTransitionTo("completed", "in-progress")).toBe(false);
    });

    it("should NOT allow transition from terminal states", () => {
        expect(canTransitionTo("completed", "cancelled")).toBe(false);
        expect(canTransitionTo("cancelled", "pending")).toBe(false);
        expect(canTransitionTo("cancelled", "on-way")).toBe(false);
    });

    it("should expose correct next statuses for in-progress", () => {
        expect(getNextStatuses("in-progress")).toEqual(["completed"]);
    });

    it("should expose empty next statuses for terminal states", () => {
        expect(getNextStatuses("completed")).toEqual([]);
        expect(getNextStatuses("cancelled")).toEqual([]);
    });
});

// ---------------------------------------------------------------------------
// Hook tests
// ---------------------------------------------------------------------------
describe("useSession hook", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockSingle.mockResolvedValue({ data: null, error: null });
        mockEq.mockReturnValue({ single: mockSingle });
        mockSelect.mockReturnValue({ eq: mockEq });
        mockUpdateEq.mockResolvedValue({ error: null });
        mockUpdate.mockReturnValue({ eq: mockUpdateEq });
        mockChannelOn.mockReturnThis();
        mockChannelSubscribe.mockReturnThis();
    });

    it("should have null session and finish loading when session is not found", async () => {
        const { result } = renderHook(() => useSession({ sessionId: "session-1" }));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.session).toBeNull();
        expect(result.current.error).toBeNull();
    });

    it("updateStatus should be a no-op when there is no loaded session", async () => {
        const { result } = renderHook(() => useSession({ sessionId: "session-1" }));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        // Session is null (mock returned null data) — updateStatus should exit early without throwing
        await act(async () => {
            await result.current.updateStatus("on-way");
        });

        expect(mockUpdate).not.toHaveBeenCalled();
    });

    it("should expose refreshSession callback", async () => {
        const { result } = renderHook(() => useSession({ sessionId: "session-1" }));
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(typeof result.current.refreshSession).toBe("function");
    });
});
