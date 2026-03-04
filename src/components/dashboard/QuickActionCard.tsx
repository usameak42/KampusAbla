/**
 * Quick Action Card - Reusable card for quick actions
 */

import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

interface QuickActionCardProps {
    icon: LucideIcon;
    title: string;
    description: string;
    onClick: () => void;
    iconColor?: string;
    iconBgColor?: string;
}

export function QuickActionCard({
    icon: Icon,
    title,
    description,
    onClick,
    iconColor = "text-primary",
    iconBgColor = "bg-primary/10",
}: QuickActionCardProps) {
    return (
        <Card
            className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]"
            onClick={onClick}
        >
            <CardContent className="p-6">
                <div className="flex items-start gap-4">
                    <div className={cn("rounded-lg p-3 shrink-0", iconBgColor)}>
                        <Icon className={cn("h-5 w-5", iconColor)} />
                    </div>
                    <div className="flex-1 space-y-1">
                        <h3 className="font-semibold text-base">{title}</h3>
                        <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
                </div>
            </CardContent>
        </Card>
    );
}
