import type { Locale } from "./locales";

/**
 * Normalizes Arabic and Latin text for resilient search matching:
 * - Unicode NFKD decomposition where applicable
 * - Strips Arabic tashkeel / harakat / Quranic annotation marks
 * - Strips tatweel (kashida \u0640) and zero-width characters
 * - Unifies Alef variants (أ, إ, آ, ٱ -> ا)
 * - Unifies Alef Maqsura (ى -> ي) and Teh Marbuta (ة -> ه)
 * - Unifies hamza-on-carrier (ؤ -> و, ئ -> ي)
 * - Normalizes Arabic-Indic digits (٠-٩, ۰-۹ -> 0-9)
 * - Lowercases, trims, and collapses internal whitespace
 */
export function normalizeArabicSearch(input: string): string {
  if (!input) return "";

  return (
    input
      .toLowerCase()
      // Remove zero-width characters and directional formatting controls
      .replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u2069\uFEFF]/g, "")
      // Remove Arabic tashkeel / diacritics / harakat
      .replace(
        /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]/g,
        ""
      )
      // Remove tatweel / kashida
      .replace(/\u0640/g, "")
      // Normalize Alef variants (آ, أ, إ, ٱ) to bare Alef (ا)
      .replace(/[\u0622\u0623\u0625\u0671]/g, "\u0627")
      // Normalize Alef Maqsura (ى) to Yeh (ي)
      .replace(/\u0649/g, "\u064A")
      // Normalize Teh Marbuta (ة) to Heh (ه)
      .replace(/\u0629/g, "\u0647")
      // Normalize Waw with Hamza (ؤ) and Yeh with Hamza (ئ)
      .replace(/\u0624/g, "\u0648")
      .replace(/\u0626/g, "\u064A")
      // Normalize Arabic-Indic digits (٠-٩)
      .replace(/[\u0660-\u0669]/g, (d) =>
        String(d.charCodeAt(0) - 0x0660)
      )
      // Normalize Extended Arabic-Indic digits (۰-۹)
      .replace(/[\u06F0-\u06F9]/g, (d) =>
        String(d.charCodeAt(0) - 0x06f0)
      )
      // Collapse whitespace
      .replace(/\s+/g, " ")
      .trim()
  );
}

/**
 * Checks whether a searchable text haystack matches the search query
 * after Arabic + whitespace normalization.
 */
export function matchesArabicSearch(haystack: string, query: string): boolean {
  const normalizedQuery = normalizeArabicSearch(query);
  if (!normalizedQuery) return true;

  const normalizedHaystack = normalizeArabicSearch(haystack);
  return normalizedHaystack.includes(normalizedQuery);
}

/**
 * Formats article reading time with proper Arabic grammatical number rules
 * (singular 1, dual 2, plural 3–10, singular-accusative/tamyeez 11+)
 * and natural English word order.
 */
export function formatReadingTime(minutes: number, locale: Locale): string {
  const m = Math.max(1, Math.round(minutes));

  if (locale === "en") {
    return `${m} min read`;
  }

  if (m === 1) {
    return "دقيقة واحدة للقراءة";
  }
  if (m === 2) {
    return "دقيقتان للقراءة";
  }

  const mod100 = m % 100;
  if (mod100 >= 3 && mod100 <= 10) {
    return `${m} دقائق للقراءة`;
  }

  return `${m} دقيقة للقراءة`;
}
