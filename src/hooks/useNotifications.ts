import { useCallback, useMemo, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Notification, NotificationType, NotificationCategory } from "@/types/notification";
import { getUnreadCount, groupNotificationsByTime, NOTIFICATION_TYPE_INFO } from "@/types/notification";

import { supabase } from "@/integrations/supabase/client";

interface UseNotificationsOptions {
    userId: string;
}

export function useNotifications({ userId }: UseNotificationsOptions) {
    const queryClient = useQueryClient();

    const { data: notifications = [], isLoading, error, refetch } = useQuery({
        queryKey: ["notifications", userId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("notifications")
                .select("*")
                .eq("user_id", userId)
                .order("created_at", { ascending: false });

            if (error) throw error;

            return data.map((n: any) => ({
                id: n.id,
                userId: n.user_id,
                type: n.type as NotificationType,
                title: n.title,
                message: n.message,
                relatedId: n.related_id,
                relatedType: n.related_type as any,
                senderId: n.sender_id,
                isRead: n.is_read,
                isArchived: n.is_archived,
                actionUrl: n.action_url,
                actionLabel: n.action_label,
                createdAt: new Date(n.created_at),
                readAt: n.read_at ? new Date(n.read_at) : undefined,
                senderName: "Sistem",
                senderPhoto: undefined as string | undefined,
            })) as Notification[];
        },
        enabled: !!userId,
    });

    // Real-time subscription
    useEffect(() => {
        if (!userId) return;

        let channel: ReturnType<typeof supabase.channel> | null = null;
        try {
            channel = supabase
                .channel(`notifications:${userId}`)
                .on(
                    "postgres_changes",
                    {
                        event: "INSERT",
                        schema: "public",
                        table: "notifications",
                        filter: `user_id=eq.${userId}`,
                    },
                    () => {
                        queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
                    }
                )
                .subscribe((status, err) => {
                    if (err) {
                        console.warn("Realtime notification subscription error:", err.message);
                    }
                });
        } catch (e) {
            console.warn("Failed to create realtime channel for notifications:", e);
        }

        return () => {
            if (channel) supabase.removeChannel(channel);
        };
    }, [userId, queryClient]);

    // Auto-refresh every 30 seconds so new notifications are picked up
    // even when the real-time channel misses an event.
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    useEffect(() => {
        if (!userId) return;

        intervalRef.current = setInterval(() => {
            queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
        }, 30000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [userId, queryClient]);

    const allNotifications = notifications;

    // Filter notifications for current user
    const userNotifications = useMemo(() => {
        return allNotifications
            .filter((n) => n.userId === userId && !n.isArchived)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [allNotifications, userId]);

    // Unread count
    const unreadCount = useMemo(() => getUnreadCount(userNotifications), [userNotifications]);

    // Grouped by time
    const groupedByTime = useMemo(
        () => groupNotificationsByTime(userNotifications),
        [userNotifications]
    );

    // Filter by category
    const filterByCategory = useCallback(
        (category: NotificationCategory | "all") => {
            if (category === "all") return userNotifications;
            return userNotifications.filter(
                (n) => NOTIFICATION_TYPE_INFO[n.type]?.category === category
            );
        },
        [userNotifications]
    );

    // Mark as read
    const markAsRead = useCallback(async (notificationId: string) => {
        try {
            const { error } = await supabase
                .from("notifications")
                .update({ is_read: true, read_at: new Date().toISOString() })
                .eq("id", notificationId);

            if (error) throw error;
            refetch();
        } catch (err) {
            console.error("Error marking as read:", err);
        }
    }, [refetch]);

    // Mark as unread
    const markAsUnread = useCallback(async (notificationId: string) => {
        try {
            const { error } = await supabase
                .from("notifications")
                .update({ is_read: false, read_at: null })
                .eq("id", notificationId);

            if (error) throw error;
            refetch();
        } catch (err) {
            console.error("Error marking as unread:", err);
        }
    }, [refetch]);

    // Mark all as read
    const markAllAsRead = useCallback(async () => {
        if (!userId) return;
        try {
            const { error } = await supabase
                .from("notifications")
                .update({ is_read: true, read_at: new Date().toISOString() })
                .eq("user_id", userId)
                .eq("is_read", false);

            if (error) throw error;
            refetch();
        } catch (err) {
            console.error("Error marking all as read:", err);
        }
    }, [userId, refetch]);

    // Archive notification
    const archiveNotification = useCallback(async (notificationId: string) => {
        try {
            const { error } = await supabase
                .from("notifications")
                .update({ is_archived: true })
                .eq("id", notificationId);

            if (error) throw error;
            refetch();
        } catch (err) {
            console.error("Error archiving notification:", err);
        }
    }, [refetch]);

    // Delete notification (permanent)
    const deleteNotification = useCallback(async (notificationId: string) => {
        try {
            const { error } = await supabase
                .from("notifications")
                .delete()
                .eq("id", notificationId);

            if (error) throw error;
            refetch();
        } catch (err) {
            console.error("Error deleting notification:", err);
        }
    }, [refetch]);

    // Clear all notifications
    const clearAll = useCallback(async () => {
        if (!userId) return;
        try {
            const { error } = await supabase
                .from("notifications")
                .delete()
                .eq("user_id", userId);

            if (error) throw error;
            refetch();
        } catch (err) {
            console.error("Error clearing notifications:", err);
        }
    }, [userId, refetch]);

    // Add new notification (for real-time updates)
    const addNotification = useCallback((notification: Omit<Notification, "id" | "createdAt">) => {
        refetch();
    }, [refetch]);

    // Refresh
    const refreshNotifications = useCallback(async () => {
        await refetch();
    }, [refetch]);

    return {
        notifications: userNotifications,
        unreadCount,
        groupedByTime,
        isLoading,
        error,
        filterByCategory,
        markAsRead,
        markAsUnread,
        markAllAsRead,
        archiveNotification,
        deleteNotification,
        clearAll,
        addNotification,
        refreshNotifications,
    };
}
