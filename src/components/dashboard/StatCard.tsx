/**
 * Stat Card - Reusable statistics card component
 */

import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
    icon: LucideIcon;
    label: string;
    value: string | number;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    iconColor?: string;
    iconBgColor?: string;
}

export function StatCard({
    icon: Icon,
    label,
    value,
    trend,
    iconColor = "text-blue-600",
    iconBgColor = "bg-blue-100",
}: StatCardProps) {
    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">{label}</p>
                        <p className="text-3xl font-bold">{value}</p>
                        {trend && (
                            <p
                                className={cn(
                                    "text-xs font-medium",
                                    trend.isPositive ? "text-green-600" : "text-red-600"
                                )}
                            >
                                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
                            </p>
                        )}
                    </div>
                    <div className={cn("rounded-lg p-3", iconBgColor)}>
                        <Icon className={cn("h-6 w-6", iconColor)} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
