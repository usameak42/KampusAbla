/**
 * Custom hook for authentication operations
 * Provides easy access to Supabase auth methods
 */

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function useAuthentication() {
    const auth = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const handleSignIn = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            await auth.signIn(email, password);
            toast({
                title: "Welcome back!",
                description: "You've successfully signed in.",
            });
        } catch (error) {
            toast({
                title: "Sign in failed",
                description: error instanceof Error ? error.message : "Please check your credentials.",
                variant: "destructive",
            });
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignUp = async (
        email: string,
        password: string,
        metadata?: Record<string, unknown>
    ) => {
        setIsLoading(true);
        try {
            const { data, error } = await auth.signUp(email, password, metadata);
            if (error) throw error;

            toast({
                title: "Account created!",
                description: "Please check your email to verify your account.",
            });
            return data;
        } catch (error) {
            toast({
                title: "Sign up failed",
                description: error instanceof Error ? error.message : "Please try again.",
                variant: "destructive",
            });
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const handlePhoneSignIn = async (phone: string) => {
        setIsLoading(true);
        try {
            await auth.signInWithPhone(phone);
            toast({
                title: "OTP sent!",
                description: "Please check your phone for the verification code.",
            });
        } catch (error) {
            toast({
                title: "Failed to send OTP",
                description: error instanceof Error ? error.message : "Please try again.",
                variant: "destructive",
            });
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (phone: string, token: string) => {
        setIsLoading(true);
        try {
            await auth.verifyOtp(phone, token);
            toast({
                title: "Verified!",
                description: "You've successfully logged in.",
            });
        } catch (error) {
            toast({
                title: "Verification failed",
                description: error instanceof Error ? error.message : "Invalid code. Please try again.",
                variant: "destructive",
            });
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignOut = async () => {
        setIsLoading(true);
        try {
            await auth.signOut();
            toast({
                title: "Signed out",
                description: "You've been successfully signed out.",
            });
        } catch (error) {
            toast({
                title: "Sign out failed",
                description: error instanceof Error ? error.message : "Please try again.",
                variant: "destructive",
            });
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (email: string) => {
        setIsLoading(true);
        try {
            await auth.resetPassword(email);
            toast({
                title: "Reset email sent",
                description: "Please check your email for password reset instructions.",
            });
        } catch (error) {
            toast({
                title: "Reset failed",
                description: error instanceof Error ? error.message : "Please try again.",
                variant: "destructive",
            });
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        user: auth.user,
        session: auth.session,
        isLoading,
        handleSignIn,
        handleSignUp,
        handlePhoneSignIn,
        handleVerifyOtp,
        handleSignOut,
        handleResetPassword,
    };
}
