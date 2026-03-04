/**
 * ChildrenList - Display list of children with actions
 */

import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChildCard } from "./ChildCard";
import type { Child } from "@/types/child";

interface ChildrenListProps {
    children: Child[];
    isLoading?: boolean;
    onAddChild: () => void;
    onEditChild: (child: Child) => void;
    onDeleteChild: (childId: string) => void;
    onViewChild?: (child: Child) => void;
}

export function ChildrenList({
    children,
    isLoading = false,
    onAddChild,
    onEditChild,
    onDeleteChild,
    onViewChild,
}: ChildrenListProps) {
    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2].map((i) => (
                    <div key={i} className="h-40 bg-muted animate-pulse rounded-xl" />
                ))}
            </div>
        );
    }

    if (children.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center mb-4">
                    <Users className="h-10 w-10 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Henüz çocuk eklenmemiş</h3>
                <p className="text-muted-foreground mb-6 max-w-sm">
                    Çocuklarınızın profillerini ekleyerek bakıcılarla daha iyi eşleşme sağlayabilirsiniz.
                </p>
                <Button
                    onClick={onAddChild}
                    className="bg-gradient-to-r from-violet-600 to-purple-600"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Çocuk Ekle
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    {children.length} çocuk kayıtlı
                </p>
                <Button onClick={onAddChild} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Çocuk Ekle
                </Button>
            </div>

            {/* List */}
            <div className="space-y-3">
                {children.map((child) => (
                    <ChildCard
                        key={child.id}
                        child={child}
                        onEdit={onEditChild}
                        onDelete={onDeleteChild}
                        onViewDetails={onViewChild}
                    />
                ))}
            </div>
        </div>
    );
}
