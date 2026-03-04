import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Users, Baby } from 'lucide-react';

import { StarRatingQuestion } from './StarRatingQuestion';
import { TagSelector } from './TagSelector';
import { SafetyFlagSection } from './SafetyFlagSection';
import { VisibilityToggle } from './VisibilityToggle';

import {
    SITTER_TO_FAMILY_QUESTIONS,
    SITTER_TO_CHILD_QUESTIONS,
    SITTER_FAMILY_TAGS,
    SITTER_CHILD_TAGS,
    SITTER_SAFETY_FLAGS,
    calculateOverallFromDetailed,
    validateMinimumRatings,
    hasReportTrigger,
} from '@/constants/reviewQuestions';

import type { DetailedReviewSubmission, ChildReviewData } from '@/types/review';

interface SitterReviewFormProps {
    sessionId: string;
    bookingId: string;
    familyId: string;
    familyName: string;
    children: Array<{ id: string; name: string }>;
    onSubmit: (data: DetailedReviewSubmission) => Promise<void>;
    onReportTrigger: (type: 'family' | 'child', id: string) => void;
    onCancel?: () => void;
    isLoading?: boolean;
}

interface FormState {
    familyRatings: Record<string, number>;
    familyTags: string[];
    familyFlags: Record<string, boolean>;
    tipForFamily: string;
    childReviews: Record<string, {
        ratings: Record<string, number>;
        tags: string[];
        tip: string;
        visibleToFamily: boolean;
    }>;
}

export function SitterReviewForm({
    sessionId,
    bookingId,
    familyId,
    familyName,
    children,
    onSubmit,
    onReportTrigger,
    onCancel,
    isLoading = false,
}: SitterReviewFormProps) {
    const [activeTab, setActiveTab] = useState('family');
    const [formState, setFormState] = useState<FormState>({
        familyRatings: {},
        familyTags: [],
        familyFlags: {},
        tipForFamily: '',
        childReviews: children.reduce((acc, child) => ({
            ...acc,
            [child.id]: { ratings: {}, tags: [], tip: '', visibleToFamily: false },
        }), {}),
    });

    // Handlers
    const handleFamilyRatingChange = (key: string, value: number) => {
        setFormState((prev) => ({
            ...prev,
            familyRatings: { ...prev.familyRatings, [key]: value },
        }));
    };

    const handleFamilyTagToggle = (tagKey: string) => {
        setFormState((prev) => ({
            ...prev,
            familyTags: prev.familyTags.includes(tagKey)
                ? prev.familyTags.filter((t) => t !== tagKey)
                : [...prev.familyTags, tagKey],
        }));
    };

    const handleFamilyFlagChange = (key: string, value: boolean) => {
        setFormState((prev) => ({
            ...prev,
            familyFlags: { ...prev.familyFlags, [key]: value },
        }));
        if (value && SITTER_SAFETY_FLAGS.find((f) => f.key === key)?.triggersReport) {
            onReportTrigger('family', familyId);
        }
    };

    const handleChildRatingChange = (childId: string, key: string, value: number) => {
        setFormState((prev) => ({
            ...prev,
            childReviews: {
                ...prev.childReviews,
                [childId]: {
                    ...prev.childReviews[childId],
                    ratings: { ...prev.childReviews[childId].ratings, [key]: value },
                },
            },
        }));
    };

    const handleChildTagToggle = (childId: string, tagKey: string) => {
        setFormState((prev) => {
            const currentTags = prev.childReviews[childId].tags;
            return {
                ...prev,
                childReviews: {
                    ...prev.childReviews,
                    [childId]: {
                        ...prev.childReviews[childId],
                        tags: currentTags.includes(tagKey)
                            ? currentTags.filter((t) => t !== tagKey)
                            : [...currentTags, tagKey],
                    },
                },
            };
        });
    };

    // Validation
    const familyValidation = validateMinimumRatings(formState.familyRatings, 3);
    const childValidations = children.map((child) => ({
        childId: child.id,
        ...validateMinimumRatings(formState.childReviews[child.id]?.ratings || {}, 2),
    }));
    const allChildrenValid = childValidations.every((v) => v.valid);
    const canSubmit = familyValidation.valid && allChildrenValid;

    // Submit
    const handleSubmit = async () => {
        if (!canSubmit) return;

        const childReviewsData: ChildReviewData[] = children.map((child) => ({
            childId: child.id,
            childName: child.name,
            ratings: formState.childReviews[child.id].ratings,
            tags: formState.childReviews[child.id].tags,
            tipForNextSitter: formState.childReviews[child.id].tip || undefined,
            visibleToFamily: formState.childReviews[child.id].visibleToFamily,
        }));

        await onSubmit({
            sessionId,
            bookingId,
            reviewType: 'sitter_to_family',
            revieweeId: familyId,
            revieweeName: familyName,
            revieweeRole: 'parent',
            ratings: formState.familyRatings,
            selectedTags: formState.familyTags,
            flags: formState.familyFlags,
            tipForNextSitter: formState.tipForFamily || undefined,
            childReviews: childReviewsData,
        });
    };

    return (
        <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="family" className="gap-2">
                        <Users className="h-4 w-4" />
                        Aile / Ebeveyn
                    </TabsTrigger>
                    <TabsTrigger value="children" className="gap-2">
                        <Baby className="h-4 w-4" />
                        Cocuk ({children.length})
                    </TabsTrigger>
                </TabsList>

                {/* TAB 1: Family */}
                <TabsContent value="family" className="space-y-6 mt-4">
                    {/* Star Questions */}
                    <div className="space-y-2">
                        <Label className="text-base font-semibold">Degerlendirme Soruları</Label>
                        <p className="text-xs text-muted-foreground">
                            En az 3 soruyu puanlamanız gerekmektedir.
                        </p>
                        <div className="space-y-2">
                            {SITTER_TO_FAMILY_QUESTIONS.map((q) => (
                                <StarRatingQuestion
                                    key={q.key}
                                    questionKey={q.key}
                                    label={q.label}
                                    description={q.description}
                                    value={formState.familyRatings[q.key] || 0}
                                    onChange={handleFamilyRatingChange}
                                    disabled={isLoading}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Safety Flags */}
                    <SafetyFlagSection
                        flags={SITTER_SAFETY_FLAGS}
                        values={formState.familyFlags}
                        onChange={handleFamilyFlagChange}
                        disabled={isLoading}
                    />

                    {/* Tags */}
                    <TagSelector
                        title="Etiketler (Opsiyonel)"
                        positiveTags={SITTER_FAMILY_TAGS.positive}
                        negativeTags={SITTER_FAMILY_TAGS.negative}
                        selectedTags={formState.familyTags}
                        onToggle={handleFamilyTagToggle}
                        disabled={isLoading}
                    />

                    {/* Tip for next sitter */}
                    <div className="space-y-2">
                        <Label htmlFor="tip-family">
                            Sonraki bakıcıya ipucu (Opsiyonel)
                        </Label>
                        <Textarea
                            id="tip-family"
                            value={formState.tipForFamily}
                            onChange={(e) =>
                                setFormState((prev) => ({
                                    ...prev,
                                    tipForFamily: e.target.value,
                                }))
                            }
                            placeholder="Diger bakıcılara yardımcı olacak ipucları..."
                            maxLength={500}
                            className="resize-none"
                            disabled={isLoading}
                        />
                        <p className="text-xs text-muted-foreground text-right">
                            {formState.tipForFamily.length}/500
                        </p>
                    </div>
                </TabsContent>

                {/* TAB 2: Children */}
                <TabsContent value="children" className="space-y-6 mt-4">
                    {children.map((child, index) => (
                        <div key={child.id} className="border rounded-lg p-4 space-y-4">
                            <h3 className="font-semibold text-lg">{child.name}</h3>

                            {/* Child Star Questions */}
                            <div className="space-y-2">
                                {SITTER_TO_CHILD_QUESTIONS.map((q) => (
                                    <StarRatingQuestion
                                        key={q.key}
                                        questionKey={q.key}
                                        label={q.label}
                                        description={q.description}
                                        value={formState.childReviews[child.id]?.ratings[q.key] || 0}
                                        onChange={(key, value) =>
                                            handleChildRatingChange(child.id, key, value)
                                        }
                                        disabled={isLoading}
                                    />
                                ))}
                            </div>

                            {/* Child Tags */}
                            <TagSelector
                                title="Etiketler (Opsiyonel)"
                                positiveTags={SITTER_CHILD_TAGS.positive}
                                negativeTags={SITTER_CHILD_TAGS.negative}
                                selectedTags={formState.childReviews[child.id]?.tags || []}
                                onToggle={(tagKey) => handleChildTagToggle(child.id, tagKey)}
                                disabled={isLoading}
                            />

                            {/* Child Tip */}
                            <div className="space-y-2">
                                <Label>Sonraki bakıcıya ipucu (Opsiyonel)</Label>
                                <Textarea
                                    value={formState.childReviews[child.id]?.tip || ''}
                                    onChange={(e) =>
                                        setFormState((prev) => ({
                                            ...prev,
                                            childReviews: {
                                                ...prev.childReviews,
                                                [child.id]: {
                                                    ...prev.childReviews[child.id],
                                                    tip: e.target.value,
                                                },
                                            },
                                        }))
                                    }
                                    placeholder="Bu cocuk hakkında ipucları..."
                                    maxLength={500}
                                    className="resize-none"
                                    disabled={isLoading}
                                />
                                <p className="text-xs text-muted-foreground text-right">
                                    {(formState.childReviews[child.id]?.tip || '').length}/500
                                </p>
                            </div>

                            {/* Visibility Toggle */}
                            <VisibilityToggle
                                visible={formState.childReviews[child.id]?.visibleToFamily || false}
                                onChange={(visible) =>
                                    setFormState((prev) => ({
                                        ...prev,
                                        childReviews: {
                                            ...prev.childReviews,
                                            [child.id]: {
                                                ...prev.childReviews[child.id],
                                                visibleToFamily: visible,
                                            },
                                        },
                                    }))
                                }
                                disabled={isLoading}
                            />
                        </div>
                    ))}
                </TabsContent>
            </Tabs>

            {/* Validation Messages */}
            {!familyValidation.valid && (
                <p className="text-sm text-amber-600">
                    Aile sekmesinde {familyValidation.missing} soru daha puanlamanız gerekiyor.
                </p>
            )}
            {!allChildrenValid && (
                <p className="text-sm text-amber-600">
                    Tum cocuklar icin en az 2 soru puanlamanız gerekiyor.
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
