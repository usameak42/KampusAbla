/**
 * Authentication and authorization helper functions.
 * 
 * SECURITY WARNING: 
 * These role helpers read from user_metadata which is USER-WRITABLE.
 * They are DEPRECATED for any access control decisions.
 * Use database queries against the user_roles table instead.
 * 
 * These functions are kept only for UI display purposes (e.g., showing role badges).
 * All actual authorization MUST use server-side RLS policies or edge function checks.
 */

/**
 * @deprecated Use user_roles table queries instead. user_metadata is user-writable.
 * Extracts the user's role from Supabase user metadata (FOR DISPLAY ONLY).
 */
export function getUserRole(user: any): string | null {
    return user?.user_metadata?.role || null;
}

/**
 * @deprecated Use user_roles table queries instead. user_metadata is user-writable.
 * Checks if the user has an administrative role (FOR DISPLAY ONLY - NOT FOR ACCESS CONTROL).
 */
export function isUserAdmin(user: any): boolean {
    return getUserRole(user) === "admin";
}

/**
 * @deprecated Use user_roles table queries instead. user_metadata is user-writable.
 * Checks if the user is a sitter (FOR DISPLAY ONLY - NOT FOR ACCESS CONTROL).
 */
export function isUserSitter(user: any): boolean {
    return getUserRole(user) === "sitter";
}

/**
 * @deprecated Use user_roles table queries instead. user_metadata is user-writable.
 * Checks if the user is a parent (FOR DISPLAY ONLY - NOT FOR ACCESS CONTROL).
 */
export function isUserParent(user: any): boolean {
    return getUserRole(user) === "parent";
}

/**
 * Checks if the user has completed dual verification (Email & Phone).
 * Requirement: KA-010
 */
export function isUserVerified(user: any): boolean {
    return !!user?.email_confirmed_at && !!user?.phone_confirmed_at;
}

/**
 * Checks if a sitter is fully verified for work.
 */
export function isSitterApproved(user: any): boolean {
    return isUserSitter(user) && user?.user_metadata?.verification_status === "verified";
}
