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
import { buildPageAlternates, toAbsoluteUrl } from "@/lib/seo";
import { Container } from "@/components/ui/Container";
import { ArticlesExplorer } from "@/components/articles/ArticlesExplorer";
import { ContactCTA } from "@/components/sections/ContactCTA";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const copy = getCopy(locale);
  const alternates = buildPageAlternates(locale, "articles");

  return {
    title: copy.articlesPage.meta.title,
    description: copy.articlesPage.meta.description,
    alternates,
    openGraph: {
      title: copy.articlesPage.meta.title,
      description: copy.articlesPage.meta.description,
      url: alternates.canonical,
      locale: locale === "ar" ? "ar_SA" : "en_US",
      type: "website",
      ...(siteConfig.doctorPortrait
        ? {
            images: [
              {
                url: toAbsoluteUrl(siteConfig.doctorPortrait),
                alt: copy.hero.portraitAlt,
              },
            ],
          }
        : {}),
    },
  };
}

export default async function ArticlesPage({ params }: PageProps) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const copy = getCopy(locale);
  const publishedArticles = getPublishedArticles(locale);
  const allowLocalDrafts =
    process.env.NODE_ENV !== "production" &&
    process.env.ALLOW_LOCAL_DRAFT_PREVIEW === "true";
  const draftArticles = allowLocalDrafts
    ? getAllArticlesForLocale(locale).filter((a) => a.status === "draft")
    : [];
  const whatsappUrl = getWhatsAppUrl(locale);

  return (
    <>
      <section className="page-hero" aria-labelledby="articles-page-heading">
        <Container>
          <div className="eyebrow-row">
            <span className="eyebrow-line" aria-hidden="true" />
            <span className="eyebrow-text">{copy.articlesPage.eyebrow}</span>
          </div>
          <h1 id="articles-page-heading" className="page-hero-title">
            {copy.articlesPage.title}
          </h1>
          <div className="section-Rule" aria-hidden="true" />
          <p className="page-hero-lead">{copy.articlesPage.lead}</p>
        </Container>
      </section>

      <section
        className="page-section section-reveal"
        aria-label={copy.articlesPage.title}
      >
        <Container>
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
        </Container>
      </section>

      <ContactCTA locale={locale} />
    </>
  );
}
