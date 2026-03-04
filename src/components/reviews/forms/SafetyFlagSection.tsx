import { AlertTriangle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { ReviewFlag } from '@/types/review';

interface SafetyFlagSectionProps {
    flags: ReviewFlag[];
    values: Record<string, boolean>;
    onChange: (key: string, value: boolean) => void;
    onReportTrigger?: () => void;
    disabled?: boolean;
}

export function SafetyFlagSection({
    flags,
    values,
    onChange,
    onReportTrigger,
    disabled = false,
}: SafetyFlagSectionProps) {
    const handleChange = (flag: ReviewFlag, checked: boolean) => {
        onChange(flag.key, checked);
        if (checked && flag.triggersReport && onReportTrigger) {
            onReportTrigger();
        }
    };

    return (
        <div className="space-y-4 p-4 border rounded-lg bg-red-50/50 border-red-200">
            <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-4 w-4" />
                <p className="text-sm font-medium">Guvenlik Soruları (Opsiyonel)</p>
            </div>

            <div className="space-y-3">
                {flags.map((flag) => (
                    <div key={flag.key} className="flex items-start gap-3">
                        <Switch
                            id={flag.key}
                            checked={values[flag.key] || false}
                            onCheckedChange={(checked) => handleChange(flag, checked)}
                            disabled={disabled}
                        />
                        <div className="flex-1">
                            <Label htmlFor={flag.key} className="text-sm cursor-pointer">
                                {flag.label}
                            </Label>
                            {flag.description && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {flag.description}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {Object.values(values).some((v) => v) && (
                <Alert variant="destructive" className="mt-2">
                    <AlertDescription className="text-xs">
                        Bu bilgiler gizli tutulacak ve sadece platform tarafından incelenecektir.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}
