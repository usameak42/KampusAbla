/**
 * Payment utility functions for IBAN normalization, card brand detection, and fee calculations.
 */

import { PLATFORM_FEE_RATE } from "@/config/constants";

/**
 * Normalizes and formats IBAN input.
 * Strips non-alphanumeric characters, enforces 'TR' prefix, and limits length.
 */
export function normalizeIban(input: string): string {
    let value = input.toUpperCase().replace(/[^A-Z0-9]/g, "");

    // Enforce TR prefix (KA-131)
    if (value && !value.startsWith("T")) {
        value = "TR" + value;
    } else if (value === "T") {
        value = "TR";
    }

    // Limit length (TR + 24 digits = 26 chars)
    if (value.length > 26) {
        value = value.substring(0, 26);
    }

    return value;
}

/**
 * Formats IBAN for display (e.g., TRXX XXXX XXXX ...)
 */
export function formatIbanForDisplay(iban: string): string {
    return iban.match(/.{1,4}/g)?.join(" ") || iban;
}

/**
 * Detects card brand based on card number bin.
 */
export type CardBrand = "Visa" | "Mastercard" | "Troy" | "Diğer";

export function detectCardBrand(cardNumber: string): CardBrand {
    const value = cardNumber.replace(/\D/g, "");

    if (value.startsWith("4")) {
        return "Visa";
    } else if (value.startsWith("5")) {
        return "Mastercard";
    } else if (value.startsWith("9792")) {
        return "Troy";
    } else {
        return "Diğer";
    }
}

/**
 * Calculates platform fee and sitter amount.
 */
export function calculateEarnings(totalAmount: number) {
    const platformFee = Math.round(totalAmount * PLATFORM_FEE_RATE);
    const sitterAmount = totalAmount - platformFee;

    return {
        totalAmount,
        platformFee,
        sitterAmount,
        feeRate: PLATFORM_FEE_RATE
    };
}
