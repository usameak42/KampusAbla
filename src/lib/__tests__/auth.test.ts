import { describe, it, expect } from "vitest";
import {
    getUserRole,
    isUserAdmin,
    isUserSitter,
    isUserParent,
    isUserVerified,
    isSitterApproved
} from "../auth";

describe("Authentication Helpers", () => {
    const mockUser = (role: string | null, emailVerified = true, phoneVerified = true, extraMetadata = {}) => ({
        user_metadata: { role, ...extraMetadata },
        email_confirmed_at: emailVerified ? "2024-01-01T00:00:00Z" : null,
        phone_confirmed_at: phoneVerified ? "2024-01-01T00:00:00Z" : null,
    });

    describe("Role Extraction", () => {
        it("should extract role correctly", () => {
            expect(getUserRole(mockUser("admin"))).toBe("admin");
            expect(getUserRole(mockUser("sitter"))).toBe("sitter");
            expect(getUserRole(mockUser(null))).toBe(null);
        });

        it("should identify admin correctly", () => {
            expect(isUserAdmin(mockUser("admin"))).toBe(true);
            expect(isUserAdmin(mockUser("sitter"))).toBe(false);
        });

        it("should identify sitter correctly", () => {
            expect(isUserSitter(mockUser("sitter"))).toBe(true);
            expect(isUserSitter(mockUser("parent"))).toBe(false);
        });

        it("should identify parent correctly", () => {
            expect(isUserParent(mockUser("parent"))).toBe(true);
            expect(isUserParent(mockUser("sitter"))).toBe(false);
        });
    });

    describe("Verification Logic (KA-010)", () => {
        it("should verify user if both email and phone are confirmed", () => {
            expect(isUserVerified(mockUser("parent", true, true))).toBe(true);
        });

        it("should fail if email is not confirmed", () => {
            expect(isUserVerified(mockUser("parent", false, true))).toBe(false);
        });

        it("should fail if phone is not confirmed", () => {
            expect(isUserVerified(mockUser("parent", true, false))).toBe(false);
        });

        it("should fail if neither are confirmed", () => {
            expect(isUserVerified(mockUser("parent", false, false))).toBe(false);
        });
    });

    describe("Sitter Approval", () => {
        it("should approve sitter if role is sitter and verification_status is verified", () => {
            const user = mockUser("sitter", true, true, { verification_status: "verified" });
            expect(isSitterApproved(user)).toBe(true);
        });

        it("should reject sitter if verification_status is not verified", () => {
            const user = mockUser("sitter", true, true, { verification_status: "pending" });
            expect(isSitterApproved(user)).toBe(false);
        });

        it("should reject parent even if verification_status is verified", () => {
            const user = mockUser("parent", true, true, { verification_status: "verified" });
            expect(isSitterApproved(user)).toBe(false);
        });
    });
});
