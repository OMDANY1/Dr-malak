import { siteConfig } from "./content";
import { Locale } from "./locales";

const DEFAULT_PREVIEW_ORIGIN = "https://dr-malak-alsaif-preview.vercel.app";

/**
 * Resolves the canonical base origin for metadata, OpenGraph, JSON-LD, and sitemap.xml.
 * Uses NEXT_PUBLIC_SITE_URL or siteConfig.siteUrl when configured for production,
 * falling back to the Vercel preview domain so URLs are always valid absolute URLs.
 */
export function getBaseUrl(): string {
  const candidate =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    siteConfig.siteUrl?.trim() ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.trim()}`
      : "") ||
    DEFAULT_PREVIEW_ORIGIN;

  return candidate.replace(/\/+$/, "");
}

/**
 * Converts a relative path (e.g. "/ar/about" or "/images/doctor/dr-malak-alsaif.jpg")
 * into a full absolute URL using getBaseUrl().
 */
export function toAbsoluteUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return getBaseUrl();
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }
  const normalizedPath = pathOrUrl.startsWith("/")
    ? pathOrUrl
    : `/${pathOrUrl}`;
  return `${getBaseUrl()}${normalizedPath}`;
}

/**
 * Builds canonical and reciprocal hreflang alternates (ar, en, x-default)
 * with valid absolute URLs for a given route subpath.
 */
export function buildPageAlternates(locale: Locale, subPath: string = "") {
  const cleanSubPath = subPath.replace(/^\/+|\/+$/g, "");
  const arPath = cleanSubPath ? `/ar/${cleanSubPath}` : "/ar";
  const enPath = cleanSubPath ? `/en/${cleanSubPath}` : "/en";

  const arUrl = toAbsoluteUrl(arPath);
  const enUrl = toAbsoluteUrl(enPath);

  return {
    canonical: locale === "ar" ? arUrl : enUrl,
    languages: {
      ar: arUrl,
      en: enUrl,
      "x-default": arUrl,
    },
  };
}
