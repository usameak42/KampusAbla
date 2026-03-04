import { z } from "zod";

export const customErrorMap: z.ZodErrorMap = (issue, ctx) => {
    let message: string;

    switch (issue.code) {
        case z.ZodIssueCode.invalid_type:
            if (issue.received === "undefined") {
                message = "Bu alan zorunludur";
            } else {
                message = `Beklenen ${issue.expected}, ancak ${issue.received} alındı`;
            }
            break;

        case z.ZodIssueCode.unrecognized_keys:
            message = `Tanımlanmayan anahtarlar bulundu: ${issue.keys.join(", ")}`;
            break;

        case z.ZodIssueCode.invalid_union:
            message = "Geçersiz giriş formatı";
            break;

        case z.ZodIssueCode.invalid_enum_value:
            message = `Geçerli seçeneklerden biri olmalıdır: ${issue.options.join(", ")}`;
            break;

        case z.ZodIssueCode.too_big:
            if (issue.type === "string") {
                message = `En fazla ${issue.maximum} karakter olabilir`;
            } else if (issue.type === "number") {
                message = `Değer en fazla ${issue.maximum} olabilir`;
            } else if (issue.type === "array") {
                message = `En fazla ${issue.maximum} öğe seçebilirsiniz`;
            } else {
                message = "Değer çok büyük";
            }
            break;

        case z.ZodIssueCode.too_small:
            if (issue.type === "string") {
                message = `En az ${issue.minimum} karakter girmelisiniz`;
            } else if (issue.type === "number") {
                message = `Değer en az ${issue.minimum} olmalıdır`;
            } else if (issue.type === "array") {
                message = `En az ${issue.minimum} öğe seçmelisiniz`;
            } else {
                message = "Değer çok küçük";
            }
            break;

        case z.ZodIssueCode.invalid_string:
            if (issue.validation === "email") {
                message = "Geçerli bir e-posta adresi giriniz";
            } else if (issue.validation === "url") {
                message = "Geçerli bir bağlantı (URL) giriniz";
            } else if (issue.validation === "uuid") {
                message = "Geçerli bir UUID giriniz";
            } else {
                message = "Geçersiz format";
            }
            break;

        case z.ZodIssueCode.invalid_date:
            message = "Geçersiz tarih";
            break;

        case z.ZodIssueCode.custom:
            message = issue.message || "Geçersiz giriş";
            break;

        default:
            message = ctx.defaultError;
            break;
    }

    return { message };
};
