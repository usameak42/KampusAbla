/**
 * Booking utility functions for duration validation, conflict detection, and child eligibility.
 */

/**
 * Converts "HH:MM" string to minutes since start of day.
 */
export function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
}

/**
 * Validates booking duration (e.g., 2-8 hours).
 */
export function validateBookingDuration(startTime: string, endTime: string, minHours = 2, maxHours = 8): boolean {
    const start = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);

    if (end <= start) return false;

    const durationHours = (end - start) / 60;
    return durationHours >= minHours && durationHours <= maxHours;
}

/**
 * Checks if two time ranges overlap on the same day.
 */
export interface TimeRange {
    start: string;
    end: string;
}

export function hasTimeConflict(range1: TimeRange, range2: TimeRange): boolean {
    const s1 = timeToMinutes(range1.start);
    const e1 = timeToMinutes(range1.end);
    const s2 = timeToMinutes(range2.start);
    const e2 = timeToMinutes(range2.end);

    // Overlap if (StartA < EndB) and (StartB < EndA)
    return s1 < e2 && s2 < e1;
}

/**
 * Validates child eligibility for a sitter request.
 * e.g., child must be between 3 and 14 years old.
 */
export function isChildEligible(age: number): boolean {
    return age >= 3 && age <= 14;
}

/**
 * Checks if a sitter with specific language skills matches the requirements.
 */
export function matchesLanguageRequirements(sitterLanguages: string[], requiredLanguages: string[]): boolean {
    if (requiredLanguages.length === 0) return true;
    return requiredLanguages.every(lang => sitterLanguages.includes(lang));
}
