/**
 * Sitter Registration - Step 3: Service Details
 * Hourly rate and bio
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Loader2 } from "lucide-react";
import { SitterFormData } from "@/pages/register/SitterRegistration";

interface SitterStep3Props {
    formData: Partial<SitterFormData>;
    updateFormData: (data: Partial<SitterFormData>) => void;
    onNext: () => void;
    onBack: () => void;
}

export function SitterStep3({ formData, updateFormData, onNext, onBack }: SitterStep3Props) {
    const [isLoading, setIsLoading] = useState(false);
    // KA-034: Price input range 450–2000
    const [hourlyRate, setHourlyRate] = useState(formData.hourlyRate || 450);
    const [bio, setBio] = useState(formData.bio || "");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // KA-031: "Introduce yourself" mandatory (min 50 chars)
        if (bio.length < 50) {
            alert("Lütfen kendinizi tanıtın (en az 50 karakter).");
            setIsLoading(false);
            return;
        }

        updateFormData({
            hourlyRate,
            bio,
        });

        setTimeout(() => {
            setIsLoading(false);
            onNext();
        }, 500);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Hizmet Detayları</h2>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="hourlyRate">Saatlik Ücret: ₺{hourlyRate}</Label>
                    <Slider
                        id="hourlyRate"
                        min={450}
                        max={2000}
                        step={10}
                        value={[hourlyRate]}
                        onValueChange={(value) => setHourlyRate(value[0])}
                        className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>₺450</span>
                        <span>₺2000</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Platform kuralı: Saatlik ücret 450₺ - 2000₺ arasında olmalıdır.
                    </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-sm text-blue-900 mb-2">Ücret Hesaplama</h4>
                    <div className="space-y-1 text-xs text-blue-800">
                        <p>• 2 saatlik bakım: <strong>₺{hourlyRate * 2}</strong></p>
                        <p>• 4 saatlik bakım: <strong>₺{hourlyRate * 4}</strong></p>
                        <p className="text-xs text-blue-600 mt-2">
                            * Platform komisyonu %10 (veliye yansıtılır)
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="bio">Kendinizi Tanıtın *</Label>
                <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Velilere kendinizi tanıtın. Deneyimleriniz, ilgi alanlarınız, çocuklarla çalışma tecrübeniz..."
                    rows={5}
                    maxLength={500}
                    required
                    disabled={isLoading}
                />
                <p className={`text-xs text-right ${bio.length < 50 ? "text-red-500" : "text-muted-foreground"}`}>
                    {bio.length}/500 karakter (Min. 50)
                </p>
            </div>

            <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={onBack} disabled={isLoading} className="flex-1">
                    Geri
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Devam Et
                </Button>
            </div>
        </form>
    );
}
