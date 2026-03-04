/**
 * Children Selector Component - Select children for booking
 */

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Baby, AlertCircle } from "lucide-react";

interface Child {
    id: string;
    name: string;
    age: number;
    grade?: string;
    allergies?: string;
    notes?: string;
}

interface ChildrenSelectorProps {
    selectedChildrenIds: string[];
    onSelectionChange: (childrenIds: string[]) => void;
    specialRequirements: string;
    onSpecialRequirementsChange: (text: string) => void;
}

export function ChildrenSelector({
    selectedChildrenIds,
    onSelectionChange,
    specialRequirements,
    onSpecialRequirementsChange,
}: ChildrenSelectorProps) {
    // TODO: Fetch from Supabase - parent's children
    const mockChildren: Child[] = [
        {
            id: "1",
            name: "Ali",
            age: 5,
            grade: "Anaokulu",
            allergies: "Yok",
        },
        {
            id: "2",
            name: "Elif",
            age: 3,
            allergies: "Fındık",
            notes: "Çok utangaç olabilir",
        },
        {
            id: "3",
            name: "Mehmet",
            age: 8,
            grade: "2. Sınıf",
        },
    ];

    const handleToggleChild = (childId: string) => {
        if (selectedChildrenIds.includes(childId)) {
            onSelectionChange(selectedChildrenIds.filter((id) => id !== childId));
        } else {
            onSelectionChange([...selectedChildrenIds, childId]);
        }
    };

    return (
        <div className="space-y-6">
            {/* Children List */}
            <div>
                <Label className="text-base font-semibold mb-3 block">
                    Hangi çocuk/çocuklar için?
                </Label>
                <div className="space-y-3">
                    {mockChildren.map((child) => (
                        <Card
                            key={child.id}
                            className={`cursor-pointer transition-colors hover:border-primary ${selectedChildrenIds.includes(child.id)
                                    ? "border-primary bg-primary/5"
                                    : ""
                                }`}
                            onClick={() => handleToggleChild(child.id)}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                    <Checkbox
                                        checked={selectedChildrenIds.includes(child.id)}
                                        onCheckedChange={() => handleToggleChild(child.id)}
                                        className="mt-1"
                                    />

                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Baby className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-semibold">{child.name}</span>
                                            <Badge variant="secondary" className="text-xs">
                                                {child.age} yaş
                                            </Badge>
                                            {child.grade && (
                                                <Badge variant="outline" className="text-xs">
                                                    {child.grade}
                                                </Badge>
                                            )}
                                        </div>

                                        {child.allergies && child.allergies !== "Yok" && (
                                            <div className="flex items-center gap-1 text-sm text-amber-600 mt-2">
                                                <AlertCircle className="h-3 w-3" />
                                                <span>Alerji: {child.allergies}</span>
                                            </div>
                                        )}

                                        {child.notes && (
                                            <p className="text-sm text-muted-foreground mt-2">
                                                {child.notes}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Selected Count */}
            {selectedChildrenIds.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-900">
                        <span className="font-semibold">{selectedChildrenIds.length}</span>{" "}
                        çocuk seçildi
                    </p>
                </div>
            )}

            {/* Special Requirements */}
            <div>
                <Label className="text-base font-semibold mb-3 block">
                    Özel İstekler veya Notlar (Opsiyonel)
                </Label>
                <Textarea
                    placeholder="Örneğin: Ödevlerine yardımcı olmalı, park'da yürüyüş yapabilir, vb..."
                    value={specialRequirements}
                    onChange={(e) => onSpecialRequirementsChange(e.target.value)}
                    className="min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground mt-2">
                    Bakıcı ile paylaşılacak özel taleplerinizi buraya yazabilirsiniz
                </p>
            </div>

            {/* No Children Warning */}
            {mockChildren.length === 0 && (
                <div className="text-center py-8">
                    <Baby className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground mb-3">
                        Henüz çocuk profili eklemediniz
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Rezervasyon yapmadan önce çocuk profili eklemeniz gerekmektedir
                    </p>
                </div>
            )}

            {/* Validation Message */}
            {selectedChildrenIds.length === 0 && mockChildren.length > 0 && (
                <p className="text-sm text-amber-600 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Lütfen en az bir çocuk seçin
                </p>
            )}
        </div>
    );
}
