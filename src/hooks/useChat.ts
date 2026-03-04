import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Message } from "@/types/chat";
import { containsBlockedContent } from "@/types/chat";
import { supabase } from "@/integrations/supabase/client";

interface UseChatOptions {
    conversationId: string;
    currentUserId: string;
}

export function useChat({ conversationId, currentUserId }: UseChatOptions) {
    const queryClient = useQueryClient();

    const { data: messages = [], isLoading, error: queryError } = useQuery({
        queryKey: ["messages", conversationId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("messages")
                .select("*")
                .eq("conversation_id", conversationId)
                .order("sent_at", { ascending: true });

            if (error) throw error;

            return data.map((m: any): Message => ({
                id: m.id,
                conversationId: m.conversation_id,
                senderId: m.sender_id,
                senderName: m.sender_id === currentUserId ? "Ben" : "Diğer", // Names would normally come from conversation join
                content: m.content,
                contentType: "text", // Add type field to DB if images are needed
                timestamp: new Date(m.sent_at),
                status: m.read_at ? "read" : "sent",
                isBlocked: m.is_blocked,
                blockReason: m.blocked_reason || undefined,
            }));
        },
        enabled: !!conversationId,
    });

    // Real-time subscription
    useEffect(() => {
        if (!conversationId) return;

        const channel = supabase
            .channel(`chat:${conversationId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter: `conversation_id=eq.${conversationId}`,
                },
                () => {
                    queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId, queryClient]);
    // Send a new message
    const sendMutation = useMutation({
        mutationFn: async ({ content, contentType = "text", imageUrl }: { content: string; contentType?: "text" | "image"; imageUrl?: string }) => {
            // Check for blocked content
            const blockCheck = containsBlockedContent(content);
            if (blockCheck.blocked) {
                throw new Error(blockCheck.reason || "İçerik engellendi");
            }

            const { data, error } = await supabase
                .from("messages")
                .insert({
                    conversation_id: conversationId,
                    sender_id: currentUserId,
                    content: content,
                    sent_at: new Date().toISOString()
                })
                .select()
                .single();

            if (data?.is_blocked) {
                // Message was soft-blocked by server trigger
                // We can either throw an error or let the UI show it as blocked
                // For better UX during "send", we might want to tell them immediately
                throw new Error("Mesajınız iletişim bilgisi içerdiği için gizlendi.");
            }

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
        },
    });

    const sendMessage = useCallback(async (content: string, contentType: "text" | "image" = "text", imageUrl?: string) => {
        try {
            await sendMutation.mutateAsync({ content, contentType, imageUrl });
            return true;
        } catch (e) {
            setError(e instanceof Error ? e.message : "Mesaj gönderilemedi");
            return false;
        }
    }, [sendMutation]);

    // Mark messages as read
    const markAsReadMutation = useMutation({
        mutationFn: async () => {
            const { error } = await supabase
                .from("messages")
                .update({ read_at: new Date().toISOString() })
                .eq("conversation_id", conversationId)
                .neq("sender_id", currentUserId)
                .is("read_at", null);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
        },
    });

    const markAsRead = useCallback(async () => {
        return markAsReadMutation.mutateAsync();
    }, [markAsReadMutation]);

    // Load more messages (pagination)
    const loadMore = useCallback(async () => {
        // Implementation for pagination if needed
    }, []);

    const [error, setError] = useState<string | null>(null);

    return {
        messages,
        isLoading: isLoading || sendMutation.isPending,
        isSending: sendMutation.isPending,
        error: error || (queryError as any)?.message || (sendMutation.error as any)?.message,
        sendMessage,
        markAsRead,
        loadMore,
        clearError: () => setError(null),
    };
}
