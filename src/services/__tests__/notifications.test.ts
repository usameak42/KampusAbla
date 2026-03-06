import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotificationService } from "../notifications";
import { supabase } from "@/integrations/supabase/client";
import { getToken } from "firebase/messaging";

// Mock dependencies
vi.mock("@/integrations/supabase/client", () => ({
    supabase: {
        from: vi.fn(() => ({
            upsert: vi.fn(() => Promise.resolve({ error: null })),
            insert: vi.fn(() => Promise.resolve({ error: null })),
        })),
    },
}));

vi.mock("@/lib/firebase", () => ({
    getFirebaseMessaging: vi.fn().mockResolvedValue({}),
    messaging: {},
}));

vi.mock("firebase/messaging", () => ({
    getToken: vi.fn(),
    onMessage: vi.fn(),
}));

describe("NotificationService", () => {
    let service: NotificationService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new NotificationService();

        // Mock window.Notification
        global.Notification = {
            requestPermission: vi.fn(),
        } as any;
    });

    it("should request permission and save token if granted", async () => {
        (Notification.requestPermission as any).mockResolvedValue("granted");
        (getToken as any).mockResolvedValue("mock-token");
        const upsertMock = vi.fn().mockResolvedValue({ error: null });
        (supabase.from as any).mockReturnValue({ upsert: upsertMock });

        const result = await service.requestPermission("user-123");

        expect(result).toBe(true);
        expect(Notification.requestPermission).toHaveBeenCalled();
        expect(getToken).toHaveBeenCalled();
        expect(supabase.from).toHaveBeenCalledWith("user_fcm_tokens");
        expect(upsertMock).toHaveBeenCalledWith(
            expect.objectContaining({ user_id: "user-123", token: "mock-token" }),
            expect.any(Object)
        );
    });

    it("should return false if permission denied", async () => {
        (Notification.requestPermission as any).mockResolvedValue("denied");

        const result = await service.requestPermission("user-123");

        expect(result).toBe(false);
        expect(getToken).not.toHaveBeenCalled();
    });

    it("should return false if browser does not support notifications", async () => {
        // Remove Notification from global for this test
        const originalNotification = global.Notification;
        delete (global as any).Notification;

        const result = await service.requestPermission("user-123");
        expect(result).toBe(false);

        // Restore
        global.Notification = originalNotification;
    });

    it("should create in-app notification", async () => {
        const insertMock = vi.fn().mockResolvedValue({ error: null });
        (supabase.from as any).mockReturnValue({ insert: insertMock });

        await service.createInAppNotification({
            userId: "user-1",
            type: "message",
            title: "Test",
            message: "Content"
        });

        expect(supabase.from).toHaveBeenCalledWith("notifications");
        expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
            user_id: "user-1",
            title: "Test"
        }));
    });
});
