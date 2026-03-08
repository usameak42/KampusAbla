/**
 * Shared CORS configuration for Supabase Edge Functions
 * 
 * This module provides environment-aware CORS headers to ensure
 * proper security in production while maintaining flexibility in development.
 */

// Get allowed origins from environment variables
// In production, this should be set to specific domains
// In development, localhost is allowed
const getAllowedOrigins = (): string[] => {
    const envOrigins = Deno.env.get('CORS_ALLOWED_ORIGINS');
    const isDev = Deno.env.get('ENVIRONMENT') === 'development';

    if (envOrigins) {
        return envOrigins.split(',').map((origin: string) => origin.trim());
    }

    // Default origins based on environment
    if (isDev) {
        return [
            'http://localhost:3000',
            'http://localhost:5173', // Vite default port
            'http://localhost:8080',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:5173',
            'http://127.0.0.1:8080',
        ];
    }

    // Production default - should be overridden by environment variables
    return [
        'https://kampusabla.com',
        'https://www.kampusabla.com',
        'https://app.kampusabla.com',
    ];
};

/**
 * Get appropriate CORS headers for current request
 * @param requestOrigin - Origin from the incoming request
 * @returns CORS headers object
 */
export const getCorsHeaders = (requestOrigin?: string): Record<string, string> => {
    const allowedOrigins = getAllowedOrigins();

    // Determine if request origin is allowed
    let allowedOrigin = '';
    if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
        allowedOrigin = requestOrigin;
    } else if (!requestOrigin && Deno.env.get('ENVIRONMENT') === 'development') {
        // For server-to-server requests in development
        allowedOrigin = '*';
    } else {
        // Use the first allowed origin as default
        allowedOrigin = allowedOrigins[0] || '';
    }

    return {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Max-Age': '86400', // 24 hours
        'Access-Control-Allow-Credentials': 'true', // Important for authenticated requests
    };
};

/**
 * Handle CORS preflight requests
 * @param request - The incoming request
 * @returns Response for preflight or null if not a preflight request
 */
export const handleCorsPreflight = (request: Request): Response | null => {
    if (request.method === 'OPTIONS') {
        const origin = request.headers.get('origin');
        return new Response(null, {
            status: 200,
            headers: getCorsHeaders(origin || undefined)
        });
    }
    return null;
};

/**
 * Create a response with CORS headers
 * @param body - Response body
 * @param status - HTTP status code
 * @param headers - Additional headers
 * @param requestOrigin - Origin from the incoming request
 * @returns Response with CORS headers
 */
export const createCorsResponse = (
    body: string | Record<string, any>,
    status: number = 200,
    headers: Record<string, string> = {},
    requestOrigin?: string | null
): Response => {
    const corsHeaders = getCorsHeaders(requestOrigin);

    // Convert body to JSON if it's an object
    const responseBody = typeof body === 'string' ? body : JSON.stringify(body);

    return new Response(responseBody, {
        status,
        headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            ...headers,
        },
    });
};