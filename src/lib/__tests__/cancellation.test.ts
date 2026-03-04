import { describe, it, expect } from "vitest";
import { calculateCancellationPolicy, calculateReliabilityImpact } from "../cancellation";

describe("Cancellation Policy Logic (KA-050)", () => {
    const totalAmount = 1000;
    const bookingDate = new Date("2026-06-01");
    const startTime = "14:00";
    // Target start: 2026-06-01 14:00:00

    it("Bucket A: should allow free cancellation during grace period (<= 10 mins since creation)", () => {
        const bookingCreatedAt = new Date(2026, 5, 1, 10, 0, 0);
        const now = new Date(2026, 5, 1, 10, 5, 0); // 5 mins later

        const result = calculateCancellationPolicy({
            bookingDate,
            startTime,
            totalAmount,
            bookingCreatedAt,
            now
        });

        expect(result.cancellationWindow).toBe("grace_period");
        expect(result.refundAmount).toBe(totalAmount);
        expect(result.feeAmount).toBe(0);
    });

    it("Bucket B: should allow free cancellation with advance notice (>= 12 hours)", () => {
        const bookingCreatedAt = new Date(2026, 4, 31, 10, 0, 0);
        const now = new Date(2026, 4, 31, 20, 0, 0); // > 12h before 2026-06-01 14:00

        const result = calculateCancellationPolicy({
            bookingDate,
            startTime,
            totalAmount,
            bookingCreatedAt,
            now
        });

        expect(result.cancellationWindow).toBe("more_than_12_hours");
        expect(result.refundAmount).toBe(totalAmount);
        expect(result.feeAmount).toBe(0);
    });

    it("Bucket C: should allow free cancellation between 12 and 3 hours (base rule)", () => {
        const bookingCreatedAt = new Date(2026, 4, 31, 10, 0, 0);
        const now = new Date(2026, 5, 1, 8, 0, 0); // 6h before 14:00

        const result = calculateCancellationPolicy({
            bookingDate,
            startTime,
            totalAmount,
            bookingCreatedAt,
            now
        });

        expect(result.cancellationWindow).toBe("between_12_and_3_hours");
        expect(result.feeRate).toBe(0);
        expect(result.refundAmount).toBe(totalAmount);
    });

    it("Bucket D: should charge 100% fee for very late cancellation (< 3 hours)", () => {
        const bookingCreatedAt = new Date(2026, 4, 31, 10, 0, 0);
        const now = new Date(2026, 5, 1, 12, 0, 0); // 2h before 14:00

        const result = calculateCancellationPolicy({
            bookingDate,
            startTime,
            totalAmount,
            bookingCreatedAt,
            now
        });

        expect(result.cancellationWindow).toBe("less_than_3_hours");
        expect(result.feeAmount).toBe(totalAmount);
        expect(result.refundAmount).toBe(0);
    });
});

describe("Reliability Impact Logic", () => {
    const bookingDate = new Date(2026, 5, 1);
    const startTime = "14:00";

    it("should deduct 5 points for cancellation > 12 hours before", () => {
        const now = new Date(2026, 4, 31, 10, 0, 0); // 28h before
        const result = calculateReliabilityImpact(bookingDate, startTime, now);
        expect(result.scoreImpact).toBe(-5);
    });

    it("should deduct 10 points for cancellation between 12 and 2 hours before", () => {
        const now = new Date(2026, 5, 1, 8, 0, 0); // 6h before
        const result = calculateReliabilityImpact(bookingDate, startTime, now);
        expect(result.scoreImpact).toBe(-10);
    });

    it("should deduct 20 points for cancellation < 2 hours before", () => {
        const now = new Date(2026, 5, 1, 13, 0, 0); // 1h before
        const result = calculateReliabilityImpact(bookingDate, startTime, now);
        expect(result.scoreImpact).toBe(-20);
    });

    it("should deduct 25 points for cancellation after start time", () => {
        const now = new Date(2026, 5, 1, 15, 0, 0); // 1h after
        const result = calculateReliabilityImpact(bookingDate, startTime, now);
        expect(result.scoreImpact).toBe(-25);
    });
});
