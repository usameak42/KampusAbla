import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ReviewTag } from '@/types/review';

interface TagSelectorProps {
    title: string;
    positiveTags: ReviewTag[];
    negativeTags: ReviewTag[];
    selectedTags: string[];
    onToggle: (tagKey: string) => void;
    disabled?: boolean;
}

export function TagSelector({
    title,
    positiveTags,
    negativeTags,
    selectedTags,
    onToggle,
    disabled = false,
}: TagSelectorProps) {
    const isSelected = (key: string) => selectedTags.includes(key);

    return (
        <div className="space-y-3">
            <p className="text-sm font-medium">{title}</p>

            {/* Positive Tags */}
            <div>
                <p className="text-xs text-muted-foreground mb-2">Pozitif</p>
                <div className="flex flex-wrap gap-2">
                    {positiveTags.map((tag) => (
                        <Badge
                            key={tag.key}
                            variant={isSelected(tag.key) ? 'default' : 'outline'}
                            className={cn(
                                'cursor-pointer transition-all',
                                isSelected(tag.key)
                                    ? 'bg-green-500 hover:bg-green-600'
                                    : 'hover:bg-green-100',
                                disabled && 'cursor-not-allowed opacity-50'
                            )}
                            onClick={() => !disabled && onToggle(tag.key)}
                        >
                            {tag.label}
                        </Badge>
                    ))}
                </div>
            </div>

            {/* Negative Tags */}
            <div>
                <p className="text-xs text-muted-foreground mb-2">Zorluk/Negatif</p>
                <div className="flex flex-wrap gap-2">
                    {negativeTags.map((tag) => (
                        <Badge
                            key={tag.key}
                            variant={isSelected(tag.key) ? 'default' : 'outline'}
                            className={cn(
                                'cursor-pointer transition-all',
                                isSelected(tag.key)
                                    ? 'bg-orange-500 hover:bg-orange-600'
                                    : 'hover:bg-orange-100',
                                disabled && 'cursor-not-allowed opacity-50'
                            )}
                            onClick={() => !disabled && onToggle(tag.key)}
                        >
                            {tag.label}
                        </Badge>
                    ))}
                </div>
            </div>
        </div>
    );
}
