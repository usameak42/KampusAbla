import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { isUserAdmin } from "@/lib/auth";

interface AdminRouteProps {
    children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
        );
    }

    const isAdmin = isUserAdmin(user);
    const isDemoMode = import.meta.env.DEV && localStorage.getItem("ka_demo_admin") === "true";

    if (!isDemoMode && (!user || !isAdmin)) {
        return <Navigate to="/admin/login" replace />;
    }

    return <>{children}</>;
}
