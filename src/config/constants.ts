/**
 * Application Constants
 */

// Platform fee rate (10% commission)
export const PLATFORM_FEE_RATE = 0.10;

// Minimum booking duration in hours
export const MIN_BOOKING_HOURS = 1;

// Maximum booking duration in hours
export const MAX_BOOKING_HOURS = 12;

// Default currency
export const DEFAULT_CURRENCY = "TRY";

/**
 * Cancellation policy windows — KA-050 4-bucket model.
 * These values must stay in sync with src/lib/cancellation.ts.
 *
 * Bucket A: Grace period   — created ≤ GRACE_PERIOD_MINUTES ago → full refund, no fee
 * Bucket B: Advance notice — starts > FREE_HOURS from now        → full refund, no fee
 * Bucket C: Standard late  — starts > LATE_HOURS from now        → free (2/mo limit)
 * Bucket D: Very late      — starts ≤ LATE_HOURS from now        → 100% fee, no refund
 */
export const CANCELLATION_WINDOWS = {
    /** Grace period duration in minutes (Bucket A) */
    GRACE_PERIOD_MINUTES: 10,
    /** Free cancellation threshold in hours (Bucket B) */
    FREE_HOURS: 12,
    /** Last-chance threshold in hours; below this Bucket D fee applies (Bucket C/D boundary) */
    LATE_HOURS: 3,
    /** Fee rate for Bucket D (100%) */
    LATE_FEE_RATE: 1.0,
    /** Fee rate for Buckets A-C (0%) */
    EARLY_FEE_RATE: 0.0,
} as const;
