/**
 * Message Bubble Component - Individual chat message display
 */

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Check, CheckCheck, Clock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import type { Message } from "@/types/chat";

interface MessageBubbleProps {
    message: Message;
    isOwn: boolean;
    showAvatar?: boolean;
}

export function MessageBubble({ message, isOwn, showAvatar = true }: MessageBubbleProps) {
    // Status icon
    const StatusIcon = () => {
        switch (message.status) {
            case "sending":
                return <Clock className="h-3 w-3 text-gray-400" />;
            case "sent":
                return <Check className="h-3 w-3 text-gray-400" />;
            case "delivered":
                return <CheckCheck className="h-3 w-3 text-gray-400" />;
            case "read":
                return <CheckCheck className="h-3 w-3 text-blue-500" />;
            default:
                return null;
        }
    };

    // System message
    if (message.contentType === "system") {
        return (
            <div className="flex justify-center my-3">
                <Badge variant="outline" className="text-xs font-normal bg-muted/50">
                    {message.content}
                </Badge>
            </div>
        );
    }

    // Blocked content
    if (message.isBlocked) {
        return (
            <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-3`}>
                <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg max-w-xs">
                    <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                    <span className="text-sm text-red-600">{message.blockReason}</span>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-3 group`}>
            <div className={`flex items-end gap-2 max-w-[75%] ${isOwn ? "flex-row-reverse" : ""}`}>
                {/* Avatar */}
                {showAvatar && !isOwn && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={message.senderPhoto} />
                        <AvatarFallback className="text-xs">
                            {message.senderName.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                    </Avatar>
                )}

                {/* Message content */}
                <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                    {/* Sender name (for non-own messages) */}
                    {!isOwn && showAvatar && (
                        <span className="text-xs text-muted-foreground mb-1 ml-1">
                            {message.senderName}
                        </span>
                    )}

                    {/* Bubble */}
                    <div
                        className={`rounded-2xl px-4 py-2 ${isOwn
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted rounded-bl-md"
                            }`}
                    >
                        {/* Image message */}
                        {message.contentType === "image" && message.imageUrl && (
                            <img
                                src={message.imageUrl}
                                alt="Shared image"
                                className="rounded-lg max-w-[200px] mb-1"
                                loading="lazy"
                            />
                        )}

                        {/* Text content */}
                        <p className="text-sm whitespace-pre-wrap break-words">
                            {message.content}
                        </p>
                    </div>

                    {/* Timestamp and status */}
                    <div className={`flex items-center gap-1 mt-1 ${isOwn ? "mr-1" : "ml-1"}`}>
                        <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                            {format(message.timestamp, "HH:mm", { locale: tr })}
                        </span>
                        {isOwn && <StatusIcon />}
                    </div>
                </div>
            </div>
        </div>
    );
}
