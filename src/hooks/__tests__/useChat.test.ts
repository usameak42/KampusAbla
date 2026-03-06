import { describe, it, expect } from "vitest";
import { containsBlockedContent } from "@/types/chat";

describe("containsBlockedContent — phone/email blocking (KA-Chat)", () => {
    it("should allow plain conversational text", () => {
        const result = containsBlockedContent("Merhaba, yarın saat 14:00'te buluşalım.");
        expect(result.blocked).toBe(false);
    });

    it("should block Turkish mobile phone numbers (05XX format)", () => {
        const result = containsBlockedContent("Beni 05321234567 numarasından ara.");
        expect(result.blocked).toBe(true);
        expect(result.reason).toContain("Telefon");
    });

    it("should block phone numbers in +90 format", () => {
        const result = containsBlockedContent("Numaram +905321234567 olarak kayıtlı.");
        expect(result.blocked).toBe(true);
        expect(result.reason).toContain("Telefon");
    });

    it("should block 10-digit phone numbers without country code", () => {
        const result = containsBlockedContent("Beni 5321234567 ara lütfen");
        expect(result.blocked).toBe(true);
    });

    it("should block email addresses", () => {
        const result = containsBlockedContent("Bana user@example.com adresine mesaj at.");
        expect(result.blocked).toBe(true);
        expect(result.reason).toContain("E-posta");
    });

    it("should block WhatsApp mentions", () => {
        const result = containsBlockedContent("Beni whatsapp üzerinden ekle.");
        expect(result.blocked).toBe(true);
        expect(result.reason).toContain("platform");
    });

    it("should block Telegram mentions", () => {
        const result = containsBlockedContent("telegram'dan konuşalım");
        expect(result.blocked).toBe(true);
    });

    it("should block Instagram mentions", () => {
        const result = containsBlockedContent("Instagram hesabımdan ulaş.");
        expect(result.blocked).toBe(true);
    });

    it("should allow a message that contains a year number (not a phone)", () => {
        const result = containsBlockedContent("2023 yılında mezun oldum.");
        expect(result.blocked).toBe(false);
    });
});
