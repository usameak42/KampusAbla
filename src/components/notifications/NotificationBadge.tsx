/**
 * NotificationBadge - Unread count badge for headers/navbars
 */

import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationBadgeProps {
    count: number;
    onClick?: () => void;
    className?: string;
}

export function NotificationBadge({ count, onClick, className }: NotificationBadgeProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "relative p-2 rounded-full hover:bg-muted transition-colors",
                className
            )}
        >
            <Bell className="h-5 w-5" />
            {count > 0 && (
                <span
                    className={cn(
                        "absolute -top-0.5 -right-0.5 flex items-center justify-center",
                        "min-w-[18px] h-[18px] px-1 rounded-full",
                        "bg-red-500 text-white text-xs font-medium",
                        "animate-in zoom-in-50 duration-200"
                    )}
                >
                    {count > 99 ? "99+" : count}
                </span>
            )}
        </button>
    );
}
