import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { notificationService } from "@/services/notifications";

interface NotificationContextType {
    permissionStatus: NotificationPermission;
    requestPermission: () => Promise<boolean>;
    isSupported: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(
        typeof window !== "undefined" && "Notification" in window ? Notification.permission : "default"
    );
    const [isSupported, setIsSupported] = useState(true);

    useEffect(() => {
        if (typeof window === "undefined" || !("Notification" in window)) {
            setIsSupported(false);
            return;
        }

        let unsubscribe: (() => void) | null = null;

        try {
            // Set up foreground message listener (async-safe, no-ops if Firebase unavailable)
            unsubscribe = notificationService.onForegroundMessage((payload) => {
                logger.info("Foreground notification received", {
                    action: "notifications.foreground_received",
                    userId: user?.id,
                    notification_title: payload.notification?.title,
                });
                toast(payload.notification?.title || "Yeni Bildirim", {
                    description: payload.notification?.body,
                });
            });
        } catch (err) {
            logger.warn("Failed to initialize foreground message listener", {
                action: "notifications.foreground_init_failed",
                error: err,
            });
        }

        // If user is already logged in and has permission, refresh token
        if (user && Notification.permission === "granted") {
            notificationService.requestPermission(user.id).catch((err) => {
                logger.warn("Failed to refresh notification token", {
                    action: "notifications.token_refresh_failed",
                    error: err,
                });
            });
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [user]);

    const requestPermission = async () => {
        if (!isSupported) return false;

        try {
            const granted = await notificationService.requestPermission(user?.id);
            setPermissionStatus(Notification.permission);

            if (granted) {
                toast.success("Bildirimler etkinleştirildi");
            } else if (Notification.permission === "denied") {
                toast.error("Bildirim izinleri reddedildi. Lütfen tarayıcı ayarlarınızdan etkinleştirin.");
            }

            return granted;
        } catch {
            return false;
        }
    };

    return (
        <NotificationContext.Provider
            value={{
                permissionStatus,
                requestPermission,
                isSupported,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotificationsContext() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error("useNotificationsContext must be used within a NotificationProvider");
    }
    return context;
}
