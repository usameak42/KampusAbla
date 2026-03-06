/**
 * PrivateRoute - Redirects unauthenticated users to /login
 * Preserves the intended destination via `?from=` query param so
 * the Login page can redirect back after successful sign-in.
 */

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface PrivateRouteProps {
    children: React.ReactNode;
}

export function PrivateRoute({ children }: PrivateRouteProps) {
    const { user, loading } = useAuth();
    const location = useLocation();

    // While Supabase resolves the session, show a neutral spinner
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // Not authenticated — redirect to login, preserving intended destination
    if (!user) {
        return <Navigate to={`/login?from=${encodeURIComponent(location.pathname + location.search)}`} replace />;
    }

    return <>{children}</>;
}
