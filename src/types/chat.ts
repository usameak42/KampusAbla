/**
 * Chat Types - Message and conversation definitions
 */

export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    senderName: string;
    senderPhoto?: string;
    content: string;
    contentType: "text" | "image" | "system";
    imageUrl?: string;
    timestamp: Date;
    status: "sending" | "sent" | "delivered" | "read";
    isBlocked?: boolean;
    blockReason?: string;
}

export interface Conversation {
    id: string;
    // Participants
    participants: ConversationParticipant[];
    // Last message
    lastMessage?: Message;
    lastMessageAt?: Date;
    // Unread
    unreadCount: number;
    // Related booking/session
    bookingId?: string;
    sessionId?: string;
    // Status
    status: "active" | "archived" | "blocked";
    // Metadata
    createdAt: Date;
    updatedAt: Date;
}

export interface ConversationParticipant {
    userId: string;
    userName: string;
    userPhoto?: string;
    userType: "parent" | "sitter";
    lastReadAt?: Date;
    isTyping?: boolean;
}

export interface TypingIndicator {
    conversationId: string;
    userId: string;
    isTyping: boolean;
    timestamp: Date;
}

// Content moderation patterns (phone numbers, emails, etc.)
export const BLOCKED_PATTERNS = [
    /\b\d{10,11}\b/, // Phone numbers (Turkish format)
    /\b0[5]\d{9}\b/, // Turkish mobile
    /\+90\s?\d{10}/, // +90 format
    /[\w.-]+@[\w.-]+\.\w+/, // Email addresses
    /whatsapp|telegram|instagram/i, // Social media mentions
];

// Check if content contains blocked patterns
export function containsBlockedContent(content: string): { blocked: boolean; reason?: string } {
    for (const pattern of BLOCKED_PATTERNS) {
        if (pattern.test(content)) {
            if (/\d{10,11}|0[5]\d{9}|\+90/.test(content)) {
                return { blocked: true, reason: "Telefon numarası paylaşımı engellendi" };
            }
            if (/@/.test(content)) {
                return { blocked: true, reason: "E-posta paylaşımı engellendi" };
            }
            return { blocked: true, reason: "Dış platform paylaşımı engellendi" };
        }
    }
    return { blocked: false };
}
