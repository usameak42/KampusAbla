import { getFirebaseMessaging } from "@/lib/firebase";
import { supabase } from "@/integrations/supabase/client";
import type { Messaging, MessagePayload } from "firebase/messaging";

/**
 * Push Notification Service Integration
 * Provider: Firebase Cloud Messaging (FCM)
 */

export interface NotificationPayload {
    title: string;
    body: string;
    icon?: string;
    clickAction?: string;
    data?: Record<string, string>;
}

export class NotificationService {
    private vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

    private async getMessagingInstance(): Promise<Messaging | null> {
        return getFirebaseMessaging();
    }

    async requestPermission(userId?: string): Promise<boolean> {
        if (!("Notification" in window)) {
            console.warn("This browser does not support notifications");
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            if (permission === "granted") {
                const token = await this.getToken();
                if (token && userId) {
                    await this.saveToken(userId, token);
                }
                return true;
            }
            return false;
        } catch (error) {
            console.error("Error requesting permission:", error);
            return false;
        }
    }

    async getToken(): Promise<string | null> {
        const msg = await this.getMessagingInstance();
        if (!msg) return null;
        try {
            const { getToken: fbGetToken } = await import("firebase/messaging");
            const currentToken = await fbGetToken(msg, {
                vapidKey: this.vapidKey,
            });
            return currentToken || null;
        } catch (error) {
            console.error("An error occurred while retrieving token:", error);
            return null;
        }
    }

    private async saveToken(userId: string, token: string): Promise<void> {
        try {
            const deviceInfo = {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language,
                screenSize: `${window.screen.width}x${window.screen.height}`,
                timestamp: new Date().toISOString(),
            };

            const { error } = await supabase
                .from('user_fcm_tokens')
                .upsert(
                    {
                        user_id: userId,
                        token,
                        device_info: deviceInfo,
                        last_used_at: new Date().toISOString(),
                    },
                    { onConflict: 'user_id,token' }
                );

            if (error) {
                console.error('Error saving FCM token:', error);
            }
        } catch (error) {
            console.error('Failed to save FCM token:', error);
        }
    }

    async refreshToken(userId: string): Promise<void> {
        try {
            const newToken = await this.getToken();
            if (newToken) {
                await this.saveToken(userId, newToken);
            }
        } catch (error) {
            console.error('Error refreshing FCM token:', error);
        }
    }

    async deleteToken(userId: string, token: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('user_fcm_tokens')
                .delete()
                .eq('user_id', userId)
                .eq('token', token);

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting FCM token:', error);
        }
    }

    /**
     * Listen for foreground messages - returns unsubscribe function.
     * Returns a no-op if messaging is not available.
     */
    setupForegroundListener(callback: (payload: MessagePayload) => void): () => void {
        let unsubscribed = false;
        let innerUnsub: (() => void) | null = null;

        this.getMessagingInstance().then(async (msg) => {
            if (!msg || unsubscribed) return;
            const { onMessage: fbOnMessage } = await import("firebase/messaging");
            innerUnsub = fbOnMessage(msg, callback);
        }).catch(() => {
            // Messaging not available - silently degrade
        });

        return () => {
            unsubscribed = true;
            if (innerUnsub) innerUnsub();
        };
    }

    // Keep old sync API as alias (returns no-op if not ready)
    onForegroundMessage(callback: (payload: MessagePayload) => void): () => void {
        return this.setupForegroundListener(callback);
    }

    async subscribeToTopic(topic: string): Promise<void> {
        console.log(`Subscribed to topic: ${topic}`);
    }

    async sendNotification(userId: string, notification: NotificationPayload): Promise<void> {
        console.log(`Sending push notification to ${userId}:`, notification);
    }

    async createInAppNotification(payload: {
        userId: string;
        type: string;
        title: string;
        message: string;
        data?: any;
    }): Promise<void> {
        try {
            const { error } = await supabase.from("notifications").insert({
                user_id: payload.userId,
                type: payload.type,
                title: payload.title,
                message: payload.message,
                data: payload.data,
            });

            if (error) throw error;
        } catch (error) {
            console.error("Error creating in-app notification:", error);
        }
    }
}

export const notificationService = new NotificationService();
