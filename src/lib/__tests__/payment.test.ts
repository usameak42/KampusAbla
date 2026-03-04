import { describe, it, expect } from "vitest";
import { normalizeIban, formatIbanForDisplay, detectCardBrand, calculateEarnings } from "../payment";

describe("Payment Utilities", () => {
    describe("IBAN Normalization (KA-131, KA-132)", () => {
        it("should strip non-alphanumeric characters", () => {
            expect(normalizeIban("TR12 3456 7890")).toBe("TR1234567890");
        });

        it("should enforce TR prefix if missing", () => {
            expect(normalizeIban("12345")).toBe("TR12345");
        });

        it("should not double 'TR' if already present", () => {
            expect(normalizeIban("TR123")).toBe("TR123");
        });

        it("should handle lowercase input", () => {
            expect(normalizeIban("tr123")).toBe("TR123");
        });

        it("should limit length to 26 characters", () => {
            const longIban = "TR" + "1".repeat(30);
            expect(normalizeIban(longIban)).toHaveLength(26);
        });

        it("should format for display correctly", () => {
            expect(formatIbanForDisplay("TR12345678901234")).toBe("TR12 3456 7890 1234");
        });
    });

    describe("Card Brand Detection (KA-130)", () => {
        it("should detect Visa", () => {
            expect(detectCardBrand("4242 4242 4242 4242")).toBe("Visa");
        });

        it("should detect Mastercard", () => {
            expect(detectCardBrand("5555 5555 5555 5555")).toBe("Mastercard");
        });

        it("should detect Troy", () => {
            expect(detectCardBrand("9792 1234 5678 9012")).toBe("Troy");
        });

        it("should return 'Diğer' for unknown bins", () => {
            expect(detectCardBrand("6011 0000 0000 0000")).toBe("Diğer");
        });
    });

    describe("Earnings Calculation", () => {
        it("should calculate 10% platform fee and round it", () => {
            const { platformFee, sitterAmount } = calculateEarnings(1000);
            expect(platformFee).toBe(100);
            expect(sitterAmount).toBe(900);
        });

        it("should handle rounding correctly", () => {
            // 455 * 0.1 = 45.5 -> 46
            const { platformFee, sitterAmount } = calculateEarnings(455);
            expect(platformFee).toBe(46);
            expect(sitterAmount).toBe(409);
        });
    });
});
