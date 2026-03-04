import { Star } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface StarRatingQuestionProps {
    questionKey: string;
    label: string;
    description: string;
    value: number;
    onChange: (key: string, value: number) => void;
    disabled?: boolean;
}

export function StarRatingQuestion({
    questionKey,
    label,
    description,
    value,
    onChange,
    disabled = false,
}: StarRatingQuestionProps) {
    const [hovered, setHovered] = useState(0);
    const displayValue = hovered || value;

    const ratingLabels: Record<number, string> = {
        1: 'Cok kotu',
        2: 'Kotu',
        3: 'Orta',
        4: 'Iyi',
        5: 'Mukemmel',
    };

    return (
        <div className="space-y-2 p-4 rounded-lg bg-muted/30">
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <p className="font-medium text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            disabled={disabled}
                            onClick={() => onChange(questionKey, star)}
                            onMouseEnter={() => setHovered(star)}
                            onMouseLeave={() => setHovered(0)}
                            className={cn(
                                'p-0.5 transition-transform hover:scale-110',
                                disabled && 'cursor-not-allowed opacity-50'
                            )}
                        >
                            <Star
                                className={cn(
                                    'h-6 w-6 transition-colors',
                                    star <= displayValue
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                )}
                            />
                        </button>
                    ))}
                </div>
            </div>
            {displayValue > 0 && (
                <p className="text-xs text-right text-muted-foreground">
                    {ratingLabels[displayValue]}
                </p>
            )}
        </div>
    );
}
