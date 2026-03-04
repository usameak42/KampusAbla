/**
 * Chat Room Component - Full chat interface
 */

import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    ChevronLeft,
    Phone,
    Video,
    MoreVertical,
    Shield,
} from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { useChat } from "@/hooks/useChat";
import { useToast } from "@/hooks/use-toast";

interface ChatRoomProps {
    conversationId: string;
    otherUserName: string;
    otherUserPhoto?: string;
    otherUserType: "parent" | "sitter";
    currentUserId: string;
    onBack: () => void;
}

export function ChatRoom({
    conversationId,
    otherUserName,
    otherUserPhoto,
    otherUserType,
    currentUserId,
    onBack,
}: ChatRoomProps) {
    const { toast } = useToast();
    const scrollRef = useRef<HTMLDivElement>(null);

    const {
        messages,
        isLoading,
        isSending,
        error,
        sendMessage,
        markAsRead,
        clearError,
    } = useChat({ conversationId, currentUserId });

    // Mark as read on mount
    useEffect(() => {
        markAsRead();
    }, [markAsRead]);

    // Scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (content: string, type?: "text" | "image", imageUrl?: string) => {
        const success = await sendMessage(content, type, imageUrl);
        if (!success && error) {
            toast({
                title: "Mesaj Engelllendi",
                description: error,
                variant: "destructive",
            });
        }
        return success;
    };

    const handleCall = () => {
        toast({
            title: "Arama",
            description: "Arama özelliği yakında eklenecek.",
        });
    };

    return (
        <div className="flex flex-col h-[calc(100vh-80px)]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-background">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={otherUserPhoto} />
                        <AvatarFallback>
                            {otherUserName.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-medium">{otherUserName}</p>
                        <Badge variant="outline" className="text-[10px]">
                            {otherUserType === "parent" ? "Ebeveyn" : "Bakıcı"}
                        </Badge>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={handleCall}>
                        <Phone className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon">
                        <MoreVertical className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Safety Notice */}
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border-b text-xs text-blue-700">
                <Shield className="h-4 w-4" />
                <span>Güvenliğiniz için tüm mesajlar platform üzerinden iletilir.</span>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-1">
                    {messages.map((message, index) => {
                        const isOwn = message.senderId === currentUserId;
                        const showAvatar =
                            index === 0 ||
                            messages[index - 1]?.senderId !== message.senderId;

                        return (
                            <MessageBubble
                                key={message.id}
                                message={message}
                                isOwn={isOwn}
                                showAvatar={showAvatar}
                            />
                        );
                    })}
                </div>
            </ScrollArea>

            {/* Input */}
            <ChatInput
                onSend={handleSend}
                disabled={isLoading}
                error={error}
                onClearError={clearError}
            />
        </div>
    );
}
