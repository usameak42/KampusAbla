/**
 * Cancellation policy utilities — implements the KA-050 4-bucket model.
 * Threshold values are defined in src/config/constants.ts (CANCELLATION_WINDOWS).
 */

import { CANCELLATION_WINDOWS } from "@/config/constants";

export type CancellationWindow = "grace_period" | "more_than_12_hours" | "between_12_and_3_hours" | "less_than_3_hours";

interface CancellationPolicyInput {
    bookingDate: Date;
    startTime: string;
    totalAmount: number;
    bookingCreatedAt: Date; // Added for Bucket A
    now?: Date;
}

interface CancellationPolicyResult {
    hoursUntilStart: number;
    minutesSinceCreation: number;
    cancellationWindow: CancellationWindow;
    feeRate: number;
    feeAmount: number;
    refundAmount: number;
}

const HOURS_IN_MS = 1000 * 60 * 60;
const MINUTES_IN_MS = 1000 * 60;

/**
 * Calculates the cancellation policy result based on KA-050 (Buckets A-D).
 */
export function calculateCancellationPolicy({
    bookingDate,
    startTime,
    totalAmount,
    bookingCreatedAt,
    now = new Date(),
}: CancellationPolicyInput): CancellationPolicyResult {
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const startDateTime = new Date(bookingDate);
    startDateTime.setHours(startHour ?? 0, startMinute ?? 0, 0, 0);

    const diffMs = startDateTime.getTime() - now.getTime();
    const hoursUntilStart = diffMs / HOURS_IN_MS;
    const minutesSinceCreation = (now.getTime() - new Date(bookingCreatedAt).getTime()) / MINUTES_IN_MS;

    // Bucket A: Grace Period (<= GRACE_PERIOD_MINUTES since creation)
    if (minutesSinceCreation <= CANCELLATION_WINDOWS.GRACE_PERIOD_MINUTES) {
        return {
            hoursUntilStart,
            minutesSinceCreation,
            cancellationWindow: "grace_period",
            feeRate: 0,
            feeAmount: 0,
            refundAmount: Math.round(totalAmount),
        };
    }

    // Bucket B: Advance Notice (> FREE_HOURS hours)
    if (hoursUntilStart >= CANCELLATION_WINDOWS.FREE_HOURS) {
        return {
            hoursUntilStart,
            minutesSinceCreation,
            cancellationWindow: "more_than_12_hours",
            feeRate: 0,
            feeAmount: 0,
            refundAmount: Math.round(totalAmount),
        };
    }

    // Bucket C: Standard Late (LATE_HOURS <= t < FREE_HOURS)
    // Note: Usage limits (2/mo) would be checked here in a real backend.
    // For FE logic, we treat as warning/fee potential, but here mapping to standard policy.
    // Assuming for now it falls into the "Free" tier if within limit.
    // Backlog says "Free cancel. Limit: 2/mo". So default is Free.
    if (hoursUntilStart >= CANCELLATION_WINDOWS.LATE_HOURS) {
        return {
            hoursUntilStart,
            minutesSinceCreation,
            cancellationWindow: "between_12_and_3_hours",
            feeRate: 0, // Defaulting to 0 as per "Free Cancel" base rule
            feeAmount: 0,
            refundAmount: Math.round(totalAmount),
        };
    }

    // Bucket D: Very Late (< LATE_HOURS) -> Fee always
    return {
        hoursUntilStart,
        minutesSinceCreation,
        cancellationWindow: "less_than_3_hours",
        feeRate: CANCELLATION_WINDOWS.LATE_FEE_RATE,
        feeAmount: Math.round(totalAmount * CANCELLATION_WINDOWS.LATE_FEE_RATE),
        refundAmount: 0,
    };
}

export interface ReliabilityImpactResult {
    scoreImpact: number;
    reason: string;
}

/**
 * Calculates the reliability score penalty for a sitter-initiated cancellation.
 * 
 * Rules:
 * - > 12 hours: -5 points
 * - 12 - 2 hours: -10 points
 * - < 2 hours: -20 points
 * - Past start time: -25 points
 */
export function calculateReliabilityImpact(
    bookingDate: Date,
    startTime: string,
    now: Date = new Date()
): ReliabilityImpactResult {
    const start = new Date(bookingDate);
    const [hours, minutes] = startTime.split(":").map(Number);
    start.setHours(hours, minutes, 0, 0);

    const diffMs = start.getTime() - now.getTime();
    const hoursUntilStart = diffMs / HOURS_IN_MS;

    if (hoursUntilStart >= 12) {
        return { scoreImpact: -5, reason: "Standart İptal (12 saatten fazla)" };
    } else if (hoursUntilStart >= 2) {
        return { scoreImpact: -10, reason: "Geç İptal (12 - 2 saat)" };
    } else if (hoursUntilStart > 0) {
        return { scoreImpact: -20, reason: "Çok Geç İptal (2 saatten az)" };
    } else {
        return { scoreImpact: -25, reason: "Başlangıç saati sonrası iptal" };
    }
}
