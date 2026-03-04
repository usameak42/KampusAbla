/**
 * PlanCard - Individual subscription plan display
 */

import { Check, X, Star, Crown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SubscriptionPlan, BillingCycle } from "@/types/subscription";
import { formatPrice, calculateYearlySavings } from "@/types/subscription";

interface PlanCardProps {
    plan: SubscriptionPlan;
    billingCycle: BillingCycle;
    isCurrentPlan?: boolean;
    onSelect?: (planId: string) => void;
    disabled?: boolean;
}

export function PlanCard({
    plan,
    billingCycle,
    isCurrentPlan = false,
    onSelect,
    disabled = false,
}: PlanCardProps) {
    const price = billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
    const monthlyEquivalent = billingCycle === "yearly" ? Math.round(plan.yearlyPrice / 12) : plan.monthlyPrice;
    const savings = calculateYearlySavings(plan);

    const getTierIcon = () => {
        switch (plan.tier) {
            case "premium":
            case "pro":
                return <Star className="h-4 w-4" />;
            case "family":
            case "elite":
                return <Crown className="h-4 w-4" />;
            default:
                return <Zap className="h-4 w-4" />;
        }
    };

    return (
        <Card
            className={cn(
                "relative transition-all duration-200",
                isCurrentPlan && "border-purple-500 border-2",
                plan.isPopular && !isCurrentPlan && "border-purple-300",
                "hover:shadow-lg hover:scale-[1.02]"
            )}
        >
            {/* Popular badge */}
            {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-purple-500 to-violet-500 text-white">
                        En Popüler
                    </Badge>
                </div>
            )}

            {/* Badge */}
            {plan.badge && !plan.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="secondary">{plan.badge}</Badge>
                </div>
            )}

            {/* Current plan indicator */}
            {isCurrentPlan && (
                <div className="absolute -top-3 right-3">
                    <Badge className="bg-green-500 text-white">Mevcut Plan</Badge>
                </div>
            )}

            <CardHeader className="text-center pt-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center",
                        plan.tier === "free" || plan.tier === "starter"
                            ? "bg-gray-100"
                            : plan.tier === "premium" || plan.tier === "pro"
                                ? "bg-purple-100 text-purple-600"
                                : "bg-gradient-to-br from-amber-100 to-orange-100 text-amber-600"
                    )}>
                        {getTierIcon()}
                    </div>
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
            </CardHeader>

            <CardContent className="text-center">
                {/* Pricing */}
                <div className="mb-6">
                    <div className="flex items-baseline justify-center gap-1">
                        <span className="text-3xl font-bold">{formatPrice(price)}</span>
                        {price > 0 && (
                            <span className="text-sm text-muted-foreground">
                                /{billingCycle === "yearly" ? "yıl" : "ay"}
                            </span>
                        )}
                    </div>
                    {billingCycle === "yearly" && price > 0 && (
                        <div className="mt-1 space-y-1">
                            <p className="text-sm text-muted-foreground">
                                aylık ₺{monthlyEquivalent}
                            </p>
                            {savings > 0 && (
                                <Badge variant="outline" className="text-green-600 border-green-300">
                                    ₺{savings} tasarruf
                                </Badge>
                            )}
                        </div>
                    )}
                </div>

                {/* Features */}
                <ul className="space-y-2 text-left mb-6">
                    {plan.features.map((feature) => (
                        <li
                            key={feature.id}
                            className={cn(
                                "flex items-start gap-2 text-sm",
                                !feature.included && "text-muted-foreground"
                            )}
                        >
                            {feature.included ? (
                                <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            ) : (
                                <X className="h-4 w-4 text-gray-300 mt-0.5 flex-shrink-0" />
                            )}
                            <span>
                                {feature.name}
                                {feature.limit && feature.included && (
                                    <span className="text-muted-foreground ml-1">
                                        ({feature.limit === "unlimited" ? "Sınırsız" : feature.limit})
                                    </span>
                                )}
                            </span>
                        </li>
                    ))}
                </ul>

                {/* CTA Button */}
                <Button
                    onClick={() => onSelect?.(plan.id)}
                    disabled={disabled || isCurrentPlan}
                    className={cn(
                        "w-full",
                        plan.isPopular && !isCurrentPlan
                            ? "bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600"
                            : ""
                    )}
                    variant={isCurrentPlan ? "secondary" : plan.isPopular ? "default" : "outline"}
                >
                    {isCurrentPlan
                        ? "Mevcut Plan"
                        : price === 0
                            ? "Ücretsiz Başla"
                            : "Planı Seç"}
                </Button>
            </CardContent>
        </Card>
    );
}
