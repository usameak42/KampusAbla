/**
 * AddChildForm - Add or edit child profile form
 */

import { useState } from "react";
import { Plus, X, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import type { Child, Allergy, AllergyType } from "@/types/child";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
    GRADE_OPTIONS,
    LANGUAGE_OPTIONS,
    ALLERGY_TYPE_LABELS,
    SEVERITY_LABELS,
} from "@/types/child";

interface AddChildFormProps {
    child?: Child | null;
    onSubmit: (data: Omit<Child, "id" | "parentId" | "createdAt" | "updatedAt">, consent?: boolean) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
    error?: string | null;
}

export function AddChildForm({
    child,
    onSubmit,
    onCancel,
    isLoading = false,
    error,
}: AddChildFormProps) {
    const isEditing = !!child;
    const { toast } = useToast();

    // Form state
    const [name, setName] = useState(child?.name || "");
    const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(
        child?.dateOfBirth ? new Date(child.dateOfBirth) : undefined
    );
    const [gender, setGender] = useState<"male" | "female">(child?.gender as "male" | "female" || "male");
    const [grade, setGrade] = useState(child?.grade || "");
    const [schoolName, setSchoolName] = useState(child?.schoolName || "");
    const [languages, setLanguages] = useState<string[]>(child?.languages || ["turkish"]);
    const [allergies, setAllergies] = useState<Allergy[]>(child?.allergies || []);
    const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>(
        child?.dietaryRestrictions || []
    );
    const [interests, setInterests] = useState<string[]>(child?.interests || []);
    const [notes, setNotes] = useState(child?.notes || "");
    const [childDataConsent, setChildDataConsent] = useState(isEditing);
    const [consentError, setConsentError] = useState<string | null>(null);

    // Allergy form state
    const [showAllergyForm, setShowAllergyForm] = useState(false);
    const [allergyType, setAllergyType] = useState<AllergyType>("food");
    const [allergySeverity, setAllergySeverity] = useState<"mild" | "moderate" | "severe">("mild");
    const [allergyDetails, setAllergyDetails] = useState("");

    // Input state for dynamic fields
    const [newDietaryRestriction, setNewDietaryRestriction] = useState("");
    const [newInterest, setNewInterest] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setConsentError(null);

        if (!name || !dateOfBirth || !grade) return;

        if (!isEditing && !childDataConsent) {
            setConsentError("Çocuk verilerinin işlenmesi için velayet/onay gereklidir.");
            return;
        }

        if (!isEditing) {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setConsentError("Oturum doğrulanamadı. Lütfen tekrar giriş yapın.");
                return;
            }

            const { error: consentInsertError } = await supabase.from("kvkk_consents").insert({
                user_id: user.id,
                consent_type: "child_data_processing",
                granted: true,
                granted_at: new Date().toISOString(),
                ip_address: "127.0.0.1 (simulated)" // In production, get from API or server-side
            });

            if (consentInsertError) {
                setConsentError("Çocuk verisi onayı kaydedilemedi. Lütfen tekrar deneyin.");
                toast({
                    title: "KVKK Onayı Kaydedilemedi",
                    description: consentInsertError.message,
                    variant: "destructive",
                });
                return;
            }
        }

        await onSubmit({
            name,
            dateOfBirth,
            gender,
            grade,
            schoolName,
            languages,
            allergies,
            dietaryRestrictions,
            medicalConditions: child?.medicalConditions || [],
            emergencyMedication: child?.emergencyMedication,
            interests,
            notes,
        }, childDataConsent);
    };

    const addAllergy = () => {
        if (allergyDetails.trim()) {
            setAllergies([
                ...allergies,
                { type: allergyType, severity: allergySeverity, details: allergyDetails.trim() },
            ]);
            setAllergyDetails("");
            setShowAllergyForm(false);
        }
    };

    const removeAllergy = (index: number) => {
        setAllergies(allergies.filter((_, i) => i !== index));
    };

    const toggleLanguage = (lang: string) => {
        if (languages.includes(lang)) {
            setLanguages(languages.filter((l) => l !== lang));
        } else {
            setLanguages([...languages, lang]);
        }
    };

    const addDietaryRestriction = () => {
        if (newDietaryRestriction.trim() && !dietaryRestrictions.includes(newDietaryRestriction.trim())) {
            setDietaryRestrictions([...dietaryRestrictions, newDietaryRestriction.trim()]);
            setNewDietaryRestriction("");
        }
    };

    const addInterest = () => {
        if (newInterest.trim() && !interests.includes(newInterest.trim())) {
            setInterests([...interests, newInterest.trim()]);
            setNewInterest("");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info Section */}
            <div className="space-y-4">
                <h3 className="font-semibold text-lg">Temel Bilgiler</h3>

                {/* Name */}
                <div className="space-y-2">
                    <Label htmlFor="name">Çocuğun Adı *</Label>
                    <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Adı ve soyadı"
                        required
                    />
                </div>

                {/* Date of Birth & Gender */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Doğum Tarihi *</Label>
                        <div className="flex gap-1">
                            {/* Day */}
                            <Select
                                value={dateOfBirth ? String(dateOfBirth.getDate()) : ""}
                                onValueChange={(day) => {
                                    const d = dateOfBirth ? new Date(dateOfBirth) : new Date(2015, 0, 1);
                                    d.setDate(Number(day));
                                    setDateOfBirth(new Date(d));
                                }}
                            >
                                <SelectTrigger className="w-[60px] px-2">
                                    <SelectValue placeholder="Gün" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                                        <SelectItem key={d} value={String(d)}>
                                            {d}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {/* Month */}
                            <Select
                                value={dateOfBirth ? String(dateOfBirth.getMonth()) : ""}
                                onValueChange={(month) => {
                                    const d = dateOfBirth ? new Date(dateOfBirth) : new Date(2015, 0, 1);
                                    d.setMonth(Number(month));
                                    setDateOfBirth(new Date(d));
                                }}
                            >
                                <SelectTrigger className="flex-1 px-2">
                                    <SelectValue placeholder="Ay" />
                                </SelectTrigger>
                                <SelectContent>
                                    {["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"].map((m, i) => (
                                        <SelectItem key={i} value={String(i)}>
                                            {m}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {/* Year */}
                            <Select
                                value={dateOfBirth ? String(dateOfBirth.getFullYear()) : ""}
                                onValueChange={(year) => {
                                    const d = dateOfBirth ? new Date(dateOfBirth) : new Date(2015, 0, 1);
                                    d.setFullYear(Number(year));
                                    setDateOfBirth(new Date(d));
                                }}
                            >
                                <SelectTrigger className="w-[72px] px-2">
                                    <SelectValue placeholder="Yıl" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from(
                                        { length: new Date().getFullYear() - 2007 + 1 },
                                        (_, i) => new Date().getFullYear() - i
                                    ).map((y) => (
                                        <SelectItem key={y} value={String(y)}>
                                            {y}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Cinsiyet</Label>
                        <Select value={gender} onValueChange={(v) => setGender(v as typeof gender)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="male">Erkek</SelectItem>
                                <SelectItem value="female">Kız</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Grade & School */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Sınıf *</Label>
                        <Select value={grade} onValueChange={setGrade}>
                            <SelectTrigger>
                                <SelectValue placeholder="Sınıf seçin" />
                            </SelectTrigger>
                            <SelectContent>
                                {GRADE_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Okul Adı</Label>
                        <Input
                            value={schoolName}
                            onChange={(e) => setSchoolName(e.target.value)}
                            placeholder="Okul adı"
                        />
                    </div>
                </div>
            </div>

            {/* Languages Section */}
            <div className="space-y-4">
                <h3 className="font-semibold text-lg">Diller</h3>
                <div className="flex flex-wrap gap-2">
                    {LANGUAGE_OPTIONS.map((lang) => (
                        <Badge
                            key={lang.value}
                            variant={languages.includes(lang.value) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => toggleLanguage(lang.value)}
                        >
                            {lang.label}
                        </Badge>
                    ))}
                </div>
            </div>

            {/* Allergies Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                        Alerjiler
                    </h3>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAllergyForm(true)}
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Alerji Ekle
                    </Button>
                </div>

                {/* Existing Allergies */}
                {allergies.length > 0 && (
                    <div className="space-y-2">
                        {allergies.map((allergy, index) => (
                            <div
                                key={index}
                                className={`flex items-center justify-between p-3 rounded-lg border ${allergy.severity === "severe"
                                    ? "border-red-300 bg-red-50"
                                    : allergy.severity === "moderate"
                                        ? "border-orange-300 bg-orange-50"
                                        : "border-yellow-300 bg-yellow-50"
                                    }`}
                            >
                                <div>
                                    <span className="font-medium">{allergy.details}</span>
                                    <span className="text-sm text-muted-foreground ml-2">
                                        ({ALLERGY_TYPE_LABELS[allergy.type]} - {SEVERITY_LABELS[allergy.severity]})
                                    </span>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => removeAllergy(index)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add Allergy Form */}
                {showAllergyForm && (
                    <div className="p-4 border rounded-lg space-y-3 bg-muted/50">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label>Alerji Tipi</Label>
                                <Select value={allergyType} onValueChange={(v) => setAllergyType(v as AllergyType)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(ALLERGY_TYPE_LABELS).map(([value, label]) => (
                                            <SelectItem key={value} value={value}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Şiddet</Label>
                                <Select
                                    value={allergySeverity}
                                    onValueChange={(v) => setAllergySeverity(v as typeof allergySeverity)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="mild">Hafif</SelectItem>
                                        <SelectItem value="moderate">Orta</SelectItem>
                                        <SelectItem value="severe">Şiddetli</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Detay</Label>
                            <Input
                                value={allergyDetails}
                                onChange={(e) => setAllergyDetails(e.target.value)}
                                placeholder="Örn: Fıstık alerjisi"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button type="button" size="sm" onClick={addAllergy}>
                                Ekle
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowAllergyForm(false)}
                            >
                                İptal
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Dietary Restrictions */}
            <div className="space-y-3">
                <Label>Diyet Kısıtlamaları</Label>
                <div className="flex gap-2">
                    <Input
                        value={newDietaryRestriction}
                        onChange={(e) => setNewDietaryRestriction(e.target.value)}
                        placeholder="Örn: Vejetaryen, Helal"
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDietaryRestriction())}
                    />
                    <Button type="button" variant="outline" onClick={addDietaryRestriction}>
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
                {dietaryRestrictions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {dietaryRestrictions.map((restriction, index) => (
                            <Badge key={index} variant="secondary" className="gap-1">
                                {restriction}
                                <X
                                    className="h-3 w-3 cursor-pointer"
                                    onClick={() =>
                                        setDietaryRestrictions(dietaryRestrictions.filter((_, i) => i !== index))
                                    }
                                />
                            </Badge>
                        ))}
                    </div>
                )}
            </div>

            {/* Interests */}
            <div className="space-y-3">
                <Label>İlgi Alanları</Label>
                <div className="flex gap-2">
                    <Input
                        value={newInterest}
                        onChange={(e) => setNewInterest(e.target.value)}
                        placeholder="Örn: Futbol, Resim, Müzik"
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addInterest())}
                    />
                    <Button type="button" variant="outline" onClick={addInterest}>
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
                {interests.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {interests.map((interest, index) => (
                            <Badge key={index} variant="secondary" className="gap-1">
                                {interest}
                                <X
                                    className="h-3 w-3 cursor-pointer"
                                    onClick={() => setInterests(interests.filter((_, i) => i !== index))}
                                />
                            </Badge>
                        ))}
                    </div>
                )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
                <Label>Ek Notlar</Label>
                <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Bakıcının bilmesi gereken diğer bilgiler..."
                    rows={3}
                />
            </div>

            {/* KVKK Consent */}
            {!isEditing && (
                <div className="space-y-2">
                    <div className="flex items-start space-x-2">
                        <Checkbox
                            id="childDataConsent"
                            checked={childDataConsent}
                            onCheckedChange={(checked) => setChildDataConsent(checked === true)}
                        />
                        <Label htmlFor="childDataConsent" className="text-sm leading-normal cursor-pointer">
                            Çocuğumun kişisel verilerinin{" "}
                            <a href="/kvkk" className="text-primary hover:underline">
                                KVKK Aydınlatma Metni
                            </a>{" "}
                            kapsamında işlenmesine onay veriyorum. *
                        </Label>
                    </div>
                    {consentError && (
                        <Alert variant="destructive">
                            <AlertDescription>{consentError}</AlertDescription>
                        </Alert>
                    )}
                </div>
            )}

            {/* Error Display */}
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Form Actions */}
            <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                    İptal
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isEditing ? "Güncelle" : "Ekle"}
                </Button>
            </div>
        </form>
    );
}
