/**
 * Privacy utilities for masking sensitive user data.
 */

/**
 * Masks an email address: user@example.com -> us***@example.com
 */
export const maskEmail = (email?: string | null): string => {
    if (!email) return "";
    const [local, domain] = email.split("@");
    if (!domain) return email;
    if (local.length <= 2) return `${local}***@${domain}`;
    return `${local.substring(0, 2)}***@${domain}`;
};

/**
 * Masks a phone number: +905554443322 -> +905***22
 */
export const maskPhone = (phone?: string | null): string => {
    if (!phone) return "";
    const cleanPhone = phone.replace(/\s/g, "");
    if (cleanPhone.length <= 5) return cleanPhone;
    return `${cleanPhone.substring(0, 4)}***${cleanPhone.substring(cleanPhone.length - 2)}`;
};
