/**
 * Sitter Registration - Step 2: Academic Information
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { SitterFormData } from "@/pages/register/SitterRegistration";
import { sitterStep2Schema } from "@/schemas/registration";

interface SitterStep2Props {
    formData: Partial<SitterFormData>;
    updateFormData: (data: Partial<SitterFormData>) => void;
    onNext: () => void;
    onBack: () => void;
}

const ISTANBUL_UNIVERSITIES = [
    "Boğaziçi Üniversitesi",
    "İstanbul Teknik Üniversitesi",
    "İstanbul Üniversitesi",
    "Marmara Üniversitesi",
    "Yıldız Teknik Üniversitesi",
    "Koç Üniversitesi",
    "Sabancı Üniversitesi",
    "Bahçeşehir Üniversitesi",
    "İstanbul Bilgi Üniversitesi",
    "Kadir Has Üniversitesi",
    "Diğer",
];

const LANGUAGES = [
    { id: "Turkish", label: "Türkçe" },
    { id: "English", label: "İngilizce" },
    { id: "Arabic", label: "Arapça" },
    { id: "German", label: "Almanca" },
    { id: "French", label: "Fransızca" },
    { id: "Russian", label: "Rusça" },
];

export function SitterStep2({ formData, updateFormData, onNext, onBack }: SitterStep2Props) {
    const [isLoading, setIsLoading] = useState(false);
    const [university, setUniversity] = useState(formData.university || "");
    const [department, setDepartment] = useState(formData.department || "");
    const [year, setYear] = useState(formData.year?.toString() || "1");
    // KA-033: Languages not default/mandatory
    const [languages, setLanguages] = useState<string[]>(formData.languages || []);
    const [showOtherLanguages, setShowOtherLanguages] = useState(false);
    const [customLanguages, setCustomLanguages] = useState("");

    const toggleLanguage = (langId: string) => {
        setLanguages((prev) =>
            prev.includes(langId)
                ? prev.filter((id) => id !== langId)
                : [...prev, langId]
        );
    };

    const handleOtherLanguagesChange = (checked: boolean) => {
        setShowOtherLanguages(checked);
        if (!checked) {
            // Remove custom languages when unchecked
            const predefinedIds = LANGUAGES.map(l => l.id);
            setLanguages(prev => prev.filter(lang => predefinedIds.includes(lang)));
            setCustomLanguages("");
        }
    };

    const handleCustomLanguagesInput = (value: string) => {
        setCustomLanguages(value);
        // Parse comma-separated custom languages and add to languages array
        const predefinedIds = LANGUAGES.map(l => l.id);
        const predefinedLangs = languages.filter(lang => predefinedIds.includes(lang));
        const customLangs = value
            .split(",")
            .map(l => l.trim())
            .filter(l => l.length > 0);
        setLanguages([...predefinedLangs, ...customLangs]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const dataToValidate = {
                university,
                department,
                year: parseInt(year),
                languages,
                customUniversity: formData.customUniversity
            };

            sitterStep2Schema.parse(dataToValidate);

            updateFormData({
                university: university === "Diğer" ? (formData.customUniversity || "") : university,
                department,
                year: parseInt(year),
                languages,
            });

            setTimeout(() => {
                setIsLoading(false);
                onNext();
            }, 500);
        } catch (error: unknown) {
            setIsLoading(false);
            if (typeof error === "object" && error !== null && "errors" in error) {
                const typedError = error as { errors: Array<{ message: string }> };
                // Format Zod errors
                const errorMessage = typedError.errors.map((e) => e.message).join("\n");
                alert(errorMessage);
            } else {
                alert("Bir hata oluştu. Lütfen bilgilerinizi kontrol ediniz.");
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Akademik Bilgiler</h2>

            <div className="space-y-2">
                <Label htmlFor="university">Üniversite *</Label>
                <Select value={university} onValueChange={setUniversity} required>
                    <SelectTrigger>
                        <SelectValue placeholder="Üniversitenizi seçin" />
                    </SelectTrigger>
                    <SelectContent>
                        {ISTANBUL_UNIVERSITIES.map((uni) => (
                            <SelectItem key={uni} value={uni}>
                                {uni}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {university === "Diğer" && (
                    <div className="mt-2">
                        <Input
                            placeholder="Üniversite adını giriniz"
                            value={formData.customUniversity || ""}
                            onChange={(e) => updateFormData({ customUniversity: e.target.value })}
                            required
                        />
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="department">Bölüm *</Label>
                <Input
                    id="department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Örn: Bilgisayar Mühendisliği"
                    required
                    disabled={isLoading}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="year">Sınıf *</Label>
                <Select value={year} onValueChange={setYear} required>
                    <SelectTrigger>
                        <SelectValue placeholder="Sınıfınızı seçin" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="1">1. Sınıf</SelectItem>
                        <SelectItem value="2">2. Sınıf</SelectItem>
                        <SelectItem value="3">3. Sınıf</SelectItem>
                        <SelectItem value="4">4. Sınıf</SelectItem>
                        <SelectItem value="5">5+ Sınıf</SelectItem>
                        <SelectItem value="6">Yüksek Lisans / Doktora</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>Konuştuğunuz Diller *</Label>
                <div className="grid grid-cols-2 gap-3">
                    {LANGUAGES.map((lang) => (
                        <div key={lang.id} className="flex items-center space-x-2">
                            <Checkbox
                                id={lang.id}
                                checked={languages.includes(lang.id)}
                                onCheckedChange={() => toggleLanguage(lang.id)}
                            />
                            <label
                                htmlFor={lang.id}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                {lang.label}
                            </label>
                        </div>
                    ))}
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="other"
                            checked={showOtherLanguages}
                            onCheckedChange={(checked) => handleOtherLanguagesChange(checked === true)}
                        />
                        <label
                            htmlFor="other"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Diğer
                        </label>
                    </div>
                </div>
                {showOtherLanguages && (
                    <div className="space-y-2 mt-3">
                        <Input
                            value={customLanguages}
                            onChange={(e) => handleCustomLanguagesInput(e.target.value)}
                            placeholder="Örn: İspanyolca, Çince, Japonca"
                            disabled={isLoading}
                        />
                        <p className="text-xs text-muted-foreground">
                            Konuştuğunuz diğer dilleri virgülle ayırarak yazınız.
                        </p>
                    </div>
                )}
                <p className="text-xs text-muted-foreground">
                    En az bir dil seçimi yapınız.
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
