import fs from "node:fs";
import path from "node:path";
import { Locale } from "./locales";

export type ArticleStatus = "draft" | "published";

export interface ArticleSection {
  id: string;
  heading: string;
  paragraphs: string[];
  listItems?: string[];
}

export interface ArticleRecord {
  id: string;
  locale: Locale;
  slug: string;
  translationKey: string;
  title: string;
  description: string;
  category: string;
  coverImage: string;
  coverAlt: string;
  status: ArticleStatus;
  authorName: string | null;
  publishedAt: string | null;
  updatedAt: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  body: ArticleSection[];
}

export interface TocItem {
  id: string;
  heading: string;
}

export interface EnrichedArticle extends ArticleRecord {
  readingTimeMinutes: number;
  toc: TocItem[];
}

const ARTICLES_ROOT = path.join(process.cwd(), "content", "articles");

export const ARTICLE_CATEGORIES: Record<
  Locale,
  Record<string, string>
> = {
  ar: {
    all: "جميع الموضوعات",
    "consultation-prep": "الاستعداد للاستشارة",
    "patient-education": "التوعية العامة",
  },
  en: {
    all: "All Topics",
    "consultation-prep": "Consultation Preparation",
    "patient-education": "General Guidance",
  },
};

export function getCategoryLabel(locale: Locale, categoryKey: string): string {
  return ARTICLE_CATEGORIES[locale]?.[categoryKey] ?? categoryKey;
}

export function calculateReadingTime(sections: ArticleSection[]): number {
  const allText = sections
    .map(
      (s) =>
        `${s.heading} ${s.paragraphs.join(" ")} ${(s.listItems ?? []).join(" ")}`
    )
    .join(" ");
  const words = allText
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 180));
}

export function generateToc(sections: ArticleSection[]): TocItem[] {
  return sections.map((section) => ({
    id: section.id,
    heading: section.heading,
  }));
}

function enrichArticle(record: ArticleRecord): EnrichedArticle {
  return {
    ...record,
    readingTimeMinutes: calculateReadingTime(record.body),
    toc: generateToc(record.body),
  };
}

/**
 * Loads all articles (draft and published) for a given locale from content/articles/{locale}/.
 * Internal helper — public routes must use getPublishedArticles or getPublishedArticleBySlug.
 */
export function getAllArticlesForLocale(locale: Locale): EnrichedArticle[] {
  const localeDir = path.join(ARTICLES_ROOT, locale);
  if (!fs.existsSync(localeDir)) {
    return [];
  }

  const files = fs
    .readdirSync(localeDir)
    .filter((f) => f.endsWith(".json"))
    .sort();

  const articles: EnrichedArticle[] = [];

  for (const file of files) {
    const fullPath = path.join(localeDir, file);
    const raw = fs.readFileSync(fullPath, "utf-8");
    const parsed = JSON.parse(raw) as ArticleRecord;
    if (parsed.locale === locale) {
      articles.push(enrichArticle(parsed));
    }
  }

  return articles.sort((a, b) => {
    const dateA = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const dateB = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return dateB - dateA;
  });
}

/**
 * Returns ONLY published articles for public listings, homepage teasers, search/filter, and sitemap.
 */
export function getPublishedArticles(locale: Locale): EnrichedArticle[] {
  return getAllArticlesForLocale(locale).filter(
    (article) => article.status === "published"
  );
}

/**
 * Returns a single published article by slug, or null if not found or still a draft.
 * Drafts are never exposed on public URLs unless local development preview is explicitly enabled
 * via ALLOW_LOCAL_DRAFT_PREVIEW=true in development mode.
 */
export function getPublicArticleBySlug(
  locale: Locale,
  slug: string
): EnrichedArticle | null {
  const allowLocalDrafts =
    process.env.NODE_ENV !== "production" &&
    process.env.ALLOW_LOCAL_DRAFT_PREVIEW === "true";

  const all = getAllArticlesForLocale(locale);
  const match = all.find((a) => a.slug === slug);
  if (!match) return null;

  if (match.status === "published" || allowLocalDrafts) {
    return match;
  }

  return null;
}

/**
 * Finds the translated counterpart of an article by translationKey.
 * Only returns the counterpart if it is also published (or local draft preview is enabled).
 */
export function getTranslatedArticle(
  translationKey: string,
  targetLocale: Locale
): EnrichedArticle | null {
  const allowLocalDrafts =
    process.env.NODE_ENV !== "production" &&
    process.env.ALLOW_LOCAL_DRAFT_PREVIEW === "true";

  const targetArticles = getAllArticlesForLocale(targetLocale);
  const counterpart = targetArticles.find(
    (a) => a.translationKey === translationKey
  );
  if (!counterpart) return null;

  if (counterpart.status === "published" || allowLocalDrafts) {
    return counterpart;
  }

  return null;
}

/**
 * Returns related published articles in the same locale (excluding the current article),
 * prioritizing articles in the same category first.
 */
export function getRelatedPublishedArticles(
  locale: Locale,
  currentSlug: string,
  limit: number = 2
): EnrichedArticle[] {
  const published = getPublishedArticles(locale);
  const current = published.find((a) => a.slug === currentSlug);
  const others = published.filter((a) => a.slug !== currentSlug);

  if (!current) {
    return others.slice(0, limit);
  }

  const sameCategory = others.filter((a) => a.category === current.category);
  const differentCategory = others.filter(
    (a) => a.category !== current.category
  );

  return [...sameCategory, ...differentCategory].slice(0, limit);
}
