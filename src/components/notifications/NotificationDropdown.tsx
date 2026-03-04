/**
 * NotificationDropdown - Header dropdown with notification preview
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { NotificationItem } from "./NotificationItem";
import { NotificationBadge } from "./NotificationBadge";
import type { Notification } from "@/types/notification";
import { cn } from "@/lib/utils";

interface NotificationDropdownProps {
    notifications: Notification[];
    unreadCount: number;
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
    className?: string;
}

export function NotificationDropdown({
    notifications,
    unreadCount,
    onMarkAsRead,
    onMarkAllAsRead,
    className,
}: NotificationDropdownProps) {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    // Show only recent 5 notifications
    const recentNotifications = notifications.slice(0, 5);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <div>
                    <NotificationBadge count={unreadCount} className={className} />
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-[380px] p-0" align="end">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <h3 className="font-semibold">Bildirimler</h3>
                    <div className="flex items-center gap-1">
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs"
                                onClick={onMarkAllAsRead}
                            >
                                <CheckCheck className="h-4 w-4 mr-1" />
                                Tümünü Oku
                            </Button>
                        )}
                    </div>
                </div>

                {/* Notifications List */}
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Bell className="h-10 w-10 text-muted-foreground/50 mb-3" />
                        <p className="text-sm text-muted-foreground">Bildirim yok</p>
                    </div>
                ) : (
                    <ScrollArea className="max-h-[400px]">
                        <div className="divide-y">
                            {recentNotifications.map((notification) => (
                                <NotificationItem
                                    key={notification.id}
                                    notification={notification}
                                    onMarkAsRead={onMarkAsRead}
                                    compact
                                />
                            ))}
                        </div>
                    </ScrollArea>
                )}

                {/* Footer */}
                {notifications.length > 0 && (
                    <>
                        <Separator />
                        <div className="p-2">
                            <Button
                                variant="ghost"
                                className="w-full justify-center text-sm"
                                onClick={() => {
                                    setOpen(false);
                                    navigate("/notifications");
                                }}
                            >
                                Tümünü Görüntüle
                            </Button>
                        </div>
                    </>
                )}
            </PopoverContent>
        </Popover>
    );
}
