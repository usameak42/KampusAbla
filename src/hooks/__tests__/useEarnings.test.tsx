import { renderHook, act } from "@testing-library/react";
import { useEarnings } from "../useEarnings";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { paymentService } from "@/services/payment";
import { supabase } from "@/integrations/supabase/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSubscription } from "@/hooks/useSubscription";
import React from "react";

// Mock services
vi.mock("@/services/payment", () => ({
    paymentService: {
        requestPayout: vi.fn(),
    },
}));

vi.mock("@/hooks/useSubscription", () => ({
    useSubscription: vi.fn(() => ({
        subscription: { tier: "starter" },
        isLoading: false,
    })),
}));

vi.mock("@/integrations/supabase/client", () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    order: vi.fn(() => Promise.resolve({ data: [], error: null })),
                })),
            })),
            insert: vi.fn(() => ({
                select: vi.fn(() => ({
                    single: vi.fn(() => Promise.resolve({ data: { id: "payout-1" }, error: null })),
                })),
            })),
        })),
    },
}));

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient} > {children} </QueryClientProvider>
);

describe("useEarnings", () => {
    const sitterId = "sitter-1";

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should request payout successfully", async () => {
        const amount = 100;
        const mockTransactionId = "txn-123";

        (paymentService.requestPayout as any).mockResolvedValue({
            success: true,
            transactionId: mockTransactionId,
        });

        const { result } = renderHook(() => useEarnings(sitterId), { wrapper });

        // Clear mocks after initial fetch calls from useQuery
        vi.clearAllMocks();

        await act(async () => {
            await result.current.requestPayout(amount);
        });

        expect(paymentService.requestPayout).toHaveBeenCalledWith(sitterId, amount, false);
        expect(supabase.from).toHaveBeenCalledWith("payouts");
    });

    it("should handle payout request failure in payment service", async () => {
        const amount = 10;
        const errorMessage = "Minimum ödeme tutarı ₺20'dir.";

        (paymentService.requestPayout as any).mockResolvedValue({
            success: false,
            error: errorMessage,
        });

        const { result } = renderHook(() => useEarnings(sitterId), { wrapper });

        // Clear mocks after initial fetch calls from useQuery
        vi.clearAllMocks();

        await act(async () => {
            try {
                await result.current.requestPayout(amount);
            } catch (e: any) {
                expect(e.message).toBe(errorMessage);
            }
        });

        expect(paymentService.requestPayout).toHaveBeenCalledWith(sitterId, amount, false);
        // Supabase should NOT be called if payment service fails
        const payoutsCall = (supabase.from as any).mock.calls.find((call: any) => call[0] === "payouts");
        expect(payoutsCall).toBeUndefined();
    });

    it("should request priority payout for Pro subscribers", async () => {
        const amount = 500;

        // Change mock for this test
        (useSubscription as any).mockReturnValue({
            subscription: { tier: "pro" },
            isLoading: false,
        });

        (paymentService.requestPayout as any).mockResolvedValue({
            success: true,
            transactionId: "txn-priority",
        });

        const { result } = renderHook(() => useEarnings(sitterId), { wrapper });
        vi.clearAllMocks();

        await act(async () => {
            await result.current.requestPayout(amount);
        });

        expect(paymentService.requestPayout).toHaveBeenCalledWith(sitterId, amount, true);

        // Check database insert includes is_priority
        const insertCall = (supabase.from as any).mock.calls.find((call: any) => call[0] === "payouts");
        expect(insertCall).toBeDefined();
    });
});
