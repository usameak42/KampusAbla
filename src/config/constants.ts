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

// Cancellation policy windows (in hours)
export const CANCELLATION_WINDOWS = {
    FREE: 24,      // Free cancellation up to 24h before
    PARTIAL: 6,    // 50% refund 6-24h before
    NONE: 0,       // No refund less than 6h before
};
