/**
 * Conversation List Component - Shows all chat conversations
 */

import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    MessageSquare,
    Search,
    ChevronRight,
    Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import type { Conversation, ConversationParticipant } from "@/types/chat";
import { useState } from "react";

interface ConversationListProps {
    conversations: Conversation[];
    currentUserId: string;
    getOtherParticipant: (conv: Conversation) => ConversationParticipant | undefined;
    onSelect: (conversationId: string) => void;
    isLoading?: boolean;
}

export function ConversationList({
    conversations,
    currentUserId,
    getOtherParticipant,
    onSelect,
    isLoading,
}: ConversationListProps) {
    const [searchQuery, setSearchQuery] = useState("");

    // Filter conversations
    const filteredConversations = conversations.filter((conv) => {
        if (!searchQuery) return true;
        const other = getOtherParticipant(conv);
        return other?.userName.toLowerCase().includes(searchQuery.toLowerCase());
    });

    // Sort by last message time
    const sortedConversations = [...filteredConversations].sort((a, b) => {
        const aTime = a.lastMessageAt?.getTime() || 0;
        const bTime = b.lastMessageAt?.getTime() || 0;
        return bTime - aTime;
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Sohbet ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                />
            </div>

            {/* Conversations */}
            {sortedConversations.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                        <p className="text-lg font-medium">Henüz sohbet yok</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            {searchQuery
                                ? "Aramanızla eşleşen sohbet bulunamadı."
                                : "Randevu oluşturduğunuzda sohbet başlayacak."
                            }
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2">
                    {sortedConversations.map((conversation) => {
                        const other = getOtherParticipant(conversation);
                        if (!other) return null;

                        const isUnread = conversation.unreadCount > 0;

                        return (
                            <Card
                                key={conversation.id}
                                className={`cursor-pointer transition-all hover:shadow-md ${isUnread ? "border-primary/50 bg-primary/5" : ""
                                    }`}
                                onClick={() => onSelect(conversation.id)}
                            >
                                <CardContent className="py-3">
                                    <div className="flex items-center gap-3">
                                        {/* Avatar */}
                                        <div className="relative">
                                            <Avatar className="h-12 w-12">
                                                <AvatarImage src={other.userPhoto} />
                                                <AvatarFallback>
                                                    {other.userName.split(" ").map((n) => n[0]).join("")}
                                                </AvatarFallback>
                                            </Avatar>
                                            {isUnread && (
                                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                                                    {conversation.unreadCount}
                                                </span>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <p className={`font-medium truncate ${isUnread ? "text-primary" : ""}`}>
                                                    {other.userName}
                                                </p>
                                                {conversation.lastMessageAt && (
                                                    <span className="text-xs text-muted-foreground flex-shrink-0">
                                                        {formatDistanceToNow(conversation.lastMessageAt, {
                                                            addSuffix: false,
                                                            locale: tr,
                                                        })}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <p className={`text-sm truncate ${isUnread ? "text-foreground font-medium" : "text-muted-foreground"
                                                    }`}>
                                                    {conversation.lastMessage?.senderId === currentUserId && "Sen: "}
                                                    {conversation.lastMessage?.content || "Henüz mesaj yok"}
                                                </p>
                                            </div>
                                            {other.userType && (
                                                <Badge variant="outline" className="text-[10px] mt-1">
                                                    {other.userType === "parent" ? "Ebeveyn" : "Bakıcı"}
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Arrow */}
                                        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
