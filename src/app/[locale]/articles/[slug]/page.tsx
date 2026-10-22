import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
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
import { FaqAndBooking } from "@/components/editorial/FaqAndBooking";
import { ArticleInteractiveEnhancements } from "@/components/articles/ArticleInteractiveEnhancements";
import { isDraftPreviewRequest } from "@/lib/cms/auth";
import { resolveSlugRedirect } from "@/lib/cms/db";
import { sanitizeRichTextInline } from "@/lib/cms/sanitize";

interface ArticlePageProps {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}

async function resolveArticle(
  locale: Locale,
  slug: string,
  previewQueryParam?: string
) {
  const isAuthenticatedPreview = await isDraftPreviewRequest(previewQueryParam);
  const pub = getPublicArticleBySlug(locale, slug, isAuthenticatedPreview);
  if (pub) return { article: pub, isAuthenticatedPreview };

  const allowLocalDrafts =
    process.env.NODE_ENV !== "production" &&
    process.env.ALLOW_LOCAL_DRAFT_PREVIEW === "true";

  if (previewQueryParam === "draft" && allowLocalDrafts) {
    const match =
      getAllArticlesForLocale(locale).find((a) => a.slug === slug) ?? null;
    return { article: match, isAuthenticatedPreview: true };
  }
  return { article: null, isAuthenticatedPreview };
}

export async function generateMetadata({
  params,
  searchParams,
}: ArticlePageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const sp = await searchParams;
  if (!isValidLocale(locale)) return {};

  const { article, isAuthenticatedPreview } = await resolveArticle(
    locale,
    slug,
    sp?.preview
  );
  if (!article) return {};

  const oppositeLocale = getOppositeLocale(locale);
  const translated = getTranslatedArticle(
    article.translationKey,
    oppositeLocale,
    isAuthenticatedPreview
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

  const isNoIndex =
    siteConfig.previewNoIndex ||
    article.status !== "published" ||
    isAuthenticatedPreview;

  const metaTitle =
    article.seoTitle || `${article.title} | ${siteConfig.name[locale]}`;
  const metaDesc = article.seoDescription || article.description;
  const socialImg = article.socialImage || article.coverImage;

  return {
    title: metaTitle,
    description: metaDesc,
    robots: isNoIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    alternates: {
      canonical: canonicalUrl,
      languages,
    },
    openGraph: {
      title: metaTitle,
      description: metaDesc,
      url: canonicalUrl,
      type: "article",
      locale: locale === "ar" ? "ar_SA" : "en_US",
      ...(article.publishedAt ? { publishedTime: article.publishedAt } : {}),
      ...(article.updatedAt ? { modifiedTime: article.updatedAt } : {}),
      images: [
        {
          url: toAbsoluteUrl(socialImg),
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

  // Handle automatic redirects for renamed article slugs
  const redirectTarget = resolveSlugRedirect("article", slug);
  if (redirectTarget && redirectTarget !== slug) {
    permanentRedirect(localizePath(locale, `articles/${redirectTarget}`));
  }

  const { article, isAuthenticatedPreview } = await resolveArticle(
    locale,
    slug,
    sp?.preview
  );
  if (!article) {
    notFound();
  }

  const copy = getCopy(locale);
  const oppositeLocale = getOppositeLocale(locale);
  const translatedPub = getTranslatedArticle(
    article.translationKey,
    oppositeLocale,
    false
  );
  const translatedDraft = isAuthenticatedPreview
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

  const focalPoint = article.coverFocalPoint ?? { x: 50, y: 50 };
  let headingCounter = 0;

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

      <article className="article-detail-page ed-article-detail">
        {/* Deep-Red Editorial Article Masthead with Inset Panoramic Cover Extending into Ivory */}
        <header className="ed-article-red-header">
          <div className="ed-container">
            {article.status === "draft" && (
              <div className="article-draft-banner" role="status">
                {copy.articlesPage.draftBanner}
              </div>
            )}

            <nav
              className="ed-breadcrumb-nav"
              aria-label={copy.a11y.breadcrumbLabel}
            >
              <ol className="ed-breadcrumb-list">
                <li>
                  <Link href={homeHref} className="ed-breadcrumb-link">
                    {copy.nav.home}
                  </Link>
                </li>
                <li aria-hidden="true" className="ed-breadcrumb-sep">
                  /
                </li>
                <li>
                  <Link href={articlesHubHref} className="ed-breadcrumb-link">
                    {copy.nav.articles}
                  </Link>
                </li>
                <li aria-hidden="true" className="ed-breadcrumb-sep">
                  /
                </li>
                <li aria-current="page" className="ed-breadcrumb-current">
                  {article.title}
                </li>
              </ol>
            </nav>

            <div className="ed-article-masthead-meta">
              <span className="ed-article-category-pill article-category-tag">
                {getCategoryLabel(locale, article.category)}
              </span>
              <span className="ed-article-reading-pill article-reading-time">
                {copy.articlesPage.readingTimeLabel(article.readingTimeMinutes)}
              </span>
            </div>

            <h1 className="ed-article-masthead-title">{article.title}</h1>

            <p className="ed-article-masthead-lead">{article.description}</p>

            {hasVerifiedByline && (
              <dl className="ed-article-byline-row">
                {article.authorName && (
                  <div className="ed-article-byline-item">
                    <dt>{copy.articlesPage.authorLabel}:</dt>
                    <dd>{article.authorName}</dd>
                  </div>
                )}
                {article.reviewedBy && (
                  <div className="ed-article-byline-item">
                    <dt>{copy.articlesPage.reviewedByLabel}:</dt>
                    <dd>{article.reviewedBy}</dd>
                  </div>
                )}
                {article.publishedAt && (
                  <div className="ed-article-byline-item">
                    <dt>{copy.articlesPage.publishedDateLabel}:</dt>
                    <dd>
                      <time dateTime={article.publishedAt}>
                        {article.publishedAt}
                      </time>
                    </dd>
                  </div>
                )}
                {article.updatedAt && (
                  <div className="ed-article-byline-item">
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
          </div>

          <div className="ed-article-cover-stage">
            <figure className="ed-article-cover-figure">
              <img
                src={article.coverImage}
                alt={article.coverAlt}
                width={1280}
                height={720}
                loading="eager"
                decoding="async"
                className="ed-article-cover-img"
                style={{
                  objectPosition: `${focalPoint.x}% ${focalPoint.y}%`,
                }}
              />
            </figure>
          </div>
        </header>

        <section className="ed-article-body-section">
          <div className="ed-container">
            <div className="article-content-layout">
              {/* Top Reading Progress Indicator + Active-Section Highlighted TOC */}
              <ArticleInteractiveEnhancements
                toc={article.toc}
                tocTitle={copy.articlesPage.tocTitle}
              />

              {/* Article Body Rich-Text Blocks */}
              <div className="article-body-prose">
                {article.blocks && article.blocks.length > 0
                  ? article.blocks.map((block, idx) => {
                      if (block.type === "heading") {
                        headingCounter++;
                        const HeadingTag =
                          block.headingLevel === 3 ? "h3" : "h2";
                        return (
                          <div
                            key={`${block.id}-${idx}`}
                            id={block.id}
                            className="article-body-heading-block"
                          >
                            {block.headingLevel !== 3 && (
                              <div className="ed-eyebrow-cluster">
                                <span className="ed-index-num" dir="ltr">
                                  {String(headingCounter).padStart(2, "0")}
                                </span>
                                <span
                                  className="ed-eyebrow-rule"
                                  aria-hidden="true"
                                />
                              </div>
                            )}
                            <HeadingTag className="article-section-heading">
                              {block.text}
                            </HeadingTag>
                          </div>
                        );
                      }

                      if (block.type === "paragraph") {
                        const safeHtml = sanitizeRichTextInline(
                          block.text || ""
                        );
                        return (
                          <div
                            key={`${block.id}-${idx}`}
                            className="article-paragraph-wrap"
                          >
                            <p
                              className="article-paragraph"
                              dangerouslySetInnerHTML={{ __html: safeHtml }}
                            />
                            {block.linkHref && (
                              <p className="article-inline-cta-link">
                                <a
                                  href={block.linkHref}
                                  className="ed-inline-arrow-link"
                                  target={
                                    block.linkHref.startsWith("http")
                                      ? "_blank"
                                      : undefined
                                  }
                                  rel={
                                    block.linkHref.startsWith("http")
                                      ? "noopener noreferrer"
                                      : undefined
                                  }
                                >
                                  <span>
                                    {block.linkLabel || block.linkHref}
                                  </span>
                                  <span aria-hidden="true">
                                    {locale === "ar" ? "←" : "→"}
                                  </span>
                                </a>
                              </p>
                            )}
                          </div>
                        );
                      }

                      if (block.type === "callout") {
                        const safeHtml = sanitizeRichTextInline(
                          block.text || ""
                        );
                        return (
                          <aside
                            key={`${block.id}-${idx}`}
                            className="ed-specialty-sheet-note"
                          >
                            <span
                              className="ed-eyebrow-rule"
                              aria-hidden="true"
                            />
                            <p
                              dangerouslySetInnerHTML={{ __html: safeHtml }}
                            />
                          </aside>
                        );
                      }

                      if (block.type === "bullet-list") {
                        return (
                          <ul
                            key={`${block.id}-${idx}`}
                            className="editorial-bullet-list"
                          >
                            {(block.items || []).map((li, liIdx) => (
                              <li
                                key={`${block.id}-li-${liIdx}`}
                                className="editorial-bullet-item"
                                dangerouslySetInnerHTML={{
                                  __html: sanitizeRichTextInline(li),
                                }}
                              />
                            ))}
                          </ul>
                        );
                      }

                      if (block.type === "ordered-list") {
                        return (
                          <ol
                            key={`${block.id}-${idx}`}
                            className="ed-context-points-list"
                          >
                            {(block.items || []).map((li, liIdx) => (
                              <li
                                key={`${block.id}-oli-${liIdx}`}
                                className="ed-context-point-item"
                              >
                                <span
                                  className="ed-credential-num"
                                  dir="ltr"
                                >
                                  {String(liIdx + 1).padStart(2, "0")}
                                </span>
                                <p
                                  dangerouslySetInnerHTML={{
                                    __html: sanitizeRichTextInline(li),
                                  }}
                                />
                              </li>
                            ))}
                          </ol>
                        );
                      }

                      if (block.type === "image" && block.imageUrl) {
                        return (
                          <figure
                            key={`${block.id}-${idx}`}
                            className="ed-article-inline-figure"
                          >
                            <img
                              src={block.imageUrl}
                              alt={block.imageAlt || article.title}
                              width={960}
                              height={640}
                              loading="lazy"
                              decoding="async"
                              className="ed-article-inline-img"
                            />
                            {block.imageCaption && (
                              <figcaption className="ed-specialty-sheet-caption">
                                {block.imageCaption}
                              </figcaption>
                            )}
                          </figure>
                        );
                      }

                      return null;
                    })
                  : article.body.map((section, idx) => (
                      <section
                        key={section.id}
                        id={section.id}
                        className="article-body-section"
                      >
                        <div className="ed-eyebrow-cluster">
                          <span className="ed-index-num" dir="ltr">
                            0{idx + 1}
                          </span>
                          <span
                            className="ed-eyebrow-rule"
                            aria-hidden="true"
                          />
                        </div>
                        <h2 className="article-section-heading">
                          {section.heading}
                        </h2>
                        {section.paragraphs.map((p, pIdx) => (
                          <p key={pIdx} className="article-paragraph">
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
                    <span aria-hidden="true">
                      {locale === "ar" ? "←" : "→"}
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Related Published Articles */}
        {relatedArticles.length > 0 && (
          <section
            className="ed-related-articles-section"
            aria-labelledby="related-articles-heading"
          >
            <div className="ed-container">
              <h2 id="related-articles-heading" className="ed-section-title">
                {copy.articlesPage.relatedTitle}
              </h2>
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
                          className="ed-inline-arrow-link"
                        >
                          <span>{copy.articlesPage.readMoreLabel}</span>
                          <span aria-hidden="true">
                            {locale === "ar" ? "←" : "→"}
                          </span>
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </article>

      <FaqAndBooking locale={locale} includeFaq={false} />
    </>
  );
}
