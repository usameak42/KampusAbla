/**
 * Authentication and authorization helper functions.
 */

/**
 * Extracts the user's role from Supabase user metadata.
 */
export function getUserRole(user: any): string | null {
    return user?.user_metadata?.role || null;
}

/**
 * Checks if the user has an administrative role.
 */
export function isUserAdmin(user: any): boolean {
    const isActualAdmin = getUserRole(user) === "admin";
    const isDemoAdmin = import.meta.env.DEV && localStorage.getItem("ka_demo_admin") === "true";
    return isActualAdmin || isDemoAdmin;
}

/**
 * Checks if the user is a sitter.
 */
export function isUserSitter(user: any): boolean {
    return getUserRole(user) === "sitter";
}

/**
 * Checks if the user is a parent.
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
