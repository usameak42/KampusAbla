/**
 * Notification Types and Interfaces
 */

export type NotificationType =
    | "booking_request"
    | "booking_confirmed"
    | "booking_cancelled"
    | "session_started"
    | "session_status"
    | "session_completed"
    | "new_message"
    | "review_request"
    | "review_received"
    | "payment_received"
    | "payout_completed"
    | "verification_status"
    | "application_received"
    | "application_accepted"
    | "system_announcement";

export interface Notification {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    // Related entities
    relatedId?: string; // booking ID, session ID, message ID, etc.
    relatedType?: "booking" | "session" | "message" | "review" | "payment" | "application";
    // Sender info (optional)
    senderId?: string;
    senderName?: string;
    senderPhoto?: string;
    // Status
    isRead: boolean;
    isArchived: boolean;
    // Action
    actionUrl?: string;
    actionLabel?: string;
    // Meta
    createdAt: Date;
    readAt?: Date;
}

// Notification type metadata
export interface NotificationTypeInfo {
    label: string;
    icon: string;
    color: string;
    category: NotificationCategory;
}

export type NotificationCategory = "bookings" | "sessions" | "messages" | "reviews" | "payments" | "system";

export const NOTIFICATION_TYPE_INFO: Record<NotificationType, NotificationTypeInfo> = {
    booking_request: {
        label: "Rezervasyon İsteği",
        icon: "calendar-plus",
        color: "blue",
        category: "bookings",
    },
    booking_confirmed: {
        label: "Rezervasyon Onaylandı",
        icon: "calendar-check",
        color: "green",
        category: "bookings",
    },
    booking_cancelled: {
        label: "Rezervasyon İptal Edildi",
        icon: "calendar-x",
        color: "red",
        category: "bookings",
    },
    session_started: {
        label: "Seans Başladı",
        icon: "play-circle",
        color: "purple",
        category: "sessions",
    },
    session_status: {
        label: "Seans Durumu",
        icon: "info",
        color: "blue",
        category: "sessions",
    },
    session_completed: {
        label: "Seans Tamamlandı",
        icon: "check-circle",
        color: "green",
        category: "sessions",
    },
    new_message: {
        label: "Yeni Mesaj",
        icon: "message-circle",
        color: "blue",
        category: "messages",
    },
    review_request: {
        label: "Değerlendirme İsteği",
        icon: "star",
        color: "yellow",
        category: "reviews",
    },
    review_received: {
        label: "Yeni Değerlendirme",
        icon: "star",
        color: "yellow",
        category: "reviews",
    },
    payment_received: {
        label: "Ödeme Alındı",
        icon: "credit-card",
        color: "green",
        category: "payments",
    },
    payout_completed: {
        label: "Ödeme Gönderildi",
        icon: "banknote",
        color: "green",
        category: "payments",
    },
    verification_status: {
        label: "Doğrulama Durumu",
        icon: "shield-check",
        color: "blue",
        category: "system",
    },
    application_received: {
        label: "Yeni Başvuru",
        icon: "user-plus",
        color: "purple",
        category: "bookings",
    },
    application_accepted: {
        label: "Başvuru Kabul Edildi",
        icon: "check",
        color: "green",
        category: "bookings",
    },
    system_announcement: {
        label: "Duyuru",
        icon: "megaphone",
        color: "gray",
        category: "system",
    },
};

export const CATEGORY_LABELS: Record<NotificationCategory, string> = {
    bookings: "Rezervasyonlar",
    sessions: "Seanslar",
    messages: "Mesajlar",
    reviews: "Değerlendirmeler",
    payments: "Ödemeler",
    system: "Sistem",
};

// Time-based grouping
export type TimeGroup = "today" | "yesterday" | "this_week" | "this_month" | "older";

export const TIME_GROUP_LABELS: Record<TimeGroup, string> = {
    today: "Bugün",
    yesterday: "Dün",
    this_week: "Bu Hafta",
    this_month: "Bu Ay",
    older: "Daha Eski",
};

// Helper function to get time group
export function getTimeGroup(date: Date): TimeGroup {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const notifDate = new Date(date);

    if (notifDate >= today) {
        return "today";
    } else if (notifDate >= yesterday) {
        return "yesterday";
    } else if (notifDate >= weekAgo) {
        return "this_week";
    } else if (notifDate >= monthAgo) {
        return "this_month";
    } else {
        return "older";
    }
}

// Group notifications by time
export function groupNotificationsByTime(
    notifications: Notification[]
): Record<TimeGroup, Notification[]> {
    const groups: Record<TimeGroup, Notification[]> = {
        today: [],
        yesterday: [],
        this_week: [],
        this_month: [],
        older: [],
    };

    notifications.forEach((notification) => {
        const group = getTimeGroup(notification.createdAt);
        groups[group].push(notification);
    });

    return groups;
}

// Get unread count
export function getUnreadCount(notifications: Notification[]): number {
    return notifications.filter((n) => !n.isRead && !n.isArchived).length;
}
