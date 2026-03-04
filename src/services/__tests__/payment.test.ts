import { describe, it, expect, vi, beforeEach } from "vitest";
import { PaymentService } from "../payment";

const mockInvoke = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
    supabase: {
        functions: {
            invoke: mockInvoke,
        },
    },
}));

describe("PaymentService", () => {
    let service: PaymentService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new PaymentService();
    });

    it("processPayment should handle success", async () => {
        mockInvoke.mockResolvedValue({
            data: { success: true, paymentId: "txn_123" },
            error: null,
        });

        const result = await service.processPayment(
            100,
            "booking_1",
            "sub_key_1",
            {
                cardHolderName: "Jane Doe",
                cardNumber: "5528790000000008",
                expireMonth: "12",
                expireYear: "2030",
                cvc: "123",
            },
            {
                id: "buyer_1",
                name: "Jane",
                surname: "Doe",
                email: "jane@example.com",
                gsmNumber: "+905551112233",
                identityNumber: "11111111111",
                registrationAddress: "Istanbul",
                city: "Istanbul",
                country: "Turkey",
            }
        );

        expect(result.success).toBe(true);
        expect(result.transactionId).toBe("txn_123");
        expect(mockInvoke).toHaveBeenCalledWith(
            "process-payment",
            expect.objectContaining({
                body: expect.objectContaining({
                    amount: 100,
                    bookingId: "booking_1",
                }),
            })
        );
    });

    it("processPayment should handle failure handling", async () => {
        mockInvoke.mockResolvedValue({
            data: null,
            error: { message: "Payment API error" },
        });

        const result = await service.processPayment(
            100,
            "booking_1",
            "sub_key_1",
            {
                cardHolderName: "Jane Doe",
                cardNumber: "5528790000000008",
                expireMonth: "12",
                expireYear: "2030",
                cvc: "123",
            },
            {
                id: "buyer_1",
                name: "Jane",
                surname: "Doe",
                email: "jane@example.com",
                gsmNumber: "+905551112233",
                identityNumber: "11111111111",
                registrationAddress: "Istanbul",
                city: "Istanbul",
                country: "Turkey",
            }
        );

        expect(result.success).toBe(false);
        expect(result.error).toContain("Payment API error");
    });

    it("processRefund should handle success", async () => {
        mockInvoke.mockResolvedValue({
            data: { success: true, refundId: "ref_999" },
            error: null,
        });

        const result = await service.processRefund("txn_123", 50);

        expect(result.success).toBe(true);
        expect(result.refundId).toBe("ref_999");
        expect(mockInvoke).toHaveBeenCalledWith(
            "process-refund",
            expect.objectContaining({
                body: { transactionId: "txn_123", amount: 50 },
            })
        );
    });

    it("tokenizeCard should validate card number length in simulation", async () => {
        const result = await service.tokenizeCard({
            cardholderName: "Test",
            cardNumber: "1234567812345678",
            expiryMonth: "12",
            expiryYear: "2030",
            cvc: "123",
        });

        expect(result.success).toBe(true);
        expect(result.token).toBeDefined();
    });

    it("tokenizeCard should fail for short cards in simulation", async () => {
        const result = await service.tokenizeCard({
            cardholderName: "Test",
            cardNumber: "123",
            expiryMonth: "12",
            expiryYear: "2030",
            cvc: "123",
        });

        expect(result.success).toBe(false);
    });
});
