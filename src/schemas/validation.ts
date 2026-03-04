import { z } from "zod";

// Error Messages (Turkish)
const ERRORS = {
    REQUIRED: "Bu alan zorunludur",
    MIN_LENGTH: (min: number) => `En az ${min} karakter olmalıdır`,
    MAX_LENGTH: (max: number) => `En fazla ${max} karakter olabilir`,
    INVALID_DATE: "Geçersiz tarih",
    FUTURE_DATE: "Gelecek bir tarih seçmelisiniz",
    PAST_DATE: "Geçmiş bir tarih olamaz",
    INVALID_AGE: "Yaş 7-16 arasında olmalıdır",
    INVALID_RATE: "Saatlik ücret geçersiz",
    MIN_RATE: (min: number) => `Saatlik ücret en az ${min} TL olabilir`,
    MAX_RATE: (max: number) => `Saatlik ücret en fazla ${max} TL olabilir`,
};

// --- BOOKINGS ---

export const cancelBookingSchema = z.object({
    reason: z
        .string()
        .min(10, ERRORS.MIN_LENGTH(10))
        .max(500, ERRORS.MAX_LENGTH(500)),
});

export const createBookingSchema = z.object({
    bookingDate: z.date().min(new Date(), { message: ERRORS.PAST_DATE }),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Geçersiz saat formatı (HH:mm)"),
    durationHours: z.number().min(1).max(24),
    pickupNeeded: z.boolean().default(false),
    pickupLocationId: z.string().optional(),
    notes: z.string().max(1000, ERRORS.MAX_LENGTH(1000)).optional(),
}).superRefine((data, ctx) => {
    if (data.pickupNeeded && !data.pickupLocationId) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Okuldan alma seçildiğinde konum seçilmelidir",
            path: ["pickupLocationId"],
        });
    }
});

// --- CHILDREN ---

export const childSchema = z.object({
    name: z.string().min(2, ERRORS.MIN_LENGTH(2)).max(50, ERRORS.MAX_LENGTH(50)),
    dateOfBirth: z.date().refine((date) => {
        const today = new Date();
        const age = today.getFullYear() - date.getFullYear();
        // Age verification: 7-16 years old
        return age >= 7 && age <= 16;
    }, { message: "Çocuk yaşı 7-16 arasında olmalıdır" }),
    gender: z.enum(["male", "female", "other"], { required_error: ERRORS.REQUIRED }),
    allergies: z.array(z.string()).optional(),
    medicalConditions: z.array(z.string()).optional(),
    notes: z.string().max(1000, ERRORS.MAX_LENGTH(1000)).optional(),
});

// --- NEED POSTS ---

export const needPostSchema = z.object({
    title: z.string().min(5, ERRORS.MIN_LENGTH(5)).max(100, ERRORS.MAX_LENGTH(100)),
    description: z.string().min(20, ERRORS.MIN_LENGTH(20)).max(2000, ERRORS.MAX_LENGTH(2000)),
    needDate: z.date().min(new Date(), { message: ERRORS.PAST_DATE }),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Geçersiz saat formatı (HH:mm)"),
    durationHours: z.number().min(1).max(24),
    languageGoal: z.string().optional(),
    homeworkHelp: z.boolean().default(false),
    address: z.string().min(10, ERRORS.MIN_LENGTH(10)),
    hourlyRateOffered: z.number().min(0, ERRORS.MIN_RATE(0)).max(10000, ERRORS.MAX_RATE(10000)),
    selectedChildrenIds: z.array(z.string()).min(1, "En az bir çocuk seçmelisiniz"),
});

// --- APPLICATIONS ---

export const applicationSchema = z.object({
    message: z.string().min(20, ERRORS.MIN_LENGTH(20)).max(1000, ERRORS.MAX_LENGTH(1000)),
    proposedRate: z.number().min(0).max(10000).optional(),
});

// --- REVIEWS ---

export const reviewSchema = z.object({
    rating: z.number().min(1).max(5),
    comment: z.string().min(10, ERRORS.MIN_LENGTH(10)).max(1000, ERRORS.MAX_LENGTH(1000)),
});
