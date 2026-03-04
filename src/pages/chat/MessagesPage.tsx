/**
 * Messages Page - Chat list and room container
 */

import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatRoom } from "@/components/chat/ChatRoom";
import { useConversations } from "@/hooks/useConversations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    MessageSquare,
    ChevronLeft,
} from "lucide-react";

export default function MessagesPage() {
    const navigate = useNavigate();
    const { conversationId } = useParams<{ conversationId?: string }>();

    // Mock current user
    const currentUserId = "sitter-1";

    const {
        conversations,
        isLoading,
        totalUnreadCount,
        getOtherParticipant,
        markAsRead,
    } = useConversations({ currentUserId });

    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
        conversationId || null
    );

    // Get selected conversation
    const selectedConversation = conversations.find((c) => c.id === selectedConversationId);
    const otherParticipant = selectedConversation
        ? getOtherParticipant(selectedConversation)
        : undefined;

    const handleSelectConversation = (id: string) => {
        setSelectedConversationId(id);
        markAsRead(id);
        navigate(`/messages/${id}`, { replace: true });
    };

    const handleBack = () => {
        setSelectedConversationId(null);
        navigate("/messages", { replace: true });
    };

    // Mobile: Show either list or chat
    // Desktop: Show both side by side
    return (
        <div className="container mx-auto py-4 lg:py-6">
            <div className="lg:hidden">
                {/* Mobile View */}
                {selectedConversationId && selectedConversation && otherParticipant ? (
                    <ChatRoom
                        conversationId={selectedConversationId}
                        otherUserName={otherParticipant.userName}
                        otherUserPhoto={otherParticipant.userPhoto}
                        otherUserType={otherParticipant.userType}
                        currentUserId={currentUserId}
                        onBack={handleBack}
                    />
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold">Mesajlar</h1>
                                {totalUnreadCount > 0 && (
                                    <Badge className="bg-primary">{totalUnreadCount}</Badge>
                                )}
                            </div>
                        </div>
                        <ConversationList
                            conversations={conversations}
                            currentUserId={currentUserId}
                            getOtherParticipant={getOtherParticipant}
                            onSelect={handleSelectConversation}
                            isLoading={isLoading}
                        />
                    </div>
                )}
            </div>

            <div className="hidden lg:grid lg:grid-cols-3 lg:gap-6 lg:h-[calc(100vh-120px)]">
                {/* Desktop View - Side by side */}
                <div className="space-y-4 overflow-hidden">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold">Mesajlar</h1>
                            {totalUnreadCount > 0 && (
                                <Badge className="bg-primary">{totalUnreadCount}</Badge>
                            )}
                        </div>
                    </div>
                    <div className="overflow-auto h-full pb-4">
                        <ConversationList
                            conversations={conversations}
                            currentUserId={currentUserId}
                            getOtherParticipant={getOtherParticipant}
                            onSelect={handleSelectConversation}
                            isLoading={isLoading}
                        />
                    </div>
                </div>

                <div className="lg:col-span-2 border rounded-lg overflow-hidden">
                    {selectedConversationId && selectedConversation && otherParticipant ? (
                        <ChatRoom
                            conversationId={selectedConversationId}
                            otherUserName={otherParticipant.userName}
                            otherUserPhoto={otherParticipant.userPhoto}
                            otherUserType={otherParticipant.userType}
                            currentUserId={currentUserId}
                            onBack={handleBack}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8">
                            <MessageSquare className="h-16 w-16 text-muted-foreground/30 mb-4" />
                            <p className="text-lg font-medium">Bir sohbet seçin</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Mesajlarınızı görüntülemek için soldan bir sohbet seçin.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
