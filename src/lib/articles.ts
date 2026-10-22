import { Locale } from "./locales";
import { getPublicCmsSnapshot } from "./cms/db";
import { calculateBlocksReadingTime } from "./cms/sanitize";
import { FocalPoint, RichTextBlock } from "./cms/types";

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
  coverFocalPoint?: FocalPoint;
  socialImage?: string;
  seoTitle?: string;
  seoDescription?: string;
  status: ArticleStatus;
  authorName: string | null;
  publishedAt: string | null;
  updatedAt: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  body: ArticleSection[];
  blocks?: RichTextBlock[];
}

export interface TocItem {
  id: string;
  heading: string;
}

export interface EnrichedArticle extends ArticleRecord {
  readingTimeMinutes: number;
  toc: TocItem[];
  blocks: RichTextBlock[];
}

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

/**
 * Converts structured RichTextBlock[] into ArticleSection[] for TOC and backward-compatible consumers.
 */
function richBlocksToSections(blocks: RichTextBlock[]): ArticleSection[] {
  const sections: ArticleSection[] = [];
  let current: ArticleSection | null = null;

  for (const block of blocks) {
    if (block.type === "heading" && block.text) {
      if (current) {
        sections.push(current);
      }
      current = {
        id: block.id,
        heading: block.text,
        paragraphs: [],
      };
    } else if (
      (block.type === "paragraph" || block.type === "callout") &&
      block.text
    ) {
      if (!current) {
        current = {
          id: "intro",
          heading: "",
          paragraphs: [],
        };
      }
      current.paragraphs.push(block.text.replace(/<\/?[a-z][^>]*>/gi, ""));
    } else if (
      (block.type === "bullet-list" || block.type === "ordered-list") &&
      block.items
    ) {
      if (!current) {
        current = {
          id: "intro",
          heading: "",
          paragraphs: [],
        };
      }
      current.listItems = [
        ...(current.listItems ?? []),
        ...block.items.map((item) => item.replace(/<\/?[a-z][^>]*>/gi, "")),
      ];
    }
  }

  if (current) {
    sections.push(current);
  }
  return sections;
}

/**
 * Loads all articles (draft and published) for a given locale from the CMS database.
 */
export function getAllArticlesForLocale(locale: Locale): EnrichedArticle[] {
  const snapshot = getPublicCmsSnapshot({ previewDrafts: true });
  const articles: EnrichedArticle[] = [];

  for (const item of snapshot.articles) {
    const locContent = item.content.locales[locale];
    if (!locContent || !locContent.title.trim()) {
      continue;
    }

    const blocks = locContent.blocks || [];
    const sections = richBlocksToSections(blocks);
    const readingTime = calculateBlocksReadingTime(blocks);
    const toc = blocks
      .filter((b) => b.type === "heading" && Boolean(b.text))
      .map((b) => ({
        id: b.id,
        heading: b.text || "",
      }));

    articles.push({
      id: `${locale}-${item.slug}`,
      locale,
      slug: item.slug,
      translationKey: item.translationKey,
      title: locContent.title,
      description: locContent.excerpt,
      category: item.category,
      coverImage: item.content.coverImage,
      coverAlt: locContent.coverAlt,
      coverFocalPoint: item.content.coverFocalPoint,
      socialImage: item.content.socialImage || item.content.coverImage,
      seoTitle: locContent.seoTitle || locContent.title,
      seoDescription: locContent.seoDescription || locContent.excerpt,
      status: item.status,
      authorName: locContent.authorName || null,
      publishedAt: item.content.publishedAt || null,
      updatedAt: item.content.updatedAt || null,
      reviewedBy: locContent.reviewedBy || null,
      reviewedAt: null,
      body: sections,
      blocks,
      readingTimeMinutes: readingTime.minutes,
      toc,
    });
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
  const snapshot = getPublicCmsSnapshot({ previewDrafts: false });
  const articles: EnrichedArticle[] = [];

  for (const item of snapshot.articles) {
    if (item.status !== "published") continue;
    const locContent = item.content.locales[locale];
    if (!locContent || !locContent.title.trim()) continue;

    const blocks = locContent.blocks || [];
    const sections = richBlocksToSections(blocks);
    const readingTime = calculateBlocksReadingTime(blocks);
    const toc = blocks
      .filter((b) => b.type === "heading" && Boolean(b.text))
      .map((b) => ({
        id: b.id,
        heading: b.text || "",
      }));

    articles.push({
      id: `${locale}-${item.slug}`,
      locale,
      slug: item.slug,
      translationKey: item.translationKey,
      title: locContent.title,
      description: locContent.excerpt,
      category: item.category,
      coverImage: item.content.coverImage,
      coverAlt: locContent.coverAlt,
      coverFocalPoint: item.content.coverFocalPoint,
      socialImage: item.content.socialImage || item.content.coverImage,
      seoTitle: locContent.seoTitle || locContent.title,
      seoDescription: locContent.seoDescription || locContent.excerpt,
      status: "published",
      authorName: locContent.authorName || null,
      publishedAt: item.content.publishedAt || null,
      updatedAt: item.content.updatedAt || null,
      reviewedBy: locContent.reviewedBy || null,
      reviewedAt: null,
      body: sections,
      blocks,
      readingTimeMinutes: readingTime.minutes,
      toc,
    });
  }

  return articles;
}

/**
 * Returns a single published article by slug, or null if not found or still a draft.
 * Drafts are never exposed on public URLs unless authenticated draft preview is active
 * or ALLOW_LOCAL_DRAFT_PREVIEW=true in development mode.
 */
export function getPublicArticleBySlug(
  locale: Locale,
  slug: string,
  allowAuthenticatedDraftPreview = false
): EnrichedArticle | null {
  const allowLocalDrafts =
    (process.env.NODE_ENV !== "production" &&
      process.env.ALLOW_LOCAL_DRAFT_PREVIEW === "true") ||
    allowAuthenticatedDraftPreview;

  if (allowLocalDrafts) {
    const all = getAllArticlesForLocale(locale);
    return all.find((a) => a.slug === slug) ?? null;
  }

  const published = getPublishedArticles(locale);
  return published.find((a) => a.slug === slug) ?? null;
}

/**
 * Finds the translated counterpart of an article by translationKey.
 */
export function getTranslatedArticle(
  translationKey: string,
  targetLocale: Locale,
  allowAuthenticatedDraftPreview = false
): EnrichedArticle | null {
  const allowLocalDrafts =
    (process.env.NODE_ENV !== "production" &&
      process.env.ALLOW_LOCAL_DRAFT_PREVIEW === "true") ||
    allowAuthenticatedDraftPreview;

  const list = allowLocalDrafts
    ? getAllArticlesForLocale(targetLocale)
    : getPublishedArticles(targetLocale);

  return list.find((a) => a.translationKey === translationKey) ?? null;
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
