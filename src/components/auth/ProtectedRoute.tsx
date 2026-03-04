/**
 * Protected Route Component
 * Redirects unauthenticated users to login page
 */

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: "parent" | "sitter" | "admin";
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
    const { user, loading, isPhoneVerified, requireDualVerification } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        // Redirect to login with return URL
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // KA-010: Ensure dual verification (Phone + Email)
    if (requireDualVerification && !isPhoneVerified) {
        // Prevent redirect loop if already on verify page (handled by Route usually, but good to be safe if ProtectedRoute wraps it?) 
        // ProtectedRoute shouldn't wrap verify-phone route.
        return <Navigate to="/verify-phone" replace />;
    }

    if (requiredRole && user.user_metadata?.role !== requiredRole) {
        // Redirect to unauthorized page if role doesn't match
        return <Navigate to="/unauthorized" replace />;
    }

    return <>{children}</>;
}
