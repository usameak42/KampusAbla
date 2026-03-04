import { describe, it, expect } from "vitest";
import {
    timeToMinutes,
    validateBookingDuration,
    hasTimeConflict,
    isChildEligible,
    matchesLanguageRequirements
} from "../booking";

describe("Booking Utilities", () => {
    describe("Time Conversion", () => {
        it("should convert HH:MM to minutes correctly", () => {
            expect(timeToMinutes("00:00")).toBe(0);
            expect(timeToMinutes("01:30")).toBe(90);
            expect(timeToMinutes("14:00")).toBe(840);
            expect(timeToMinutes("23:59")).toBe(1439);
        });
    });

    describe("Booking Duration Validation", () => {
        it("should accept valid durations (2-8 hours)", () => {
            expect(validateBookingDuration("10:00", "12:00")).toBe(true);
            expect(validateBookingDuration("10:00", "18:00")).toBe(true);
        });

        it("should reject durations too short", () => {
            expect(validateBookingDuration("10:00", "11:00")).toBe(false);
        });

        it("should reject durations too long", () => {
            expect(validateBookingDuration("10:00", "19:00")).toBe(false);
        });

        it("should reject invalid time ranges", () => {
            expect(validateBookingDuration("14:00", "12:00")).toBe(false);
            expect(validateBookingDuration("10:00", "10:00")).toBe(false);
        });
    });

    describe("Conflict Detection", () => {
        const range1 = { start: "14:00", end: "16:00" };

        it("should detect overlap when ranges intersect", () => {
            expect(hasTimeConflict(range1, { start: "15:00", end: "17:00" })).toBe(true);
            expect(hasTimeConflict(range1, { start: "13:00", end: "15:00" })).toBe(true);
            expect(hasTimeConflict(range1, { start: "14:30", end: "15:30" })).toBe(true);
        });

        it("should not detect conflict for non-overlapping ranges", () => {
            expect(hasTimeConflict(range1, { start: "12:00", end: "14:00" })).toBe(false);
            expect(hasTimeConflict(range1, { start: "16:00", end: "18:00" })).toBe(false);
            expect(hasTimeConflict(range1, { start: "10:00", end: "12:00" })).toBe(false);
        });
    });

    describe("Child Eligibility", () => {
        it("should approve children between 3 and 14", () => {
            expect(isChildEligible(3)).toBe(true);
            expect(isChildEligible(8)).toBe(true);
            expect(isChildEligible(14)).toBe(true);
        });

        it("should reject children too young or too old", () => {
            expect(isChildEligible(2)).toBe(false);
            expect(isChildEligible(15)).toBe(false);
        });
    });

    describe("Language Matching", () => {
        const sitterLangs = ["English", "German", "Turkish"];

        it("should match when all requirements are met", () => {
            expect(matchesLanguageRequirements(sitterLangs, ["English"])).toBe(true);
            expect(matchesLanguageRequirements(sitterLangs, ["English", "German"])).toBe(true);
            expect(matchesLanguageRequirements(sitterLangs, [])).toBe(true);
        });

        it("should fail when requirements are missing", () => {
            expect(matchesLanguageRequirements(sitterLangs, ["French"])).toBe(false);
            expect(matchesLanguageRequirements(sitterLangs, ["English", "French"])).toBe(false);
        });
    });
});
