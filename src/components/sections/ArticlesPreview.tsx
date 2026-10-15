import React from "react";
import Link from "next/link";
import { getCopy } from "@/lib/content";
import {
  getCategoryLabel,
  getPublishedArticles,
} from "@/lib/articles";
import { Locale, localizePath } from "@/lib/locales";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/interactive/Reveal";

interface ArticlesPreviewProps {
  locale: Locale;
}

export function ArticlesPreview({ locale }: ArticlesPreviewProps) {
  const copy = getCopy(locale);
  const publishedArticles = getPublishedArticles(locale).slice(0, 3);
  const articlesHubHref = localizePath(locale, "articles");

  if (publishedArticles.length === 0) {
    return (
      <section
        className="articles-compact-strip-section"
        aria-labelledby="articles-preview-heading"
      >
        <Container>
          <Reveal variant="fade-up">
            <div className="articles-compact-strip">
              <div className="articles-compact-strip-copy">
                <div className="eyebrow-row" style={{ marginBlockEnd: "0.35rem" }}>
                  <span className="eyebrow-line" aria-hidden="true" />
                  <span className="eyebrow-text">
                    05 — {copy.articlesPreviewSection.eyebrow}
                  </span>
                </div>
                <h2
                  id="articles-preview-heading"
                  className="articles-compact-strip-title"
                >
                  {copy.articlesPreviewSection.title}
                </h2>
                <p className="articles-compact-strip-desc">
                  {copy.articlesPreviewSection.emptyNote}
                </p>
              </div>

              <div className="articles-compact-strip-action">
                <Button href={articlesHubHref} variant="secondary">
                  <span>{copy.articlesPreviewSection.hubLinkLabel}</span>
                  <span className="btn-arrow-glyph" aria-hidden="true">
                    {locale === "ar" ? "←" : "→"}
                  </span>
                </Button>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>
    );
  }

  const [featuredArticle, ...supportingArticles] = publishedArticles;

  return (
    <section
      className="articles-preview-section"
      aria-labelledby="articles-preview-heading"
    >
      <Container>
        <Reveal variant="fade-up">
          <div className="specialties-header-row">
            <SectionHeading
              id="articles-preview-heading"
              eyebrow={`05 — ${copy.articlesPreviewSection.eyebrow}`}
              title={copy.articlesPreviewSection.title}
              subtitle={copy.articlesPreviewSection.subtitle}
            />

            <div className="specialties-header-cta">
              <Button href={articlesHubHref} variant="secondary">
                <span>{copy.articlesPreviewSection.hubLinkLabel}</span>
                <span className="btn-arrow-glyph" aria-hidden="true">
                  {locale === "ar" ? "←" : "→"}
                </span>
              </Button>
            </div>
          </div>
        </Reveal>

        <div className="articles-editorial-grid">
          {featuredArticle && (
            <Reveal variant="fade-up" className="articles-featured-col">
              <article className="article-card article-card-featured">
                <Link
                  href={localizePath(locale, `articles/${featuredArticle.slug}`)}
                  className="article-card-media-link"
                >
                  <div className="article-card-img-wrap">
                    <img
                      src={featuredArticle.coverImage}
                      alt={featuredArticle.coverAlt}
                      width={1280}
                      height={720}
                      loading="lazy"
                      decoding="async"
                      className="article-card-img"
                    />
                    <span
                      className="article-edition-badge"
                      dir="ltr"
                      aria-hidden="true"
                    >
                      01
                    </span>
                  </div>
                </Link>

                <div className="article-card-body">
                  <div className="article-card-meta">
                    <span className="article-category-tag">
                      {getCategoryLabel(locale, featuredArticle.category)}
                    </span>
                    <span className="article-reading-time">
                      {copy.articlesPage.readingTimeLabel(
                        featuredArticle.readingTimeMinutes
                      )}
                    </span>
                  </div>

                  <h3 className="article-card-title">
                    <Link
                      href={localizePath(
                        locale,
                        `articles/${featuredArticle.slug}`
                      )}
                    >
                      {featuredArticle.title}
                    </Link>
                  </h3>

                  <p className="article-card-desc">
                    {featuredArticle.description}
                  </p>

                  <Link
                    href={localizePath(
                      locale,
                      `articles/${featuredArticle.slug}`
                    )}
                    className="article-card-link"
                  >
                    <span>{copy.articlesPreviewSection.readArticleLabel}</span>
                    <span className="btn-arrow-glyph" aria-hidden="true">
                      {locale === "ar" ? "←" : "→"}
                    </span>
                  </Link>
                </div>
              </article>
            </Reveal>
          )}

          {supportingArticles.length > 0 && (
            <div className="articles-supporting-col">
              {supportingArticles.map((article, idx) => {
                const articleHref = localizePath(
                  locale,
                  `articles/${article.slug}`
                );
                return (
                  <Reveal
                    key={article.id}
                    variant="fade-up"
                    delayMs={(idx + 1) * 90}
                  >
                    <article className="article-card article-card-supporting">
                      <Link
                        href={articleHref}
                        className="article-card-media-link"
                      >
                        <div className="article-card-img-wrap">
                          <img
                            src={article.coverImage}
                            alt={article.coverAlt}
                            width={1280}
                            height={720}
                            loading="lazy"
                            decoding="async"
                            className="article-card-img"
                          />
                          <span
                            className="article-edition-badge"
                            dir="ltr"
                            aria-hidden="true"
                          >
                            0{idx + 2}
                          </span>
                        </div>
                      </Link>

                      <div className="article-card-body">
                        <div className="article-card-meta">
                          <span className="article-category-tag">
                            {getCategoryLabel(locale, article.category)}
                          </span>
                          <span className="article-reading-time">
                            {copy.articlesPage.readingTimeLabel(
                              article.readingTimeMinutes
                            )}
                          </span>
                        </div>

                        <h3 className="article-card-title">
                          <Link href={articleHref}>{article.title}</Link>
                        </h3>

                        <p className="article-card-desc">
                          {article.description}
                        </p>

                        <Link
                          href={articleHref}
                          className="article-card-link"
                        >
                          <span>
                            {copy.articlesPreviewSection.readArticleLabel}
                          </span>
                          <span className="btn-arrow-glyph" aria-hidden="true">
                            {locale === "ar" ? "←" : "→"}
                          </span>
                        </Link>
                      </div>
                    </article>
                  </Reveal>
                );
              })}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
