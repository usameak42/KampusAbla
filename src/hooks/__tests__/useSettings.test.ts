import { renderHook, act } from "@testing-library/react";
import { useSettings } from "../useSettings";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { paymentService } from "@/services/payment";

// Mock Supabase client — must come before any import that uses it
vi.mock("@/integrations/supabase/client", () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            upsert: vi.fn().mockResolvedValue({ error: null }),
            insert: vi.fn().mockResolvedValue({ error: null }),
        })),
        functions: {
            invoke: vi.fn().mockResolvedValue({ data: {}, error: null }),
        },
    },
}));

// Mock payment service
vi.mock("@/services/payment", () => ({
    paymentService: {
        createSubMerchant: vi.fn(),
        tokenizeCard: vi.fn(),
    },
}));

// Mock sonner
vi.mock("sonner", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

describe("useSettings", () => {
    const userId = "user-1";

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should register sub-merchant successfully", async () => {
        const mockSubMerchantId = "sm-123";
        (paymentService.createSubMerchant as any).mockResolvedValue(mockSubMerchantId);

        const { result } = renderHook(() => useSettings({ userId }));

        const registrationData = {
            legalName: "Test User",
            identityNumber: "12345678901",
            iban: "TR123456789012345678901234",
        };

        await act(async () => {
            await result.current.registerSubMerchant(registrationData);
        });

        expect(paymentService.createSubMerchant).toHaveBeenCalledWith(registrationData);
        expect(result.current.settings.payment?.subMerchantId).toBe(mockSubMerchantId);
        expect(result.current.settings.payment?.subMerchantStatus).toBe("pending");
    });

    it("should handle sub-merchant registration error", async () => {
        const errorMessage = "API Error";
        (paymentService.createSubMerchant as any).mockRejectedValue(new Error(errorMessage));

        const { result } = renderHook(() => useSettings({ userId }));

        await act(async () => {
            try {
                await result.current.registerSubMerchant({
                    legalName: "Test User",
                    identityNumber: "12345678901",
                    iban: "TR123456789012345678901234",
                });
            } catch (e) {
                // Expected
            }
        });

        expect(result.current.error).toBe(errorMessage);
    });

    it("should add a saved card", async () => {
        const { result } = renderHook(() => useSettings({ userId }));

        const cardData = {
            cardholderName: "Test User",
            cardNumber: "1234567812345678",
            expiryMonth: "12",
            expiryYear: "2026",
            cvc: "123",
            brand: "Visa",
        };

        (paymentService.tokenizeCard as any).mockResolvedValue({
            success: true,
            token: "mock-token",
        });

        await act(async () => {
            await result.current.addSavedCard(cardData);
        });

        const savedCards = result.current.settings.payment?.savedCards || [];
        expect(savedCards.length).toBe(2); // Initial MOCK has 1
        expect(savedCards[1].last4).toBe("5678");
    });

    it("should remove a saved card", async () => {
        const { result } = renderHook(() => useSettings({ userId }));

        await act(async () => {
            await result.current.removeSavedCard("card-1");
        });

        expect(result.current.settings.payment?.savedCards?.length).toBe(0);
    });

    it("should set a default card", async () => {
        const { result } = renderHook(() => useSettings({ userId }));

        (paymentService.tokenizeCard as any).mockResolvedValue({
            success: true,
            token: "mock-token-2",
        });

        // Add 2nd card first
        await act(async () => {
            await result.current.addSavedCard({
                cardholderName: "User 2",
                cardNumber: "1111222233334444",
                expiryMonth: "01",
                expiryYear: "2025",
                cvc: "111",
                brand: "Mastercard",
            });
        });

        const newCardId = result.current.settings.payment?.savedCards?.[1].id;

        await act(async () => {
            await result.current.setDefaultCard(newCardId!);
        });

        expect(result.current.settings.payment?.savedCards?.[0].isDefault).toBe(false);
        expect(result.current.settings.payment?.savedCards?.[1].isDefault).toBe(true);
    });
});
