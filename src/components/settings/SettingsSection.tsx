/**
 * SettingsSection - Grouped settings section with header
 */

import { ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SettingsSectionProps {
    title: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
}

export function SettingsSection({
    title,
    description,
    children,
    className,
}: SettingsSectionProps) {
    return (
        <Card className={cn("", className)}>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg">{title}</CardTitle>
                {description && (
                    <CardDescription>{description}</CardDescription>
                )}
            </CardHeader>
            <CardContent className="space-y-1">{children}</CardContent>
        </Card>
    );
}

/**
 * SettingsItem - Individual setting row
 */
interface SettingsItemProps {
    icon?: React.ReactNode;
    label: string;
    description?: string;
    action?: React.ReactNode;
    onClick?: () => void;
    danger?: boolean;
    disabled?: boolean;
}

export function SettingsItem({
    icon,
    label,
    description,
    action,
    onClick,
    danger = false,
    disabled = false,
}: SettingsItemProps) {
    const Wrapper = onClick ? "button" : "div";

    return (
        <Wrapper
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "w-full flex items-center justify-between gap-3 p-3 -mx-3 rounded-lg transition-colors",
                onClick && "hover:bg-muted cursor-pointer",
                danger && "text-red-600",
                disabled && "opacity-50 cursor-not-allowed"
            )}
        >
            <div className="flex items-center gap-3 min-w-0">
                {icon && (
                    <div className={cn(
                        "h-9 w-9 rounded-lg flex items-center justify-center",
                        danger ? "bg-red-100" : "bg-muted"
                    )}>
                        {icon}
                    </div>
                )}
                <div className="min-w-0 text-left">
                    <p className={cn("font-medium text-sm", danger && "text-red-600")}>
                        {label}
                    </p>
                    {description && (
                        <p className="text-xs text-muted-foreground truncate">
                            {description}
                        </p>
                    )}
                </div>
            </div>

            {action ? (
                <div onClick={(e) => e.stopPropagation()}>{action}</div>
            ) : onClick ? (
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            ) : null}
        </Wrapper>
    );
}
