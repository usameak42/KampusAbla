/**
 * useConversations Hook - Manages conversation list
 */

import { useState, useCallback } from "react";
import type { Conversation, ConversationParticipant } from "@/types/chat";

// Mock conversations
const MOCK_CONVERSATIONS: Conversation[] = [
    {
        id: "conv-1",
        participants: [
            { userId: "parent-1", userName: "Ayşe Demir", userType: "parent" },
            { userId: "sitter-1", userName: "Elif Kaya", userType: "sitter" },
        ],
        lastMessage: {
            id: "msg-5",
            conversationId: "conv-1",
            senderId: "parent-1",
            senderName: "Ayşe Demir",
            content: "Ali'nin fıstık alerjisi var, dikkat edelim.",
            contentType: "text",
            timestamp: new Date(Date.now() - 30 * 60 * 1000),
            status: "delivered",
        },
        lastMessageAt: new Date(Date.now() - 30 * 60 * 1000),
        unreadCount: 0,
        bookingId: "booking-1",
        status: "active",
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 30 * 60 * 1000),
    },
    {
        id: "conv-2",
        participants: [
            { userId: "parent-2", userName: "Fatma Yılmaz", userType: "parent" },
            { userId: "sitter-1", userName: "Elif Kaya", userType: "sitter" },
        ],
        lastMessage: {
            id: "msg-10",
            conversationId: "conv-2",
            senderId: "parent-2",
            senderName: "Fatma Yılmaz",
            content: "Randevu için teşekkür ederim! 🙏",
            contentType: "text",
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            status: "delivered",
        },
        lastMessageAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        unreadCount: 2,
        bookingId: "booking-2",
        status: "active",
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
        id: "conv-3",
        participants: [
            { userId: "parent-3", userName: "Zeynep Öztürk", userType: "parent" },
            { userId: "sitter-1", userName: "Elif Kaya", userType: "sitter" },
        ],
        lastMessage: {
            id: "msg-15",
            conversationId: "conv-3",
            senderId: "sitter-1",
            senderName: "Elif Kaya",
            content: "Evet, o tarih benim için uygun!",
            contentType: "text",
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
            status: "read",
        },
        lastMessageAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
        unreadCount: 0,
        status: "active",
        createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    },
];

interface UseConversationsOptions {
    currentUserId: string;
}

export function useConversations({ currentUserId }: UseConversationsOptions) {
    const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Get other participant in conversation
    const getOtherParticipant = useCallback((conversation: Conversation): ConversationParticipant | undefined => {
        return conversation.participants.find((p) => p.userId !== currentUserId);
    }, [currentUserId]);

    // Total unread count
    const totalUnreadCount = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

    // Mark conversation as read
    const markAsRead = useCallback((conversationId: string) => {
        setConversations((prev) =>
            prev.map((c) =>
                c.id === conversationId ? { ...c, unreadCount: 0 } : c
            )
        );
    }, []);

    // Archive conversation
    const archiveConversation = useCallback(async (conversationId: string) => {
        setConversations((prev) =>
            prev.map((c) =>
                c.id === conversationId ? { ...c, status: "archived" as const } : c
            )
        );
    }, []);

    // Refresh conversations
    const refresh = useCallback(async () => {
        setIsLoading(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 500));
            // Would fetch from Supabase
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        conversations,
        isLoading,
        error,
        totalUnreadCount,
        getOtherParticipant,
        markAsRead,
        archiveConversation,
        refresh,
    };
}
