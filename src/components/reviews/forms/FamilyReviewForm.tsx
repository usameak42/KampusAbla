import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, CheckCircle } from 'lucide-react';

import { StarRatingQuestion } from './StarRatingQuestion';
import { TagSelector } from './TagSelector';

import {
    FAMILY_TO_SITTER_QUESTIONS,
    FAMILY_SITTER_TAGS,
    FAMILY_CONFIRMATIONS,
    calculateOverallFromDetailed,
    validateMinimumRatings,
} from '@/constants/reviewQuestions';

import type { DetailedReviewSubmission } from '@/types/review';

interface FamilyReviewFormProps {
    sessionId: string;
    bookingId: string;
    sitterId: string;
    sitterName: string;
    sitterPhoto?: string;
    onSubmit: (data: DetailedReviewSubmission) => Promise<void>;
    onReportTrigger: () => void;
    onCancel?: () => void;
    isLoading?: boolean;
}

export function FamilyReviewForm({
    sessionId,
    bookingId,
    sitterId,
    sitterName,
    sitterPhoto,
    onSubmit,
    onReportTrigger,
    onCancel,
    isLoading = false,
}: FamilyReviewFormProps) {
    const [ratings, setRatings] = useState<Record<string, number>>({});
    const [tags, setTags] = useState<string[]>([]);
    const [confirmations, setConfirmations] = useState<Record<string, boolean>>({});
    const [comment, setComment] = useState('');

    // Handlers
    const handleRatingChange = (key: string, value: number) => {
        setRatings((prev) => ({ ...prev, [key]: value }));
    };

    const handleTagToggle = (tagKey: string) => {
        setTags((prev) =>
            prev.includes(tagKey) ? prev.filter((t) => t !== tagKey) : [...prev, tagKey]
        );
    };

    const handleConfirmationChange = (key: string, checked: boolean) => {
        setConfirmations((prev) => ({ ...prev, [key]: checked }));

        // Check if unchecking the safety confirmation
        const flag = FAMILY_CONFIRMATIONS.find((f) => f.key === key);
        if (!checked && flag?.triggersReport) {
            onReportTrigger();
        }
    };

    // Validation
    const validation = validateMinimumRatings(ratings, 3);
    const canSubmit = validation.valid;

    // Submit
    const handleSubmit = async () => {
        if (!canSubmit) return;

        await onSubmit({
            sessionId,
            bookingId,
            reviewType: 'family_to_sitter',
            revieweeId: sitterId,
            revieweeName: sitterName,
            revieweeRole: 'sitter',
            ratings,
            selectedTags: tags,
            confirmations,
            freeComment: comment || undefined,
        });
    };

    return (
        <div className="space-y-6">
            {/* Sitter Info */}
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                <Avatar className="h-14 w-14">
                    <AvatarImage src={sitterPhoto} />
                    <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-lg">
                        {sitterName.charAt(0)}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <p className="text-sm text-muted-foreground">Bakıcı degerlendirmesi</p>
                    <p className="font-semibold text-lg">{sitterName}</p>
                </div>
            </div>

            {/* Star Questions */}
            <div className="space-y-2">
                <Label className="text-base font-semibold">Degerlendirme Soruları</Label>
                <p className="text-xs text-muted-foreground">
                    En az 3 soruyu puanlamanız gerekmektedir.
                </p>
                <div className="space-y-2">
                    {FAMILY_TO_SITTER_QUESTIONS.map((q) => (
                        <StarRatingQuestion
                            key={q.key}
                            questionKey={q.key}
                            label={q.label}
                            description={q.description}
                            value={ratings[q.key] || 0}
                            onChange={handleRatingChange}
                            disabled={isLoading}
                        />
                    ))}
                </div>
            </div>

            {/* Confirmations */}
            <div className="space-y-3 p-4 border rounded-lg bg-green-50/50 border-green-200">
                <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-4 w-4" />
                    <p className="text-sm font-medium">Onay Maddeleri (Opsiyonel)</p>
                </div>
                <div className="space-y-3">
                    {FAMILY_CONFIRMATIONS.map((item) => (
                        <div key={item.key} className="flex items-start gap-3">
                            <Checkbox
                                id={item.key}
                                checked={confirmations[item.key] || false}
                                onCheckedChange={(checked) =>
                                    handleConfirmationChange(item.key, checked as boolean)
                                }
                                disabled={isLoading}
                            />
                            <div className="flex-1">
                                <Label htmlFor={item.key} className="text-sm cursor-pointer">
                                    {item.label}
                                </Label>
                                {item.description && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {item.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tags */}
            <TagSelector
                title="Etiketler (Opsiyonel)"
                positiveTags={FAMILY_SITTER_TAGS.positive}
                negativeTags={FAMILY_SITTER_TAGS.negative}
                selectedTags={tags}
                onToggle={handleTagToggle}
                disabled={isLoading}
            />

            {/* Comment */}
            <div className="space-y-2">
                <Label htmlFor="comment">Yorum (Opsiyonel)</Label>
                <Textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Deneyiminizi paylaşın..."
                    maxLength={800}
                    className="min-h-[100px] resize-none"
                    disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground text-right">
                    {comment.length}/800
                </p>
            </div>

            {/* Validation */}
            {!validation.valid && (
                <p className="text-sm text-amber-600">
                    {validation.missing} soru daha puanlamanız gerekiyor.
                </p>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
                {onCancel && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        className="flex-1"
                        disabled={isLoading}
                    >
                        Daha Sonra
                    </Button>
                )}
                <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!canSubmit || isLoading}
                    className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Gonderiliyor...
                        </>
                    ) : (
                        'Degerlendirmeyi Gonder'
                    )}
                </Button>
            </div>
        </div>
    );
}
