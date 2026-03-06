import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { isUserAdmin } from "@/lib/auth";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AdminRouteProps {
    children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
    const { user, loading } = useAuth();
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

    useEffect(() => {
        if (!user) {
            setIsAdmin(false);
            return;
        }
        // Check user_metadata first
        if (isUserAdmin(user)) {
            setIsAdmin(true);
            return;
        }
        // Then check user_roles table
        supabase
            .from("user_roles" as any)
            .select("role")
            .eq("user_id", user.id)
            .eq("role", "admin")
            .maybeSingle()
            .then(({ data }) => {
                setIsAdmin(!!data);
            });
    }, [user]);

    if (loading || isAdmin === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
        );
    }

    if (!user || !isAdmin) {
        return <Navigate to="/admin/login" replace />;
    }

    return <>{children}</>;
}
