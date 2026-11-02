import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCopy, siteConfig } from "@/lib/content";
import {
  ARTICLE_CATEGORIES,
  getAllArticlesForLocale,
  getPublishedArticles,
} from "@/lib/articles";
import { getWhatsAppUrl } from "@/lib/links";
import { isValidLocale } from "@/lib/locales";
import {
  buildPageAlternates,
  buildSocialMetadata,
  DEFAULT_SOCIAL_IMAGE_PATH,
} from "@/lib/seo";
import { ArticlesExplorer } from "@/components/articles/ArticlesExplorer";
import { FaqAndBooking } from "@/components/editorial/FaqAndBooking";
import { isDraftPreviewRequest } from "@/lib/cms/auth";
import { getPublicCmsSnapshot } from "@/lib/cms/db";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ preview?: string }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const sp = searchParams ? await searchParams : undefined;
  if (!isValidLocale(locale)) return {};
  const copy = getCopy(locale);
  const previewDrafts = await isDraftPreviewRequest(sp?.preview);
  const alternates = buildPageAlternates(locale, "articles");

  return {
    title: copy.articlesPage.meta.title,
    description: copy.articlesPage.meta.description,
    ...(previewDrafts
      ? { robots: { index: false, follow: false } }
      : {}),
    alternates,
    ...buildSocialMetadata({
      locale,
      title: copy.articlesPage.meta.title,
      description: copy.articlesPage.meta.description,
      url: alternates.canonical,
      type: "website",
      imagePath: DEFAULT_SOCIAL_IMAGE_PATH,
    }),
  };
}

export default async function ArticlesPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  const sp = searchParams ? await searchParams : undefined;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const copy = getCopy(locale);
  const previewDrafts = await isDraftPreviewRequest(sp?.preview);
  const cms = getPublicCmsSnapshot({ previewDrafts });

  const publishedArticles = getPublishedArticles(locale);
  const allowLocalDrafts =
    (process.env.NODE_ENV !== "production" &&
      process.env.ALLOW_LOCAL_DRAFT_PREVIEW === "true") ||
    previewDrafts;
  const draftArticles = allowLocalDrafts
    ? getAllArticlesForLocale(locale).filter((a) => a.status === "draft")
    : [];
  const whatsappUrl = getWhatsAppUrl(
    locale,
    undefined,
    cms.contactSettings.whatsappDigits
  );

  return (
    <>
      <section
        className="ed-inner-red-masthead"
        aria-labelledby="articles-page-heading"
      >
        <div className="ed-container">
          <div className="ed-inner-masthead-content">
            <div className="ed-red-hero-label-row">
              <span className="ed-red-hero-rule" aria-hidden="true" />
              <span className="ed-red-hero-specialty-label">
                01 — {copy.articlesPage.eyebrow}
              </span>
              <span className="ed-red-hero-rule" aria-hidden="true" />
            </div>

            <h1 id="articles-page-heading" className="ed-inner-masthead-title">
              {copy.articlesPage.title}
            </h1>

            <p className="ed-inner-masthead-lead">{copy.articlesPage.lead}</p>
          </div>
        </div>
      </section>

      <section
        className="ed-articles-hub-section"
        aria-label={copy.articlesPage.title}
      >
        <div className="ed-container">
          <ArticlesExplorer
            locale={locale}
            articles={publishedArticles}
            draftArticles={draftArticles}
            categories={ARTICLE_CATEGORIES[locale]}
            searchLabel={copy.articlesPage.searchLabel}
            searchPlaceholder={copy.articlesPage.searchPlaceholder}
            categoryFilterLabel={copy.articlesPage.categoryFilterLabel}
            resetButtonLabel={copy.articlesPage.resetButton}
            emptyPublishedTitle={copy.articlesPage.emptyPublishedTitle}
            emptyPublishedBody={copy.articlesPage.emptyPublishedBody}
            emptySearchTitle={copy.articlesPage.emptySearchTitle}
            emptySearchBody={copy.articlesPage.emptySearchBody}
            readMoreLabel={copy.articlesPage.readMoreLabel}
            ctaLabel={copy.hero.primary}
            whatsappFallbackHref={whatsappUrl}
          />
        </div>
      </section>

      <FaqAndBooking locale={locale} includeFaq={false} />
    </>
  );
}
