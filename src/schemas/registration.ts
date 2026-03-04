import { z } from "zod";

export const sitterStep2Schema = z.object({
    university: z.string().min(1, "Üniversite seçimi zorunludur"),
    department: z.string().min(1, "Bölüm adı zorunludur"),
    year: z.number().min(1).max(6), // 1-6 representing classes
    languages: z.array(z.string()).min(1, "En az bir dil seçmelisiniz"),
    customUniversity: z.string().optional(),
}).refine((data) => {
    if (data.university === "Diğer") {
        return !!data.customUniversity && data.customUniversity.trim().length > 0;
    }
    return true;
}, {
    message: "Üniversite adı giriniz",
    path: ["customUniversity"],
});

export type SitterStep2Values = z.infer<typeof sitterStep2Schema>;
