import type { MetadataRoute } from "next";
import { getPublishedArticles, getTranslatedArticle } from "@/lib/articles";
import { getOppositeLocale, SUPPORTED_LOCALES } from "@/lib/locales";
import { buildPageAlternates, getBaseUrl } from "@/lib/seo";

/**
 * Generates environment-aware sitemap entries with valid absolute URLs
 * and reciprocal language alternates for all intended published routes.
 * Includes only published articles, never drafts.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();
  const corePaths = [
    "",
    "/about",
    "/specialties",
    "/articles",
    "/contact",
    "/privacy",
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of SUPPORTED_LOCALES) {
    for (const subPath of corePaths) {
      const alternates = buildPageAlternates(locale, subPath);
      entries.push({
        url: `${baseUrl}/${locale}${subPath}`,
        changeFrequency: "monthly",
        priority: subPath === "" ? 1.0 : 0.8,
        alternates: {
          languages: alternates.languages,
        },
      });
    }

    const published = getPublishedArticles(locale);
    for (const article of published) {
      const oppositeLocale = getOppositeLocale(locale);
      const translated = getTranslatedArticle(
        article.translationKey,
        oppositeLocale
      );
      const articleUrl = `${baseUrl}/${locale}/articles/${article.slug}`;
      const languages: Record<string, string> = {
        [locale]: articleUrl,
      };
      if (translated) {
        const translatedUrl = `${baseUrl}/${oppositeLocale}/articles/${translated.slug}`;
        languages[oppositeLocale] = translatedUrl;
        languages["x-default"] = locale === "ar" ? articleUrl : translatedUrl;
      }

      entries.push({
        url: articleUrl,
        ...(article.updatedAt || article.publishedAt
          ? {
              lastModified: new Date(
                (article.updatedAt ?? article.publishedAt) as string
              ),
            }
          : {}),
        changeFrequency: "monthly",
        priority: 0.7,
        alternates: {
          languages,
        },
      });
    }
  }

  return entries;
}
