import type { Metadata } from "next";
import { siteConfig } from "./content";
import { Locale } from "./locales";

const DEFAULT_PREVIEW_ORIGIN = "https://dr-malak-alsaif-preview.vercel.app";

export const DEFAULT_SOCIAL_IMAGE_PATH = "/brand/og-default-1200x630.png";
export const DEFAULT_SOCIAL_IMAGE_WIDTH = 1200;
export const DEFAULT_SOCIAL_IMAGE_HEIGHT = 630;
export const DEFAULT_SOCIAL_IMAGE_TYPE = "image/png";

export function getDefaultSocialImageAlt(locale: Locale): string {
  return locale === "ar"
    ? "د. ملاك السيف — استشارية جراحة التجميل والترميم"
    : "Dr. Malak Alsaif — Consultant Plastic & Reconstructive Surgeon";
}

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
 * Converts a relative path (e.g. "/ar/about" or "/brand/og-default-1200x630.png")
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

export interface BuildSocialMetadataOptions {
  locale: Locale;
  title: string;
  description: string;
  url: string;
  type?: "website" | "article" | "profile";
  imagePath?: string | null;
  imageAlt?: string;
}

/**
 * Builds consistent OpenGraph and Twitter Card metadata using the default
 * 1200x630 branded PNG unless an intentional article/specialty social image is provided.
 */
export function buildSocialMetadata({
  locale,
  title,
  description,
  url,
  type = "website",
  imagePath,
  imageAlt,
}: BuildSocialMetadataOptions): Pick<Metadata, "openGraph" | "twitter"> {
  const resolvedImagePath =
    imagePath &&
    imagePath.trim() !== "" &&
    imagePath !== "/images/doctor/dr-malak-alsaif.jpg"
      ? imagePath.trim()
      : DEFAULT_SOCIAL_IMAGE_PATH;

  const isDefaultBrandCard = resolvedImagePath === DEFAULT_SOCIAL_IMAGE_PATH;
  const absoluteImageUrl = toAbsoluteUrl(resolvedImagePath);
  const resolvedAlt =
    isDefaultBrandCard || !imageAlt
      ? getDefaultSocialImageAlt(locale)
      : imageAlt;

  const imageEntry = isDefaultBrandCard
    ? {
        url: absoluteImageUrl,
        width: DEFAULT_SOCIAL_IMAGE_WIDTH,
        height: DEFAULT_SOCIAL_IMAGE_HEIGHT,
        type: DEFAULT_SOCIAL_IMAGE_TYPE,
        alt: resolvedAlt,
      }
    : {
        url: absoluteImageUrl,
        alt: resolvedAlt,
      };

  return {
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name[locale],
      locale: locale === "ar" ? "ar_SA" : "en_US",
      type,
      images: [imageEntry],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [
        {
          url: absoluteImageUrl,
          alt: resolvedAlt,
          ...(isDefaultBrandCard
            ? {
                width: DEFAULT_SOCIAL_IMAGE_WIDTH,
                height: DEFAULT_SOCIAL_IMAGE_HEIGHT,
              }
            : {}),
        },
      ],
    },
  };
}
