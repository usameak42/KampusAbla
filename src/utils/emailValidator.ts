/**
 * Email validator utility
 * Rejects emails containing non-ASCII characters (e.g. Turkish: Ü, İ, Ş, Ğ, Ö, Ç)
 * and provides helpful replacement suggestions.
 */

const NON_ASCII_REPLACEMENTS: Record<string, string> = {
  // Turkish uppercase
  İ: "I",
  Ş: "S",
  Ğ: "G",
  Ü: "U",
  Ö: "O",
  Ç: "C",
  // Turkish lowercase
  ı: "i",
  ş: "s",
  ğ: "g",
  ü: "u",
  ö: "o",
  ç: "c",
};

/**
 * Returns an ASCII-safe suggestion by replacing known non-ASCII characters.
 */
export function suggestAsciiEmail(email: string): string {
  return email
    .split("")
    .map((ch) => NON_ASCII_REPLACEMENTS[ch] ?? ch)
    .join("");
}

/**
 * Checks whether the email contains non-ASCII characters.
 * Returns an error message string if invalid, or null if valid.
 */
export function validateEmailAscii(email: string): string | null {
  // Find all non-ASCII characters in the email
  const nonAsciiChars = [...email].filter((ch) => ch.charCodeAt(0) > 127);
  if (nonAsciiChars.length === 0) return null;

  const unique = [...new Set(nonAsciiChars)];
  const suggestion = suggestAsciiEmail(email);

  const replacementHints = unique
    .map((ch) => (NON_ASCII_REPLACEMENTS[ch] ? `${ch} → ${NON_ASCII_REPLACEMENTS[ch]}` : ch))
    .join(", ");

  return `E-posta adresi yalnızca ASCII karakterler içermelidir (${replacementHints}). Öneri: ${suggestion}`;
}
