/**
 * Authentication Context Provider
 * Manages user authentication state using Supabase Auth
 */

import { createContext, useContext, useEffect, useState } from "react";
import { User, Session, AuthResponse, AuthTokenResponsePassword, AuthOtpResponse } from "@supabase/supabase-js";
import * as Sentry from "@sentry/react";
import { supabase } from "@/integrations/supabase/client";
import { isUserVerified } from "@/lib/auth";

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<AuthTokenResponsePassword>;
    signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<AuthResponse>;
    signInWithPhone: (phone: string) => Promise<AuthOtpResponse>;
    verifyOtp: (phone: string, token: string) => Promise<AuthResponse>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    requireDualVerification: boolean; // Feature flag
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (user) {
            Sentry.setUser({
                id: user.id,
                email: user.email,
                username: user.user_metadata?.full_name, // Optional: if available
                data: user.user_metadata
            });
        } else {
            Sentry.setUser(null);
        }
    }, [user]);

    const signIn = async (email: string, password: string) => {
        const result = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (result.error) throw result.error;
        return result;
    };

    const signUp = async (
        email: string,
        password: string,
        metadata?: Record<string, unknown>
    ) => {
        const result = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata,
            },
        });
        if (result.error) throw result.error;
        return result;
    };

    const signInWithPhone = async (phone: string) => {
        const result = await supabase.auth.signInWithOtp({
            phone,
        });
        if (result.error) throw result.error;
        return result;
    };

    const verifyOtp = async (phone: string, token: string) => {
        const result = await supabase.auth.verifyOtp({
            phone,
            token,
            type: "sms",
        });
        if (result.error) throw result.error;
        return result;
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    };

    const resetPassword = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
    };

    const isVerified = isUserVerified(user);
    const isEmailVerified = !!user?.email_confirmed_at;
    const isPhoneVerified = !!user?.phone_confirmed_at;
    const requireDualVerification = true; // Hardcoded for KA-010

    const value = {
        user,
        session,
        loading,
        signIn,
        signUp,
        signInWithPhone,
        verifyOtp,
        signOut,
        resetPassword,
        isEmailVerified,
        isPhoneVerified,
        isVerified,
        requireDualVerification,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
