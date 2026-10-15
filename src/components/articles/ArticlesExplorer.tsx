"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { EnrichedArticle } from "@/lib/articles";
import {
  formatReadingTime,
  matchesArabicSearch,
  normalizeArabicSearch,
} from "@/lib/arabic-search";
import { Locale, localizePath } from "@/lib/locales";
import { ConsultationTriggerButton } from "@/components/interactive/ConsultationTriggerButton";

interface ArticlesExplorerProps {
  locale: Locale;
  articles: EnrichedArticle[];
  draftArticles?: EnrichedArticle[];
  categories: Record<string, string>;
  searchLabel: string;
  searchPlaceholder: string;
  categoryFilterLabel: string;
  resetButtonLabel: string;
  emptyPublishedTitle: string;
  emptyPublishedBody: string;
  emptySearchTitle: string;
  emptySearchBody: string;
  readMoreLabel: string;
  ctaLabel: string;
  whatsappFallbackHref: string;
}

const PAGE_SIZE = 6;

export function ArticlesExplorer({
  locale,
  articles,
  draftArticles = [],
  categories,
  searchLabel,
  searchPlaceholder,
  categoryFilterLabel,
  resetButtonLabel,
  emptyPublishedTitle,
  emptyPublishedBody,
  emptySearchTitle,
  emptySearchBody,
  readMoreLabel,
  ctaLabel,
  whatsappFallbackHref,
}: ArticlesExplorerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [previewDrafts, setPreviewDrafts] = useState(false);

  const categoryEntries = Object.entries(categories);

  const activeSourceArticles = useMemo(() => {
    if (previewDrafts && draftArticles.length > 0) {
      return [...articles, ...draftArticles];
    }
    return articles;
  }, [articles, draftArticles, previewDrafts]);

  const filteredArticles = useMemo(() => {
    const normalizedQuery = normalizeArabicSearch(searchQuery);
    return activeSourceArticles.filter((article) => {
      const matchesCategory =
        selectedCategory === "all" || article.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!normalizedQuery) return true;

      const bodyHeadings = article.body.map((s) => s.heading).join(" ");
      const searchableText = `${article.title} ${article.description} ${bodyHeadings}`;
      return matchesArabicSearch(searchableText, searchQuery);
    });
  }, [activeSourceArticles, searchQuery, selectedCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredArticles.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedArticles = filteredArticles.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const hasActiveFilters =
    searchQuery.trim().length > 0 || selectedCategory !== "all";
  const showToolbarReset = hasActiveFilters && filteredArticles.length > 0;

  const handleReset = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setCurrentPage(1);
  };

  const featuredArticle =
    safePage === 1 && paginatedArticles.length > 0
      ? paginatedArticles[0]
      : null;
  const supportingArticles =
    safePage === 1 && paginatedArticles.length > 1
      ? paginatedArticles.slice(1)
      : safePage > 1
      ? paginatedArticles
      : [];

  const getArticleLink = (article: EnrichedArticle) => {
    const base = localizePath(locale, `articles/${article.slug}`);
    return article.status === "draft" ? `${base}?preview=draft` : base;
  };

  return (
    <div className="articles-explorer">
      {/* Search & Category Filter Controls */}
      <div className="articles-controls-bar">
        <div className="articles-search-field">
          <label
            htmlFor="articles-search-input"
            className="articles-control-label"
          >
            {searchLabel}
          </label>
          <div className="articles-search-input-wrap">
            <input
              id="articles-search-input"
              type="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              className="articles-search-input"
            />
          </div>
        </div>

        <div className="articles-category-group">
          <span className="articles-control-label">{categoryFilterLabel}</span>
          <div
            className="articles-category-pills"
            role="group"
            aria-label={categoryFilterLabel}
          >
            {categoryEntries.map(([key, label]) => {
              const isSelected = selectedCategory === key;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={isSelected}
                  className={`article-filter-pill ${
                    isSelected ? "is-active" : ""
                  }`.trim()}
                  onClick={() => {
                    setSelectedCategory(key);
                    setCurrentPage(1);
                  }}
                >
                  <span className="article-pill-dot" aria-hidden="true" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {(showToolbarReset || draftArticles.length > 0) && (
          <div className="articles-reset-wrap">
            {showToolbarReset && (
              <button
                type="button"
                className="btn btn-secondary articles-reset-btn"
                onClick={handleReset}
              >
                {resetButtonLabel}
              </button>
            )}

            {draftArticles.length > 0 && (
              <button
                type="button"
                aria-pressed={previewDrafts}
                className={`article-draft-preview-toggle ${
                  previewDrafts ? "is-active" : ""
                }`.trim()}
                onClick={() => {
                  setPreviewDrafts((prev) => !prev);
                  setCurrentPage(1);
                }}
              >
                <span className="article-pill-dot" aria-hidden="true" />
                <span>
                  {previewDrafts
                    ? locale === "ar"
                      ? "إخفاء المسودات التحريرية (الوضع العام)"
                      : "Hide Editorial Drafts (Public View)"
                    : locale === "ar"
                    ? `معاينة المسودات التحريرية المحلية (${draftArticles.length})`
                    : `Preview Local Editorial Drafts (${draftArticles.length})`}
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results or Honest Empty State */}
      {activeSourceArticles.length === 0 && !hasActiveFilters ? (
        <div className="articles-empty-state" role="status">
          <div className="eyebrow-row">
            <span className="eyebrow-line" aria-hidden="true" />
            <span className="eyebrow-text">
              {locale === "ar" ? "تحديث المحتوى" : "Editorial Status"}
            </span>
          </div>
          <h2 className="articles-empty-title">{emptyPublishedTitle}</h2>
          <p className="articles-empty-body">{emptyPublishedBody}</p>
          <div
            style={{
              marginBlockStart: "1.75rem",
              display: "flex",
              flexWrap: "wrap",
              gap: "1rem",
              alignItems: "center",
            }}
          >
            <ConsultationTriggerButton
              label={ctaLabel}
              topicId="general"
              variant="primary"
              fallbackHref={whatsappFallbackHref}
            />
            {draftArticles.length > 0 && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setPreviewDrafts(true)}
              >
                {locale === "ar"
                  ? `معاينة المسودات التحريرية (${draftArticles.length})`
                  : `Preview Editorial Drafts (${draftArticles.length})`}
              </button>
            )}
          </div>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="articles-empty-state" role="status">
          <h2 className="articles-empty-title">{emptySearchTitle}</h2>
          <p className="articles-empty-body">{emptySearchBody}</p>
          <div style={{ marginBlockStart: "1.5rem" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleReset}
            >
              {resetButtonLabel}
            </button>
          </div>
        </div>
      ) : (
        <div
          key={`${selectedCategory}-${searchQuery}-${previewDrafts}-${safePage}`}
          className="articles-results-stage"
        >
          {/* Visually Prominent Featured Article */}
          {featuredArticle && (
            <article className="featured-article-card">
              <Link
                href={getArticleLink(featuredArticle)}
                className="featured-article-media"
              >
                <div className="featured-article-img-wrap">
                  <img
                    src={featuredArticle.coverImage}
                    alt={featuredArticle.coverAlt}
                    width={1280}
                    height={720}
                    loading="eager"
                    decoding="async"
                    className="article-card-img"
                  />
                </div>
              </Link>

              <div className="featured-article-content">
                <div className="article-card-meta">
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "0.5rem",
                      alignItems: "center",
                    }}
                  >
                    <span className="article-category-tag">
                      {categories[featuredArticle.category] ??
                        featuredArticle.category}
                    </span>
                    {featuredArticle.status === "draft" && (
                      <span className="article-draft-pill">
                        {locale === "ar" ? "مسودة معاينة" : "Draft Preview"}
                      </span>
                    )}
                  </div>
                  <span className="article-reading-time">
                    {formatReadingTime(
                      featuredArticle.readingTimeMinutes,
                      locale
                    )}
                  </span>
                </div>

                <h2 className="featured-article-title">
                  <Link href={getArticleLink(featuredArticle)}>
                    {featuredArticle.title}
                  </Link>
                </h2>

                <div className="section-Rule" aria-hidden="true" />

                <p className="featured-article-desc">
                  {featuredArticle.description}
                </p>

                <div style={{ marginBlockStart: "auto", paddingBlockStart: "1rem" }}>
                  <Link
                    href={getArticleLink(featuredArticle)}
                    className="btn btn-primary"
                  >
                    <span>{readMoreLabel}</span>
                    <span className="btn-arrow-glyph" aria-hidden="true">
                      {locale === "ar" ? "←" : "→"}
                    </span>
                  </Link>
                </div>
              </div>
            </article>
          )}

          {/* Supporting Articles Editorial Grid */}
          {supportingArticles.length > 0 && (
            <div className="articles-cards-grid">
              {supportingArticles.map((article) => {
                const articleHref = getArticleLink(article);
                return (
                  <article key={article.id} className="article-card">
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
                      </div>
                    </Link>

                    <div className="article-card-body">
                      <div className="article-card-meta">
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "0.4rem",
                            alignItems: "center",
                          }}
                        >
                          <span className="article-category-tag">
                            {categories[article.category] ?? article.category}
                          </span>
                          {article.status === "draft" && (
                            <span className="article-draft-pill">
                              {locale === "ar"
                                ? "مسودة معاينة"
                                : "Draft Preview"}
                            </span>
                          )}
                        </div>
                        <span className="article-reading-time">
                          {formatReadingTime(
                            article.readingTimeMinutes,
                            locale
                          )}
                        </span>
                      </div>

                      <h2 className="article-card-title">
                        <Link href={articleHref}>{article.title}</Link>
                      </h2>

                      <p className="article-card-desc">{article.description}</p>

                      <Link
                        href={articleHref}
                        className="article-card-link editorial-underline-link"
                      >
                        <span>{readMoreLabel}</span>
                        <span className="btn-arrow-glyph" aria-hidden="true">
                          {locale === "ar" ? "←" : "→"}
                        </span>
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <nav
              className="articles-pagination"
              aria-label={
                locale === "ar" ? "صفحات المقالات" : "Articles pagination"
              }
            >
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(
                (pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    aria-current={pageNum === safePage ? "page" : undefined}
                    className={`pagination-btn ${
                      pageNum === safePage ? "is-active" : ""
                    }`.trim()}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                )
              )}
            </nav>
          )}
        </div>
      )}
    </div>
  );
}
