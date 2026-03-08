/**
 * Rate Limiting Helper for Supabase Edge Functions
 * 
 * Provides database-backed distributed rate limiting for stateless Edge Functions.
 * Uses rate_limit_tracking table to track request counts per user/IP per action.
 * 
 * @module rate-limit
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Configuration for rate limit check
 */
export interface RateLimitConfig {
    /** User ID or IP address to rate limit */
    identifier: string;

    /** Action being rate limited (e.g., 'booking_create', 'auth_login') */
    action: string;

    /** Maximum number of requests allowed in the time window */
    maxRequests: number;

    /** Time window duration in minutes */
    windowMinutes: number;
}

/**
 * Result of rate limit check
 */
export interface RateLimitResult {
    /** Whether the request is allowed */
    allowed: boolean;

    /** Number of requests remaining in current window */
    remaining: number;

    /** When the current rate limit window resets */
    resetAt: Date;

    /** Current request count (for logging) */
    currentCount: number;
}

/**
 * Predefined rate limit configurations for common actions
 */
export const RATE_LIMITS = {
    /** Authentication: 5 login attempts per 15 minutes per IP */
    AUTH_LOGIN: {
        action: 'auth_login',
        maxRequests: 5,
        windowMinutes: 15
    },

    /** Booking creation: 10 per hour per user */
    BOOKING_CREATE: {
        action: 'booking_create',
        maxRequests: 10,
        windowMinutes: 60
    },

    /** Message sending: 30 per minute per user */
    MESSAGE_SEND: {
        action: 'message_send',
        maxRequests: 30,
        windowMinutes: 1
    },

    /** Search queries: 60 per minute per user */
    SEARCH_QUERY: {
        action: 'search_query',
        maxRequests: 60,
        windowMinutes: 1
    }
} as const;

/**
 * Calculate the start of the current time window
 * Rounds down to the nearest window boundary for consistent behavior
 * 
 * @param windowMinutes - Duration of time window in minutes
 * @returns Start of current window as Date
 * 
 * @example
 * // If now is 14:37 and window is 15 minutes
 * // Returns 14:30:00 (rounds down to 15-min boundary)
 * getWindowStart(15)
 */
function getWindowStart(windowMinutes: number): Date {
    const now = new Date();
    const minutes = now.getMinutes();
    const roundedMinutes = Math.floor(minutes / windowMinutes) * windowMinutes;

    const windowStart = new Date(now);
    windowStart.setMinutes(roundedMinutes, 0, 0);

    return windowStart;
}

/**
 * Check if a request should be rate limited
 * 
 * This function:
 * 1. Calculates current time window
 * 2. Atomically increments request counter in database
 * 3. Compares count against max requests
 * 4. Returns whether request is allowed and remaining quota
 * 
 * **Fail-Open Behavior:** If database errors occur, the function allows the request
 * to prevent blocking legitimate users due to infrastructure issues.
 * 
 * @param supabase - Supabase client (should use service role for Edge Functions)
 * @param config - Rate limit configuration
 * @returns Rate limit result with allowed status and metadata
 * 
 * @example
 * ```typescript
 * const result = await checkRateLimit(supabaseClient, {
 *     identifier: user.id,
 *     action: 'booking_create',
 *     maxRequests: 10,
 *     windowMinutes: 60
 * });
 * 
 * if (!result.allowed) {
 *     return new Response('Rate limit exceeded', { 
 *         status: 429,
 *         headers: { 'Retry-After': String(result.resetAt) }
 *     });
 * }
 * ```
 */
export async function checkRateLimit(
    supabase: SupabaseClient,
    config: RateLimitConfig
): Promise<RateLimitResult> {
    try {
        // Calculate time window start
        const windowStart = getWindowStart(config.windowMinutes);

        // Atomically increment counter
        const { data, error } = await supabase
            .rpc('increment_rate_limit', {
                p_identifier: config.identifier,
                p_action: config.action,
                p_window_start: windowStart.toISOString(),
                p_max_requests: config.maxRequests
            });

        if (error) {
            console.error('Rate limit check error:', error);
            // Fail open - allow request on errors
            return createFailOpenResult(config, windowStart);
        }

        // Extract current count from RPC response
        const currentCount = Array.isArray(data) && data.length > 0
            ? data[0].request_count
            : 1;

        const allowed = currentCount <= config.maxRequests;
        const remaining = Math.max(0, config.maxRequests - currentCount);
        const resetAt = new Date(windowStart.getTime() + config.windowMinutes * 60000);

        return {
            allowed,
            remaining,
            resetAt,
            currentCount
        };

    } catch (error) {
        console.error('Unexpected error in rate limit check:', error);
        // Fail open - allow request on exceptions
        return createFailOpenResult(config, getWindowStart(config.windowMinutes));
    }
}

/**
 * Create a fail-open result (allows request) when errors occur
 * Prevents false positives from blocking legitimate users
 */
function createFailOpenResult(config: RateLimitConfig, windowStart: Date): RateLimitResult {
    const resetAt = new Date(windowStart.getTime() + config.windowMinutes * 60000);

    return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetAt,
        currentCount: 1
    };
}

/**
 * Create standard rate limit headers for HTTP responses
 * Follows RateLimit Header Fields for HTTP (draft RFC)
 * 
 * @param result - Rate limit check result
 * @param config - Rate limit configuration
 * @returns Headers object to merge into HTTP response
 * 
 * @example
 * ```typescript
 * const headers = {
 *     ...corsHeaders,
 *     ...getRateLimitHeaders(result, config)
 * };
 * ```
 */
export function getRateLimitHeaders(
    result: RateLimitResult,
    config: RateLimitConfig
): Record<string, string> {
    const retryAfterSeconds = Math.ceil((result.resetAt.getTime() - Date.now()) / 1000);

    return {
        'X-RateLimit-Limit': String(config.maxRequests),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': result.resetAt.toISOString(),
        ...(result.allowed ? {} : { 'Retry-After': String(Math.max(0, retryAfterSeconds)) })
    };
}
