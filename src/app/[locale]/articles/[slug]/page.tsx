import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCopy, siteConfig } from "@/lib/content";
import {
  getAllArticlesForLocale,
  getCategoryLabel,
  getPublicArticleBySlug,
  getRelatedPublishedArticles,
  getTranslatedArticle,
} from "@/lib/articles";
import {
  getOppositeLocale,
  isValidLocale,
  Locale,
  localizePath,
} from "@/lib/locales";
import { toAbsoluteUrl } from "@/lib/seo";
import { Container } from "@/components/ui/Container";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { ArticleInteractiveEnhancements } from "@/components/articles/ArticleInteractiveEnhancements";

interface ArticlePageProps {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}

function resolveArticle(
  locale: Locale,
  slug: string,
  allowDraftQuery: boolean
) {
  const pub = getPublicArticleBySlug(locale, slug);
  if (pub) return pub;

  const allowLocalDrafts =
    process.env.NODE_ENV !== "production" &&
    process.env.ALLOW_LOCAL_DRAFT_PREVIEW === "true";

  if (allowDraftQuery && allowLocalDrafts) {
    return (
      getAllArticlesForLocale(locale).find((a) => a.slug === slug) ?? null
    );
  }
  return null;
}

export async function generateMetadata({
  params,
  searchParams,
}: ArticlePageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const sp = await searchParams;
  if (!isValidLocale(locale)) return {};

  const isPreviewQuery = sp?.preview === "draft";
  const article = resolveArticle(locale, slug, isPreviewQuery);
  if (!article) return {};

  const oppositeLocale = getOppositeLocale(locale);
  const translated = getTranslatedArticle(
    article.translationKey,
    oppositeLocale
  );

  const canonicalUrl = toAbsoluteUrl(`/${locale}/articles/${article.slug}`);
  const languages: Record<string, string> = {
    [locale]: canonicalUrl,
  };
  if (translated) {
    const translatedUrl = toAbsoluteUrl(
      `/${oppositeLocale}/articles/${translated.slug}`
    );
    languages[oppositeLocale] = translatedUrl;
    languages["x-default"] = locale === "ar" ? canonicalUrl : translatedUrl;
  } else if (locale === "ar") {
    languages["x-default"] = canonicalUrl;
  }

  const isNoIndex = siteConfig.previewNoIndex || article.status !== "published";

  return {
    title: `${article.title} | ${siteConfig.name[locale]}`,
    description: article.description,
    robots: isNoIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    alternates: {
      canonical: canonicalUrl,
      languages,
    },
    openGraph: {
      title: article.title,
      description: article.description,
      url: canonicalUrl,
      type: "article",
      locale: locale === "ar" ? "ar_SA" : "en_US",
      ...(article.publishedAt ? { publishedTime: article.publishedAt } : {}),
      ...(article.updatedAt ? { modifiedTime: article.updatedAt } : {}),
      images: [
        {
          url: toAbsoluteUrl(article.coverImage),
          alt: article.coverAlt,
        },
      ],
    },
  };
}

export default async function ArticleDetailPage({
  params,
  searchParams,
}: ArticlePageProps) {
  const { locale, slug } = await params;
  const sp = await searchParams;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const isPreviewQuery = sp?.preview === "draft";
  const article = resolveArticle(locale, slug, isPreviewQuery);
  if (!article) {
    notFound();
  }

  const copy = getCopy(locale);
  const oppositeLocale = getOppositeLocale(locale);
  const translatedPub = getTranslatedArticle(
    article.translationKey,
    oppositeLocale
  );
  const translatedDraft =
    isPreviewQuery && siteConfig.previewNoIndex
      ? getAllArticlesForLocale(oppositeLocale).find(
          (a) => a.translationKey === article.translationKey
        )
      : null;

  const switchTargetHref = translatedPub
    ? localizePath(oppositeLocale, `articles/${translatedPub.slug}`)
    : translatedDraft
    ? `${localizePath(oppositeLocale, `articles/${translatedDraft.slug}`)}?preview=draft`
    : localizePath(oppositeLocale, "articles");

  const relatedArticles = getRelatedPublishedArticles(
    locale,
    article.slug,
    2
  );

  const homeHref = localizePath(locale, "");
  const articlesHubHref = localizePath(locale, "articles");
  const currentPath = localizePath(locale, `articles/${article.slug}`);

  const articleJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    inLanguage: locale,
    mainEntityOfPage: toAbsoluteUrl(currentPath),
    image: [toAbsoluteUrl(article.coverImage)],
    ...(article.authorName
      ? {
          author: {
            "@type": "Organization",
            name: article.authorName,
          },
        }
      : {}),
    ...(article.reviewedBy
      ? {
          reviewedBy: {
            "@type": "Person",
            name: article.reviewedBy,
          },
        }
      : {}),
    ...(article.publishedAt ? { datePublished: article.publishedAt } : {}),
    ...(article.updatedAt ? { dateModified: article.updatedAt } : {}),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: copy.nav.home,
        item: toAbsoluteUrl(homeHref),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: copy.nav.articles,
        item: toAbsoluteUrl(articlesHubHref),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: article.title,
        item: toAbsoluteUrl(currentPath),
      },
    ],
  };

  const hasVerifiedByline = Boolean(
    article.authorName ||
      article.reviewedBy ||
      article.publishedAt ||
      article.updatedAt
  );

  return (
    <>
      <div data-article-switch-href={switchTargetHref} hidden />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <article className="article-detail-page">
        <header className="page-hero">
          <Container>
            {article.status === "draft" && (
              <div className="article-draft-banner" role="status">
                {copy.articlesPage.draftBanner}
              </div>
            )}

            <nav
              className="breadcrumb-nav"
              aria-label={copy.a11y.breadcrumbLabel}
            >
              <ol className="breadcrumb-list">
                <li>
                  <Link href={homeHref} className="breadcrumb-link">
                    {copy.nav.home}
                  </Link>
                </li>
                <li aria-hidden="true" className="breadcrumb-sep">
                  /
                </li>
                <li>
                  <Link href={articlesHubHref} className="breadcrumb-link">
                    {copy.nav.articles}
                  </Link>
                </li>
                <li aria-hidden="true" className="breadcrumb-sep">
                  /
                </li>
                <li aria-current="page" className="breadcrumb-current">
                  {article.title}
                </li>
              </ol>
            </nav>

            <div className="article-header-meta">
              <span className="article-category-tag">
                {getCategoryLabel(locale, article.category)}
              </span>
              <span className="article-reading-time">
                {copy.articlesPage.readingTimeLabel(article.readingTimeMinutes)}
              </span>
            </div>

            <h1 className="page-hero-title">{article.title}</h1>
            <div className="section-Rule" aria-hidden="true" />
            <p className="page-hero-lead">{article.description}</p>

            {hasVerifiedByline && (
              <dl className="article-byline-row">
                {article.authorName && (
                  <div className="article-byline-item">
                    <dt>{copy.articlesPage.authorLabel}:</dt>
                    <dd>{article.authorName}</dd>
                  </div>
                )}
                {article.reviewedBy && (
                  <div className="article-byline-item">
                    <dt>{copy.articlesPage.reviewedByLabel}:</dt>
                    <dd>{article.reviewedBy}</dd>
                  </div>
                )}
                {article.publishedAt && (
                  <div className="article-byline-item">
                    <dt>{copy.articlesPage.publishedDateLabel}:</dt>
                    <dd>
                      <time dateTime={article.publishedAt}>
                        {article.publishedAt}
                      </time>
                    </dd>
                  </div>
                )}
                {article.updatedAt && (
                  <div className="article-byline-item">
                    <dt>{copy.articlesPage.updatedDateLabel}:</dt>
                    <dd>
                      <time dateTime={article.updatedAt}>
                        {article.updatedAt}
                      </time>
                    </dd>
                  </div>
                )}
              </dl>
            )}
          </Container>
        </header>

        <section className="page-section">
          <Container>
            <figure className="article-detail-cover">
              <img
                src={article.coverImage}
                alt={article.coverAlt}
                width={1280}
                height={720}
                loading="eager"
                decoding="async"
                className="article-detail-cover-img"
              />
            </figure>

            <div className="article-content-layout">
              {/* Top Reading Progress Indicator + Active-Section Highlighted TOC */}
              <ArticleInteractiveEnhancements
                toc={article.toc}
                tocTitle={copy.articlesPage.tocTitle}
              />

              {/* Article Body Sections */}
              <div className="article-body-prose">
                {article.body.map((section) => (
                  <section
                    key={section.id}
                    id={section.id}
                    className="article-body-section"
                  >
                    <h2 className="article-section-heading">
                      {section.heading}
                    </h2>
                    {section.paragraphs.map((p, idx) => (
                      <p key={idx} className="article-paragraph">
                        {p}
                      </p>
                    ))}
                    {section.listItems && section.listItems.length > 0 && (
                      <ul className="editorial-bullet-list">
                        {section.listItems.map((li) => (
                          <li key={li} className="editorial-bullet-item">
                            {li}
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                ))}

                <div className="article-back-row">
                  <Link href={articlesHubHref} className="btn btn-secondary">
                    <span>{copy.articlesPage.backToArticles}</span>
                    <span className="btn-arrow-glyph" aria-hidden="true">
                      {locale === "ar" ? "←" : "→"}
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* Related Published Articles */}
        {relatedArticles.length > 0 && (
          <section
            className="page-section"
            style={{ backgroundColor: "var(--surface-ivory-elevated)" }}
            aria-labelledby="related-articles-heading"
          >
            <Container>
              <h2 id="related-articles-heading" className="section-title">
                {copy.articlesPage.relatedTitle}
              </h2>
              <div className="section-Rule" aria-hidden="true" />
              <div className="articles-cards-grid">
                {relatedArticles.map((rel) => {
                  const relHref = localizePath(locale, `articles/${rel.slug}`);
                  return (
                    <article key={rel.id} className="article-card">
                      <div className="article-card-body">
                        <span className="article-category-tag">
                          {getCategoryLabel(locale, rel.category)}
                        </span>
                        <h3 className="article-card-title">
                          <Link href={relHref}>{rel.title}</Link>
                        </h3>
                        <p className="article-card-desc">{rel.description}</p>
                        <Link
                          href={relHref}
                          className="article-card-link editorial-underline-link"
                        >
                          <span>{copy.articlesPage.readMoreLabel}</span>
                          <span className="btn-arrow-glyph" aria-hidden="true">
                            {locale === "ar" ? "←" : "→"}
                          </span>
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </Container>
          </section>
        )}
      </article>

      <ContactCTA locale={locale} />
    </>
  );
}
