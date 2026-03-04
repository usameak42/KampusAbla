import { Eye, EyeOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface VisibilityToggleProps {
    visible: boolean;
    onChange: (visible: boolean) => void;
    disabled?: boolean;
}

export function VisibilityToggle({
    visible,
    onChange,
    disabled = false,
}: VisibilityToggleProps) {
    return (
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
            <Switch
                id="visibility-toggle"
                checked={visible}
                onCheckedChange={onChange}
                disabled={disabled}
            />
            <div className="flex items-center gap-2 flex-1">
                {visible ? (
                    <Eye className="h-4 w-4 text-green-600" />
                ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                )}
                <Label
                    htmlFor="visibility-toggle"
                    className="text-sm cursor-pointer flex-1"
                >
                    {visible
                        ? 'Bu degerlendirme aileye gorunur olacak'
                        : 'Bu degerlendirme sadece benim icin (aile gormeyecek)'}
                </Label>
            </div>
        </div>
    );
}
