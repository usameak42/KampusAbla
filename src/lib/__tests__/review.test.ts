import { describe, it, expect } from "vitest";
import {
    calculateTrustWeight,
    calculateWeightedAverage,
    getReviewStats,
    Review,
    TrustReason
} from "@/types/review";

describe("Review Calculations (KA-110)", () => {

    describe("calculateTrustWeight", () => {
        it("should sum up weights correctly", () => {
            const reasons: TrustReason[] = ["verified_user", "completed_payment"];
            // 0.2 + 0.15 = 0.35
            expect(calculateTrustWeight(reasons)).toBeCloseTo(0.35);
        });

        it("should cap weight at 1.0", () => {
            const reasons: TrustReason[] = [
                "verified_user", // 0.2
                "repeat_booking", // 0.3
                "completed_payment", // 0.15
                "long_session", // 0.15
                "premium_subscriber" // 0.2
            ];
            // Sum = 1.0. 
            // If we add repeats or weight changes:
            expect(calculateTrustWeight(reasons)).toBe(1.0);
        });

        it("should return 0 for empty reasons", () => {
            expect(calculateTrustWeight([])).toBe(0);
        });
    });

    describe("calculateWeightedAverage", () => {
        const mockReviews: Review[] = [
            { rating: 5, trustWeight: 1.0 } as Review,
            { rating: 1, trustWeight: 0.2 } as Review,
        ];

        it("should calculate weighted average correctly", () => {
            // (5*1.0 + 1*0.2) / (1.0 + 0.2) = 5.2 / 1.2 = 4.333...
            const avg = calculateWeightedAverage(mockReviews);
            expect(avg).toBeCloseTo(4.333);
        });

        it("should default to simple average if weights are zero", () => {
            const reviews = [
                { rating: 5, trustWeight: 0 } as Review,
                { rating: 3, trustWeight: 0 } as Review,
            ];
            expect(calculateWeightedAverage(reviews)).toBe(4);
        });

        it("should return 0 for no reviews", () => {
            expect(calculateWeightedAverage([])).toBe(0);
        });
    });

    describe("getReviewStats", () => {
        const reviews = [
            { rating: 5, trustWeight: 1.0, status: "visible", isTrusted: true } as Review,
            { rating: 3, trustWeight: 0.5, status: "visible", isTrusted: false } as Review,
            { rating: 5, trustWeight: 0.5, status: "pending", isTrusted: true } as Review, // Hidden
        ];

        it("should only count visible reviews", () => {
            const stats = getReviewStats(reviews);
            expect(stats.totalReviews).toBe(2);
        });

        it("should calculate distribution correctly", () => {
            const stats = getReviewStats(reviews);
            expect(stats.ratingDistribution[5]).toBe(1);
            expect(stats.ratingDistribution[3]).toBe(1);
            expect(stats.ratingDistribution[1]).toBe(0);
        });

        it("should count trusted reviews correctly", () => {
            const stats = getReviewStats(reviews);
            expect(stats.trustedReviewCount).toBe(1); // One visible trusted
        });
    });

});
