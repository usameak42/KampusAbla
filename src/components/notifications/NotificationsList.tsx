/**
 * NotificationsList - Full notification list with filters
 */

import { useState, useMemo } from "react";
import { Bell, Filter, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationItem } from "./NotificationItem";
import type { Notification, NotificationCategory, TimeGroup } from "@/types/notification";
import { CATEGORY_LABELS, TIME_GROUP_LABELS, groupNotificationsByTime, NOTIFICATION_TYPE_INFO } from "@/types/notification";

interface NotificationsListProps {
    notifications: Notification[];
    onMarkAsRead: (id: string) => void;
    onMarkAsUnread: (id: string) => void;
    onDelete: (id: string) => void;
    onMarkAllAsRead: () => void;
}

export function NotificationsList({
    notifications,
    onMarkAsRead,
    onMarkAsUnread,
    onDelete,
    onMarkAllAsRead,
}: NotificationsListProps) {
    const [categoryFilter, setCategoryFilter] = useState<NotificationCategory | "all">("all");
    const [readFilter, setReadFilter] = useState<"all" | "unread" | "read">("all");

    // Apply filters
    const filteredNotifications = useMemo(() => {
        return notifications.filter((n) => {
            // Category filter
            if (categoryFilter !== "all") {
                const category = NOTIFICATION_TYPE_INFO[n.type]?.category;
                if (category !== categoryFilter) return false;
            }
            // Read filter
            if (readFilter === "unread" && n.isRead) return false;
            if (readFilter === "read" && !n.isRead) return false;
            return true;
        });
    }, [notifications, categoryFilter, readFilter]);

    // Group by time
    const groupedNotifications = useMemo(
        () => groupNotificationsByTime(filteredNotifications),
        [filteredNotifications]
    );

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    // Get non-empty groups
    const nonEmptyGroups = (Object.entries(groupedNotifications) as [TimeGroup, Notification[]][])
        .filter(([_, items]) => items.length > 0);

    return (
        <div className="space-y-4">
            {/* Header with filters */}
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                    {/* Category Filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-1">
                                <Filter className="h-4 w-4" />
                                {categoryFilter === "all" ? "Tümü" : CATEGORY_LABELS[categoryFilter]}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => setCategoryFilter("all")}>
                                Tümü
                            </DropdownMenuItem>
                            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                                <DropdownMenuItem
                                    key={key}
                                    onClick={() => setCategoryFilter(key as NotificationCategory)}
                                >
                                    {label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Read/Unread Filter */}
                    <div className="flex gap-1">
                        <Badge
                            variant={readFilter === "all" ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => setReadFilter("all")}
                        >
                            Tümü
                        </Badge>
                        <Badge
                            variant={readFilter === "unread" ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => setReadFilter("unread")}
                        >
                            Okunmamış ({unreadCount})
                        </Badge>
                        <Badge
                            variant={readFilter === "read" ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => setReadFilter("read")}
                        >
                            Okunmuş
                        </Badge>
                    </div>
                </div>

                {/* Mark all as read */}
                {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={onMarkAllAsRead}>
                        <CheckCheck className="h-4 w-4 mr-1" />
                        Tümünü Oku
                    </Button>
                )}
            </div>

            {/* Empty state */}
            {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        <Bell className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium mb-1">Bildirim bulunamadı</h3>
                    <p className="text-sm text-muted-foreground">
                        {categoryFilter !== "all" || readFilter !== "all"
                            ? "Filtreleri değiştirmeyi deneyin"
                            : "Henüz bildiriminiz yok"}
                    </p>
                </div>
            ) : (
                // Grouped list
                <div className="space-y-6">
                    {nonEmptyGroups.map(([group, items]) => (
                        <div key={group}>
                            <h3 className="text-sm font-medium text-muted-foreground mb-3">
                                {TIME_GROUP_LABELS[group]}
                            </h3>
                            <div className="space-y-2">
                                {items.map((notification) => (
                                    <NotificationItem
                                        key={notification.id}
                                        notification={notification}
                                        onMarkAsRead={onMarkAsRead}
                                        onMarkAsUnread={onMarkAsUnread}
                                        onDelete={onDelete}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
