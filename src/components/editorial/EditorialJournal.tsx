import React from "react";
import Link from "next/link";
import { getCopy } from "@/lib/content";
import { getCategoryLabel, getPublishedArticles } from "@/lib/articles";
import { Locale, localizePath } from "@/lib/locales";
import { Reveal } from "@/components/interactive/Reveal";

interface EditorialJournalProps {
  locale: Locale;
}

export function EditorialJournal({ locale }: EditorialJournalProps) {
  const copy = getCopy(locale);
  const published = getPublishedArticles(locale);
  const hubHref = localizePath(locale, "articles");

  const [featured, ...supporting] = published;

  return (
    <section
      id="journal-section"
      className="ed-journal-section"
      aria-labelledby="journal-heading"
    >
      <div className="ed-container">
        {/* Journal Section Header */}
        <Reveal variant="fade-up" className="ed-journal-header">
          <div className="ed-journal-header-main">
            <div className="ed-eyebrow-cluster">
              <span className="ed-index-num" dir="ltr">
                04
              </span>
              <span className="ed-eyebrow-rule" aria-hidden="true" />
              <span className="ed-eyebrow-label">
                {copy.articlesPreviewSection.eyebrow}
              </span>
            </div>

            <h2 id="journal-heading" className="ed-section-title">
              {copy.articlesPreviewSection.title}
            </h2>
          </div>

          <div className="ed-journal-header-aside">
            <p className="ed-section-intro">
              {copy.articlesPreviewSection.subtitle}
            </p>
            <Link href={hubHref} className="ed-inline-arrow-link">
              <span>{copy.articlesPreviewSection.hubLinkLabel}</span>
              <span aria-hidden="true">{locale === "ar" ? "←" : "→"}</span>
            </Link>
          </div>
        </Reveal>

        {featured ? (
          supporting.length === 0 ? (
            /* Intentional Single-Article Monograph Layout (when only 1 published article exists) */
            <Reveal variant="fade-up" className="ed-journal-single-monograph">
              <article className="ed-monograph-grid">
                <Link
                  href={localizePath(locale, `articles/${featured.slug}`)}
                  className="ed-monograph-cover-link"
                >
                  <div className="ed-monograph-cover-frame">
                    <img
                      src={featured.coverImage}
                      alt={featured.coverAlt}
                      width={1280}
                      height={720}
                      loading="eager"
                      decoding="async"
                      className="ed-monograph-cover-img"
                    />
                    <span
                      className="ed-monograph-issue-badge"
                      dir="ltr"
                      aria-hidden="true"
                    >
                      01
                    </span>
                  </div>
                </Link>

                <div className="ed-monograph-content">
                  <div className="ed-journal-meta-bar">
                    <span className="ed-journal-category article-category-tag">
                      {getCategoryLabel(locale, featured.category)}
                    </span>
                    <span className="ed-meta-sep" aria-hidden="true">
                      ·
                    </span>
                    <span className="ed-journal-reading-time article-reading-time">
                      {copy.articlesPage.readingTimeLabel(
                        featured.readingTimeMinutes
                      )}
                    </span>
                  </div>

                  <h3 className="ed-monograph-title">
                    <Link
                      href={localizePath(locale, `articles/${featured.slug}`)}
                    >
                      {featured.title}
                    </Link>
                  </h3>

                  <p className="ed-monograph-desc">{featured.description}</p>

                  {/* Chapter index preview from the article's real sections */}
                  {featured.toc.length > 0 && (
                    <div className="ed-monograph-chapters">
                      <span className="ed-monograph-chapters-label">
                        {copy.articlesPage.tocTitle}
                      </span>
                      <ol className="ed-monograph-chapters-list">
                        {featured.toc.map((chapter, idx) => (
                          <li
                            key={chapter.id}
                            className="ed-monograph-chapter-item"
                          >
                            <Link
                              href={`${localizePath(
                                locale,
                                `articles/${featured.slug}`
                              )}#${chapter.id}`}
                              className="ed-monograph-chapter-link"
                            >
                              <span
                                className="ed-monograph-chapter-num"
                                dir="ltr"
                              >
                                0{idx + 1}
                              </span>
                              <span>{chapter.heading}</span>
                            </Link>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  <div className="ed-monograph-actions">
                    <Link
                      href={localizePath(locale, `articles/${featured.slug}`)}
                      className="btn btn-primary"
                    >
                      <span>{copy.articlesPage.readMoreLabel}</span>
                      <span aria-hidden="true">
                        {locale === "ar" ? "←" : "→"}
                      </span>
                    </Link>

                    <Link href={hubHref} className="btn btn-secondary">
                      <span>{copy.articlesPreviewSection.hubLinkLabel}</span>
                    </Link>
                  </div>

                  <p className="ed-journal-editorial-note">
                    {copy.articlesPreviewSection.emptyNote}
                  </p>
                </div>
              </article>
            </Reveal>
          ) : (
            /* Multi-Article Layout: Featured Cover + Typographic List of Additional Published Articles */
            <div className="ed-journal-multi-grid">
              <Reveal variant="fade-up" className="ed-journal-featured-col">
                <article className="ed-journal-featured-card">
                  <Link
                    href={localizePath(locale, `articles/${featured.slug}`)}
                    className="ed-monograph-cover-link"
                  >
                    <div className="ed-monograph-cover-frame">
                      <img
                        src={featured.coverImage}
                        alt={featured.coverAlt}
                        width={1280}
                        height={720}
                        loading="eager"
                        decoding="async"
                        className="ed-monograph-cover-img"
                      />
                    </div>
                  </Link>

                  <div className="ed-journal-featured-body">
                    <div className="ed-journal-meta-bar">
                      <span className="ed-journal-category article-category-tag">
                        {getCategoryLabel(locale, featured.category)}
                      </span>
                      <span className="ed-meta-sep" aria-hidden="true">
                        ·
                      </span>
                      <span className="ed-journal-reading-time article-reading-time">
                        {copy.articlesPage.readingTimeLabel(
                          featured.readingTimeMinutes
                        )}
                      </span>
                    </div>

                    <h3 className="ed-monograph-title">
                      <Link
                        href={localizePath(locale, `articles/${featured.slug}`)}
                      >
                        {featured.title}
                      </Link>
                    </h3>

                    <p className="ed-monograph-desc">{featured.description}</p>

                    <Link
                      href={localizePath(locale, `articles/${featured.slug}`)}
                      className="ed-inline-arrow-link"
                    >
                      <span>{copy.articlesPreviewSection.readArticleLabel}</span>
                      <span aria-hidden="true">
                        {locale === "ar" ? "←" : "→"}
                      </span>
                    </Link>
                  </div>
                </article>
              </Reveal>

              <Reveal
                variant="fade-up"
                delayMs={100}
                className="ed-journal-typographic-list-col"
              >
                <div className="ed-journal-list-stack">
                  {supporting.map((article, idx) => {
                    const href = localizePath(
                      locale,
                      `articles/${article.slug}`
                    );
                    return (
                      <article
                        key={article.id}
                        className="ed-journal-list-item"
                      >
                        <div className="ed-journal-meta-bar">
                          <span className="ed-index-num" dir="ltr">
                            0{idx + 2}
                          </span>
                          <span className="ed-journal-category article-category-tag">
                            {getCategoryLabel(locale, article.category)}
                          </span>
                          <span className="ed-meta-sep" aria-hidden="true">
                            ·
                          </span>
                          <span className="ed-journal-reading-time article-reading-time">
                            {copy.articlesPage.readingTimeLabel(
                              article.readingTimeMinutes
                            )}
                          </span>
                        </div>
                        <h3 className="ed-journal-list-title">
                          <Link href={href}>{article.title}</Link>
                        </h3>
                        <p className="ed-journal-list-desc">
                          {article.description}
                        </p>
                      </article>
                    );
                  })}
                </div>
              </Reveal>
            </div>
          )
        ) : (
          <div className="ed-journal-empty-notice">
            <p>{copy.articlesPreviewSection.emptyNote}</p>
            <Link href={hubHref} className="btn btn-secondary">
              {copy.articlesPreviewSection.hubLinkLabel}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
