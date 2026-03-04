/**
 * NotificationItem - Single notification display
 */

import { formatDistanceToNow, format } from "date-fns";
import { tr } from "date-fns/locale";
import {
    Calendar,
    CalendarCheck,
    CalendarX,
    PlayCircle,
    Info,
    CheckCircle,
    MessageCircle,
    Star,
    CreditCard,
    Banknote,
    ShieldCheck,
    UserPlus,
    Check,
    Megaphone,
    MoreVertical,
    Mail,
    MailOpen,
    Trash2,
    ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { Notification, NotificationType } from "@/types/notification";
import { NOTIFICATION_TYPE_INFO } from "@/types/notification";
import { cn } from "@/lib/utils";

// Icon mapping
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    "calendar-plus": Calendar,
    "calendar-check": CalendarCheck,
    "calendar-x": CalendarX,
    "play-circle": PlayCircle,
    info: Info,
    "check-circle": CheckCircle,
    "message-circle": MessageCircle,
    star: Star,
    "credit-card": CreditCard,
    banknote: Banknote,
    "shield-check": ShieldCheck,
    "user-plus": UserPlus,
    check: Check,
    megaphone: Megaphone,
};

const COLOR_CLASSES: Record<string, { bg: string; text: string }> = {
    blue: { bg: "bg-blue-100", text: "text-blue-600" },
    green: { bg: "bg-green-100", text: "text-green-600" },
    red: { bg: "bg-red-100", text: "text-red-600" },
    purple: { bg: "bg-purple-100", text: "text-purple-600" },
    yellow: { bg: "bg-yellow-100", text: "text-yellow-600" },
    gray: { bg: "bg-gray-100", text: "text-gray-600" },
};

interface NotificationItemProps {
    notification: Notification;
    onMarkAsRead?: (id: string) => void;
    onMarkAsUnread?: (id: string) => void;
    onDelete?: (id: string) => void;
    compact?: boolean;
}

export function NotificationItem({
    notification,
    onMarkAsRead,
    onMarkAsUnread,
    onDelete,
    compact = false,
}: NotificationItemProps) {
    const navigate = useNavigate();
    const typeInfo = NOTIFICATION_TYPE_INFO[notification.type];
    const IconComponent = ICON_MAP[typeInfo?.icon || "info"] || Info;
    const colorClasses = COLOR_CLASSES[typeInfo?.color || "gray"];

    const handleClick = () => {
        if (!notification.isRead && onMarkAsRead) {
            onMarkAsRead(notification.id);
        }
        if (notification.actionUrl) {
            navigate(notification.actionUrl);
        }
    };

    const notificationDate = new Date(notification.createdAt);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60 * 60 * 24));

    let timeDisplay = "";
    if (diffDays === 0) {
        timeDisplay = formatDistanceToNow(notificationDate, { addSuffix: true, locale: tr });
    } else if (diffDays === 1) {
        timeDisplay = "Dün";
    } else {
        timeDisplay = format(notificationDate, "d MMMM yyyy", { locale: tr });
    }

    if (compact) {
        return (
            <div
                className={cn(
                    "flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors",
                    !notification.isRead && "bg-blue-50/50"
                )}
                onClick={handleClick}
            >
                {/* Icon or Avatar */}
                {notification.senderPhoto ? (
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={notification.senderPhoto} />
                        <AvatarFallback>{notification.senderName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                ) : (
                    <div className={cn("h-9 w-9 rounded-full flex items-center justify-center", colorClasses.bg)}>
                        <IconComponent className={cn("h-4 w-4", colorClasses.text)} />
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p className={cn("text-sm line-clamp-2", !notification.isRead && "font-medium")}>
                        {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{timeDisplay}</p>
                </div>

                {/* Unread dot */}
                {!notification.isRead && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                )}
            </div>
        );
    }

    return (
        <div
            className={cn(
                "flex items-start gap-4 p-4 rounded-lg border transition-colors",
                !notification.isRead
                    ? "bg-blue-50/50 border-blue-100"
                    : "bg-white hover:bg-muted/50"
            )}
        >
            {/* Icon or Avatar */}
            {notification.senderPhoto ? (
                <Avatar className="h-12 w-12">
                    <AvatarImage src={notification.senderPhoto} />
                    <AvatarFallback className="bg-gradient-to-br from-violet-400 to-purple-500 text-white">
                        {notification.senderName?.charAt(0)}
                    </AvatarFallback>
                </Avatar>
            ) : (
                <div className={cn("h-12 w-12 rounded-full flex items-center justify-center", colorClasses.bg)}>
                    <IconComponent className={cn("h-6 w-6", colorClasses.text)} />
                </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <h4 className={cn("text-sm", !notification.isRead && "font-semibold")}>
                            {notification.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {notification.message}
                        </p>
                    </div>

                    {/* Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-2">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {notification.isRead ? (
                                <DropdownMenuItem onClick={() => onMarkAsUnread?.(notification.id)}>
                                    <Mail className="h-4 w-4 mr-2" />
                                    Okunmadı olarak işaretle
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem onClick={() => onMarkAsRead?.(notification.id)}>
                                    <MailOpen className="h-4 w-4 mr-2" />
                                    Okundu olarak işaretle
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => onDelete?.(notification.id)}
                                className="text-red-600"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Sil
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">{timeDisplay}</span>

                    {notification.actionUrl && notification.actionLabel && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleClick();
                            }}
                        >
                            {notification.actionLabel}
                            <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
