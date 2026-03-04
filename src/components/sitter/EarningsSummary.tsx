import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { formatPrice } from "@/types/subscription";

interface EarningsSummaryProps {
    balances: {
        totalEarnings: number;
        totalPaidOut: number;
        pendingPayouts: number;
        availableBalance: number;
    };
}

export function EarningsSummary({ balances }: EarningsSummaryProps) {
    const stats = [
        {
            title: "Kullanılabilir Bakiye",
            value: formatPrice(balances.availableBalance),
            icon: Wallet,
            color: "text-primary",
            bg: "bg-primary/10",
        },
        {
            title: "Toplam Kazanç",
            value: formatPrice(balances.totalEarnings),
            icon: TrendingUp,
            color: "text-green-600",
            bg: "bg-green-100",
        },
        {
            title: "Bekleyen Ödemeler",
            value: formatPrice(balances.pendingPayouts),
            icon: Clock,
            color: "text-amber-600",
            bg: "bg-amber-100",
        },
        {
            title: "Tamamlanan Ödemeler",
            value: formatPrice(balances.totalPaidOut),
            icon: CheckCircle,
            color: "text-blue-600",
            bg: "bg-blue-100",
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
                <Card key={index} className="border-none shadow-sm overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {stat.title}
                        </CardTitle>
                        <div className={`p-2 rounded-full ${stat.bg}`}>
                            <stat.icon className={`h-4 w-4 ${stat.color}`} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stat.value}</div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
