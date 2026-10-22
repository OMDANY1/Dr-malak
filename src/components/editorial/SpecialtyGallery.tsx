"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { getCopy } from "@/lib/content";
import { getWhatsAppUrl } from "@/lib/links";
import { Locale, localizePath } from "@/lib/locales";
import { ConsultationTriggerButton } from "@/components/interactive/ConsultationTriggerButton";
import { Reveal } from "@/components/interactive/Reveal";
import { useCmsSnapshot } from "@/components/cms/CmsSnapshotContext";
import { resolveLocalizedText } from "@/lib/cms/sanitize";

interface SpecialtyGalleryProps {
  locale: Locale;
}

export function SpecialtyGallery({ locale }: SpecialtyGalleryProps) {
  const copy = getCopy(locale);
  const cms = useCmsSnapshot();
  const specialtiesPageHref = localizePath(locale, "specialties");

  const sectionConfig = cms?.homepage.sections.find(
    (s) => s.id === "specialties"
  );
  const sectionEyebrow = sectionConfig
    ? resolveLocalizedText(
        sectionConfig.eyebrow,
        locale,
        copy.specialtiesSection.eyebrow
      )
    : copy.specialtiesSection.eyebrow;
  const sectionTitle = sectionConfig
    ? resolveLocalizedText(
        sectionConfig.title,
        locale,
        copy.specialtiesSection.title
      )
    : copy.specialtiesSection.title;
  const sectionIntro = sectionConfig
    ? resolveLocalizedText(
        sectionConfig.supportingText,
        locale,
        copy.specialtiesSection.intro
      )
    : copy.specialtiesSection.intro;

  const items = useMemo(() => {
    if (!cms || cms.specialties.length === 0) {
      return copy.specialtiesSection.items.map((item) => ({
        ...item,
        focalPoint: { x: 50, y: 50 },
      }));
    }
    return cms.specialties.map((spec, idx) => {
      const c = spec.content;
      const numStr =
        c.numberLabel || String(idx + 1).padStart(2, "0");
      return {
        id: spec.slug,
        number: numStr,
        title: resolveLocalizedText(c.title, locale, spec.slug),
        tabLabel: resolveLocalizedText(c.title, locale, spec.slug),
        summary: resolveLocalizedText(c.introduction, locale, ""),
        detail: resolveLocalizedText(c.fullContent, locale, ""),
        assessmentNote: resolveLocalizedText(c.assessmentNote, locale, ""),
        visualCaption: resolveLocalizedText(c.visualCaption, locale, ""),
        image: c.coverImage,
        imageAlt: resolveLocalizedText(c.imageAlt, locale, ""),
        focalPoint: c.focalPoint || { x: 50, y: 50 },
        whatsappEnquiryMessage: resolveLocalizedText(
          c.whatsappMessage,
          locale,
          ""
        ),
        ctaLabel: resolveLocalizedText(
          c.ctaLabel,
          locale,
          copy.hero.primary
        ),
      };
    });
  }, [cms, copy, locale]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const lastTriggerRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  const activeItem = items.find((i) => i.id === selectedId) ?? null;

  const openDetailPanel = useCallback(
    (id: string, triggerEl?: HTMLElement | null) => {
      if (triggerEl) {
        lastTriggerRef.current = triggerEl;
      } else if (typeof document !== "undefined") {
        lastTriggerRef.current = document.activeElement as HTMLElement | null;
      }
      setSelectedId(id);
    },
    []
  );

  const closeDetailPanel = useCallback((restoreFocus = true) => {
    setSelectedId(null);
    if (restoreFocus) {
      requestAnimationFrame(() => {
        lastTriggerRef.current?.focus();
      });
    }
  }, []);

  useEffect(() => {
    if (!selectedId) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const timer = requestAnimationFrame(() => {
      closeBtnRef.current?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDetailPanel(true);
        return;
      }

      if (event.key === "Tab" && panelRef.current) {
        const focusable = Array.from(
          panelRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === first) {
            event.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelAnimationFrame(timer);
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedId, closeDetailPanel]);

  const placementVariants = [
    "ed-gallery-piece--dominant",
    "ed-gallery-piece--supporting-upper",
    "ed-gallery-piece--supporting-lower",
  ];

  return (
    <section
      id="specialties-section"
      className="ed-specialty-gallery-section"
      aria-labelledby="specialties-heading"
    >
      <div className="ed-container">
        {/* Section Editorial Header */}
        <Reveal variant="fade-up" className="ed-specialty-gallery-header">
          <div className="ed-specialty-header-main">
            <div className="ed-eyebrow-cluster">
              <span className="ed-index-num" dir="ltr">
                01
              </span>
              <span className="ed-eyebrow-rule" aria-hidden="true" />
              <span className="ed-eyebrow-label">{sectionEyebrow}</span>
            </div>

            <h2 id="specialties-heading" className="ed-section-title">
              {sectionTitle}
            </h2>
          </div>

          <div className="ed-specialty-header-aside">
            <p className="ed-section-intro">{sectionIntro}</p>
            <Link
              href={specialtiesPageHref}
              className="ed-inline-arrow-link"
            >
              <span>{copy.specialtiesSection.viewAllCta}</span>
              <span aria-hidden="true">{locale === "ar" ? "←" : "→"}</span>
            </Link>
          </div>
        </Reveal>

        {/* Asymmetric Photographic Gallery (1 Dominant Tall + 2 Staggered Supporting Images) */}
        <div className="ed-specialty-asymmetric-gallery">
          {items.map((item, idx) => {
            const variantClass =
              placementVariants[idx] || "ed-gallery-piece--supporting-upper";
            const itemFullPageHref = `${specialtiesPageHref}#chapter-${item.id}`;
            const isSelected = selectedId === item.id;

            return (
              <Reveal
                key={item.id}
                variant="fade-up"
                delayMs={idx * 90}
                className={`ed-gallery-piece ${variantClass} ${
                  isSelected ? "is-selected" : ""
                }`.trim()}
              >
                <article
                  className="ed-gallery-piece-article"
                  aria-labelledby={`gallery-title-${item.id}`}
                >
                  {/* Clickable Photographic Frame Opening the Detail Panel */}
                  <div className="ed-gallery-media-wrap">
                    <button
                      type="button"
                      className="ed-gallery-image-trigger"
                      aria-haspopup="dialog"
                      aria-expanded={isSelected}
                      aria-controls="ed-specialty-detail-panel"
                      aria-label={`${item.title} — ${
                        locale === "ar"
                          ? "عرض النبذة التفصيلية"
                          : "Open specialty details"
                      }`}
                      onClick={(e) => openDetailPanel(item.id, e.currentTarget)}
                    >
                      <div className="ed-gallery-img-frame">
                        <img
                          src={item.image}
                          alt={item.imageAlt}
                          width={idx === 0 ? 896 : 1024}
                          height={idx === 0 ? 1152 : 768}
                          loading="eager"
                          decoding="async"
                          className="ed-gallery-img"
                          style={{
                            objectPosition: `${item.focalPoint.x}% ${item.focalPoint.y}%`,
                          }}
                        />
                        <span
                          className="ed-gallery-index-tag"
                          dir="ltr"
                          aria-hidden="true"
                        >
                          {item.number}
                        </span>
                      </div>
                    </button>
                  </div>

                  {/* Integrated Specialty Name, Short Description, Panel Trigger & Normal Link Fallback */}
                  <div className="ed-gallery-copy-block">
                    <div className="ed-gallery-meta-row">
                      <span className="ed-gallery-num" dir="ltr">
                        {item.number}
                      </span>
                      <span className="ed-eyebrow-rule" aria-hidden="true" />
                      <span className="ed-gallery-caption-tag">
                        {sectionEyebrow}
                      </span>
                    </div>

                    <h3
                      id={`gallery-title-${item.id}`}
                      className="ed-gallery-title specialty-photo-card-title"
                    >
                      {item.title}
                    </h3>

                    <p className="ed-gallery-summary specialty-photo-card-summary">
                      {item.summary}
                    </p>

                    <div className="ed-gallery-actions">
                      <button
                        type="button"
                        id={`specialty-trigger-${item.id}`}
                        className="ed-gallery-detail-btn"
                        aria-haspopup="dialog"
                        aria-expanded={isSelected}
                        aria-controls="ed-specialty-detail-panel"
                        onClick={(e) =>
                          openDetailPanel(item.id, e.currentTarget)
                        }
                      >
                        <span>
                          {locale === "ar"
                            ? "نبذة المجال والتفاصيل"
                            : "Explore specialty details"}
                        </span>
                        <span aria-hidden="true">+</span>
                      </button>

                      {/* Normal navigation fallback to full specialty page */}
                      <Link
                        href={itemFullPageHref}
                        className="ed-gallery-fallback-link"
                      >
                        <span>
                          {locale === "ar" ? "صفحة التخصص" : "Full page"}
                        </span>
                        <span aria-hidden="true">
                          {locale === "ar" ? "←" : "→"}
                        </span>
                      </Link>
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>

      {/* Accessible Specialty Detail Panel (Dialog Sheet with Close Control, Keyboard Support & Full-Page Link) */}
      <div
        id="ed-specialty-detail-panel"
        className={`ed-specialty-detail-backdrop ${
          activeItem ? "is-open" : ""
        }`.trim()}
        hidden={!activeItem}
        aria-hidden={!activeItem}
        inert={!activeItem ? true : undefined}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            closeDetailPanel(true);
          }
        }}
      >
        {activeItem && (
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ed-specialty-panel-title"
            className="ed-specialty-detail-sheet"
          >
            <div className="ed-specialty-sheet-topbar">
              <div className="ed-eyebrow-cluster">
                <span className="ed-index-num" dir="ltr">
                  {activeItem.number} / 0{items.length}
                </span>
                <span className="ed-eyebrow-rule" aria-hidden="true" />
                <span className="ed-eyebrow-label">{sectionEyebrow}</span>
              </div>

              <button
                ref={closeBtnRef}
                type="button"
                className="ed-specialty-sheet-close"
                aria-label={
                  locale === "ar"
                    ? "إغلاق نافذة تفاصيل التخصص"
                    : "Close specialty detail panel"
                }
                onClick={() => closeDetailPanel(true)}
              >
                <span>{locale === "ar" ? "إغلاق" : "Close"}</span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M4 4L16 16M16 4L4 16"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="square"
                  />
                </svg>
              </button>
            </div>

            {/* Quick switcher pills inside the detail sheet */}
            <div
              className="ed-specialty-sheet-switcher"
              role="group"
              aria-label={copy.specialtiesSection.tabsAriaLabel}
            >
              {items.map((tab) => {
                const isCurrent = tab.id === activeItem.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    className={`ed-sheet-switch-pill ${
                      isCurrent ? "is-active" : ""
                    }`.trim()}
                    aria-pressed={isCurrent}
                    onClick={() => setSelectedId(tab.id)}
                  >
                    <span dir="ltr">{tab.number}</span>
                    <span>{tab.title}</span>
                  </button>
                );
              })}
            </div>

            <div className="ed-specialty-sheet-body">
              <figure className="ed-specialty-sheet-figure">
                <img
                  src={activeItem.image}
                  alt={activeItem.imageAlt}
                  width={896}
                  height={672}
                  className="ed-specialty-sheet-img"
                />
                <figcaption className="ed-specialty-sheet-caption">
                  {activeItem.visualCaption}
                </figcaption>
              </figure>

              <div className="ed-specialty-sheet-copy">
                <h3
                  id="ed-specialty-panel-title"
                  className="ed-specialty-sheet-title"
                >
                  {activeItem.title}
                </h3>

                <p className="ed-specialty-sheet-summary">
                  {activeItem.summary}
                </p>

                <p className="ed-specialty-sheet-detail">{activeItem.detail}</p>

                <div className="ed-specialty-sheet-note">
                  <span className="ed-eyebrow-rule" aria-hidden="true" />
                  <p>{activeItem.assessmentNote}</p>
                </div>

                <div className="ed-specialty-sheet-actions">
                  <ConsultationTriggerButton
                    label={activeItem.ctaLabel}
                    topicId={activeItem.id}
                    variant="primary"
                    fallbackHref={getWhatsAppUrl(
                      locale,
                      activeItem.whatsappEnquiryMessage,
                      cms?.contactSettings.whatsappDigits
                    )}
                    onTrigger={() => closeDetailPanel(false)}
                  />

                  <Link
                    href={`${specialtiesPageHref}#chapter-${activeItem.id}`}
                    className="btn btn-secondary ed-sheet-fullpage-link"
                    onClick={() => closeDetailPanel(false)}
                  >
                    <span>{copy.specialtiesSection.viewAllCta}</span>
                    <span aria-hidden="true">
                      {locale === "ar" ? "←" : "→"}
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
