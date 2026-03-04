/**
 * ChildCard - Display a single child's profile
 */

import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
    User,
    GraduationCap,
    Languages,
    AlertTriangle,
    MapPin,
    Clock,
    MoreVertical,
    Pencil,
    Trash2,
    Apple,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Child } from "@/types/child";
import { calculateAge, getGradeLabel, getLanguageLabel, SEVERITY_LABELS } from "@/types/child";

interface ChildCardProps {
    child: Child;
    onEdit?: (child: Child) => void;
    onDelete?: (childId: string) => void;
    onViewDetails?: (child: Child) => void;
}

export function ChildCard({ child, onEdit, onDelete, onViewDetails }: ChildCardProps) {
    const age = calculateAge(child.dateOfBirth);
    const hasAllergies = child.allergies.length > 0;
    const hasSevereAllergy = child.allergies.some((a) => a.severity === "severe");

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <Avatar className="h-16 w-16 cursor-pointer" onClick={() => onViewDetails?.(child)}>
                        <AvatarImage src={child.photo} />
                        <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white text-xl">
                            {child.name.charAt(0)}
                        </AvatarFallback>
                    </Avatar>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <h3
                                    className="font-semibold text-lg cursor-pointer hover:text-primary"
                                    onClick={() => onViewDetails?.(child)}
                                >
                                    {child.name}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {age} yaşında • {child.gender === "male" ? "Erkek" : child.gender === "female" ? "Kız" : "Diğer"}
                                </p>
                            </div>

                            {/* Actions Menu */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => onEdit?.(child)}>
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Düzenle
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="text-red-600"
                                        onClick={() => onDelete?.(child.id)}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Sil
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1.5 mt-3">
                            {/* Grade */}
                            <Badge variant="secondary" className="gap-1">
                                <GraduationCap className="h-3 w-3" />
                                {getGradeLabel(child.grade)}
                            </Badge>

                            {/* Languages */}
                            {child.languages.length > 0 && (
                                <Badge variant="outline" className="gap-1">
                                    <Languages className="h-3 w-3" />
                                    {child.languages.slice(0, 2).map(getLanguageLabel).join(", ")}
                                    {child.languages.length > 2 && ` +${child.languages.length - 2}`}
                                </Badge>
                            )}

                            {/* Allergy Warning */}
                            {hasAllergies && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Badge
                                                variant="outline"
                                                className={`gap-1 ${hasSevereAllergy
                                                    ? "border-red-500 text-red-600 bg-red-50"
                                                    : "border-orange-400 text-orange-600 bg-orange-50"
                                                    }`}
                                            >
                                                <AlertTriangle className="h-3 w-3" />
                                                {child.allergies.length} Alerji
                                            </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <ul className="text-sm space-y-1">
                                                {child.allergies.map((allergy, idx) => (
                                                    <li key={idx}>
                                                        <span className="font-medium">{allergy.details || allergy.type}</span>
                                                        <span className="text-muted-foreground ml-1">
                                                            ({SEVERITY_LABELS[allergy.severity]})
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}

                            {/* Dietary Restrictions */}
                            {child.dietaryRestrictions.length > 0 && (
                                <Badge variant="outline" className="gap-1 border-green-400 text-green-600">
                                    <Apple className="h-3 w-3" />
                                    {child.dietaryRestrictions[0]}
                                </Badge>
                            )}
                        </div>

                        {/* Notes */}
                        {child.notes && (
                            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                                {child.notes}
                            </p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
