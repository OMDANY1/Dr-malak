export const SUPPORTED_LOCALES = ["ar", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ar";

export function isValidLocale(value: string): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale);
}

export function getDirection(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

export function getOppositeLocale(locale: Locale): Locale {
  return locale === "ar" ? "en" : "ar";
}

/**
 * Given a pathname such as "/ar/about" or "/en/specialties",
 * returns the equivalent path in the target locale while preserving the suffix.
 */
export function switchLocalePath(pathname: string, targetLocale: Locale): string {
  if (!pathname || pathname === "/") {
    return `/${targetLocale}`;
  }

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return `/${targetLocale}`;
  }

  if (isValidLocale(segments[0])) {
    segments[0] = targetLocale;
    return `/${segments.join("/")}`;
  }

  return `/${targetLocale}/${segments.join("/")}`;
}

export function localizePath(locale: Locale, subPath: string = ""): string {
  const clean = subPath.replace(/^\/+/, "");
  return clean ? `/${locale}/${clean}` : `/${locale}`;
}
