/**
 * Child Types and Interfaces
 */

export interface Child {
    id: string;
    parentId: string;
    // Basic Info
    name: string;
    dateOfBirth: Date;
    gender: "male" | "female" | "other";
    photo?: string;
    // School Info
    grade: string;
    schoolId?: string;
    schoolName?: string;
    // Languages & Skills
    languages: string[];
    // Health & Safety
    allergies: Allergy[];
    dietaryRestrictions: string[];
    medicalConditions: string[];
    emergencyMedication?: string;
    // Additional Info
    interests: string[];
    notes?: string;

    // Pickup functionality removed per KA-001

    // Meta
    createdAt: Date;
    updatedAt: Date;
    metadata?: {
        consentId?: string;
        dataProcessingLogs?: { action: string; timestamp: string; userId: string }[];
    };
}

export interface Allergy {
    type: AllergyType;
    severity: "mild" | "moderate" | "severe";
    details?: string;
}

export type AllergyType =
    | "food"
    | "medication"
    | "environmental"
    | "insect"
    | "latex"
    | "other";

export const ALLERGY_TYPE_LABELS: Record<AllergyType, string> = {
    food: "Gıda Alerjisi",
    medication: "İlaç Alerjisi",
    environmental: "Çevresel Alerji",
    insect: "Böcek Alerjisi",
    latex: "Lateks Alerjisi",
    other: "Diğer",
};

export const SEVERITY_LABELS: Record<"mild" | "moderate" | "severe", string> = {
    mild: "Hafif",
    moderate: "Orta",
    severe: "Şiddetli",
};

export type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export const DAY_LABELS: Record<DayOfWeek, string> = {
    monday: "Pazartesi",
    tuesday: "Salı",
    wednesday: "Çarşamba",
    thursday: "Perşembe",
    friday: "Cuma",
    saturday: "Cumartesi",
    sunday: "Pazar",
};

export interface AuthorizedPerson {
    name: string;
    relation: string;
    phone: string;
    photo?: string;
}

export interface PickupDetails {
    authorizedPeople: AuthorizedPerson[];
    notes?: string;
}

// Grade options - KA-041: 1-12 only
export const GRADE_OPTIONS = [
    { value: "1", label: "1. Sınıf" },
    { value: "2", label: "2. Sınıf" },
    { value: "3", label: "3. Sınıf" },
    { value: "4", label: "4. Sınıf" },
    { value: "5", label: "5. Sınıf" },
    { value: "6", label: "6. Sınıf" },
    { value: "7", label: "7. Sınıf" },
    { value: "8", label: "8. Sınıf" },
    { value: "9", label: "9. Sınıf" },
    { value: "10", label: "10. Sınıf" },
    { value: "11", label: "11. Sınıf" },
    { value: "12", label: "12. Sınıf" },
];

// Language options
export const LANGUAGE_OPTIONS = [
    { value: "turkish", label: "Türkçe" },
    { value: "english", label: "İngilizce" },
    { value: "german", label: "Almanca" },
    { value: "french", label: "Fransızca" },
    { value: "spanish", label: "İspanyolca" },
    { value: "arabic", label: "Arapça" },
    { value: "russian", label: "Rusça" },
    { value: "chinese", label: "Çince" },
];

// Calculate age from date of birth
export function calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
}

// Get grade label
export function getGradeLabel(grade: string): string {
    const option = GRADE_OPTIONS.find((g) => g.value === grade);
    return option?.label || grade;
}

// Get language label
export function getLanguageLabel(language: string): string {
    const option = LANGUAGE_OPTIONS.find((l) => l.value === language);
    return option?.label || language;
}
