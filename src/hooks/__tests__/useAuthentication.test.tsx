import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAuthentication } from "../useAuthentication";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

// Mock dependencies
vi.mock("@/contexts/AuthContext", () => ({
    useAuth: vi.fn(),
}));

vi.mock("@/hooks/use-toast", () => ({
    useToast: vi.fn(),
}));

describe("useAuthentication Hook", () => {
    const mockSignIn = vi.fn();
    const mockSignUp = vi.fn();
    const mockSignOut = vi.fn();
    const mockToast = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as any).mockReturnValue({
            signIn: mockSignIn,
            signUp: mockSignUp,
            signOut: mockSignOut,
            user: null,
            session: null,
        });
        (useToast as any).mockReturnValue({
            toast: mockToast,
        });
    });

    it("should handle successful sign in", async () => {
        const { result } = renderHook(() => useAuthentication());

        mockSignIn.mockResolvedValueOnce({});

        await act(async () => {
            await result.current.handleSignIn("test@example.com", "password");
        });

        expect(mockSignIn).toHaveBeenCalledWith("test@example.com", "password");
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
            title: "Welcome back!",
        }));
        expect(result.current.isLoading).toBe(false);
    });

    it("should handle sign in failure", async () => {
        const { result } = renderHook(() => useAuthentication());
        const error = new Error("Invalid credentials");
        mockSignIn.mockRejectedValueOnce(error);

        await act(async () => {
            try {
                await result.current.handleSignIn("test@example.com", "wrong");
            } catch (e) {
                // Expected error
            }
        });

        expect(mockSignIn).toHaveBeenCalledWith("test@example.com", "wrong");
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
            title: "Sign in failed",
            variant: "destructive",
        }));
        expect(result.current.isLoading).toBe(false);
    });

    it("should handle successful sign up", async () => {
        const { result } = renderHook(() => useAuthentication());
        mockSignUp.mockResolvedValueOnce({ data: { user: { id: "123" } }, error: null });

        await act(async () => {
            await result.current.handleSignUp("new@example.com", "password");
        });

        expect(mockSignUp).toHaveBeenCalledWith("new@example.com", "password", undefined);
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
            title: "Account created!",
        }));
    });

    it("should handle successful sign out", async () => {
        const { result } = renderHook(() => useAuthentication());
        mockSignOut.mockResolvedValueOnce({});

        await act(async () => {
            await result.current.handleSignOut();
        });

        expect(mockSignOut).toHaveBeenCalled();
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
            title: "Signed out",
        }));
    });

    it("should set loading state correctly during async operations", async () => {
        const { result } = renderHook(() => useAuthentication());

        let resolveSignIn: (value: unknown) => void = () => { };
        const promise = new Promise((r) => { resolveSignIn = r; });
        mockSignIn.mockReturnValue(promise);

        // Start sign in
        let authPromise: Promise<any>;
        act(() => {
            authPromise = result.current.handleSignIn("test@example.com", "password");
        });

        // Should be loading now
        expect(result.current.isLoading).toBe(true);

        // Resolve promise
        await act(async () => {
            resolveSignIn({});
            await authPromise;
        });

        // Should be done loading
        expect(result.current.isLoading).toBe(false);
    });
});
