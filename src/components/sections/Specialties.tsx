"use client";

import React, { useState, useRef } from "react";
import { getCopy } from "@/lib/content";
import { getWhatsAppUrl } from "@/lib/links";
import { Locale, localizePath } from "@/lib/locales";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ConsultationTriggerButton } from "@/components/interactive/ConsultationTriggerButton";
import { Reveal } from "@/components/interactive/Reveal";

interface SpecialtiesProps {
  locale: Locale;
  showExtendedDetail?: boolean;
  showPageLink?: boolean;
}

export function Specialties({
  locale,
  showPageLink = true,
}: SpecialtiesProps) {
  const copy = getCopy(locale);
  const items = copy.specialtiesSection.items;
  const specialtiesHref = localizePath(locale, "specialties");

  const [activeIndex, setActiveIndex] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const detailStageRef = useRef<HTMLDivElement | null>(null);

  const handleSelectPanel = (index: number) => {
    setActiveIndex(index);
  };

  const handleTabKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    const count = items.length;
    const isRtl = locale === "ar";
    let nextIndex: number | null = null;

    if (event.key === "ArrowDown") {
      nextIndex = (index + 1) % count;
    } else if (event.key === "ArrowUp") {
      nextIndex = (index - 1 + count) % count;
    } else if (event.key === "ArrowRight") {
      nextIndex = isRtl
        ? (index - 1 + count) % count
        : (index + 1) % count;
    } else if (event.key === "ArrowLeft") {
      nextIndex = isRtl
        ? (index + 1) % count
        : (index - 1 + count) % count;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = count - 1;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      setActiveIndex(nextIndex);
      tabRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <section
      id="specialties-section"
      className="specialties-section"
      aria-labelledby="specialties-heading"
    >
      <Container>
        <Reveal variant="fade-up">
          <div className="specialties-header-row">
            <SectionHeading
              id="specialties-heading"
              eyebrow={`03 — ${copy.specialtiesSection.eyebrow}`}
              title={copy.specialtiesSection.title}
              subtitle={copy.specialtiesSection.intro}
            />

            {showPageLink && (
              <div className="specialties-header-cta">
                <Button href={specialtiesHref} variant="secondary">
                  <span>{copy.specialtiesSection.viewAllCta}</span>
                  <span className="btn-arrow-glyph" aria-hidden="true">
                    {locale === "ar" ? "←" : "→"}
                  </span>
                </Button>
              </div>
            )}
          </div>
        </Reveal>

        {/* Interactive Split Visual Specialty Explorer (No Repeated 3-Card Row) */}
        <div className="specialty-explorer-split">
          {/* Column 1: Concise Interactive Architectural Index */}
          <Reveal variant="fade-up" delayMs={60} className="specialty-explorer-index-col">
            <div
              role="tablist"
              aria-label={copy.specialtiesSection.tabsAriaLabel}
              aria-orientation="vertical"
              className="specialty-explorer-tablist"
            >
              {items.map((item, idx) => {
                const isSelected = idx === activeIndex;
                return (
                  <button
                    key={item.id}
                    ref={(el) => {
                      tabRefs.current[idx] = el;
                    }}
                    id={`specialty-tab-${item.id}`}
                    role="tab"
                    type="button"
                    aria-label={item.tabLabel}
                    aria-selected={isSelected}
                    aria-controls={`specialty-panel-${item.id}`}
                    tabIndex={isSelected ? 0 : -1}
                    className={`specialty-index-tab ${
                      isSelected ? "is-active" : ""
                    }`.trim()}
                    onClick={() => handleSelectPanel(idx)}
                    onKeyDown={(e) => handleTabKeyDown(e, idx)}
                  >
                    <span
                      className="specialty-index-active-bar"
                      aria-hidden="true"
                    />
                    <div className="specialty-index-tab-header">
                      <span
                        className="specialty-index-num"
                        dir="ltr"
                        aria-hidden="true"
                      >
                        {item.number}
                      </span>
                      <span className="specialty-photo-card-title">
                        {item.title}
                      </span>
                      <span
                        className="specialty-photo-card-indicator"
                        aria-hidden="true"
                      >
                        {locale === "ar" ? "←" : "→"}
                      </span>
                    </div>
                    <span className="specialty-photo-card-summary">
                      {item.summary}
                    </span>
                  </button>
                );
              })}
            </div>
          </Reveal>

          {/* Column 2: Large Photographic Stage & Clinical Scope Panel */}
          <Reveal
            variant="fade-up"
            delayMs={120}
            className="specialty-explorer-stage-col"
          >
            <div
              ref={detailStageRef}
              className="specialty-expanded-stage-wrapper"
            >
              {items.map((item, idx) => {
                const isSelected = idx === activeIndex;
                const itemWhatsappUrl = getWhatsAppUrl(
                  locale,
                  item.whatsappEnquiryMessage
                );

                return (
                  <div
                    key={item.id}
                    id={`specialty-panel-${item.id}`}
                    role="tabpanel"
                    aria-labelledby={`specialty-tab-${item.id}`}
                    aria-hidden={!isSelected}
                    hidden={!isSelected}
                    inert={!isSelected ? true : undefined}
                    tabIndex={isSelected ? 0 : -1}
                    className={`specialty-stage-panel ${
                      isSelected ? "is-active" : "is-inactive"
                    }`.trim()}
                  >
                    <div className="specialty-expanded-showcase">
                      <figure className="specialty-expanded-figure">
                        <div className="specialty-expanded-img-wrap">
                          <img
                            src={item.image}
                            alt={item.imageAlt}
                            width={896}
                            height={1152}
                            loading="lazy"
                            decoding="async"
                            className="specialty-expanded-img"
                          />
                          <span
                            className="specialty-stage-photo-badge"
                            dir="ltr"
                            aria-hidden="true"
                          >
                            {item.number} / 0{items.length}
                          </span>
                        </div>
                        <figcaption className="specialty-visual-caption">
                          {item.visualCaption}
                        </figcaption>
                      </figure>

                      <div className="specialty-expanded-copy">
                        <div className="specialty-panel-badge-row">
                          <span className="specialty-number" dir="ltr">
                            {item.number}
                          </span>
                          <span className="eyebrow-line" aria-hidden="true" />
                          <span className="eyebrow-text">
                            {copy.specialtiesSection.eyebrow}
                          </span>
                        </div>

                        <h3 className="specialty-panel-title">{item.title}</h3>

                        <p className="specialty-summary">{item.summary}</p>
                        <p className="specialty-detail">{item.detail}</p>

                        <p className="specialty-assessment-note">
                          <span
                            className="eyebrow-line"
                            style={{ width: "1.25rem" }}
                            aria-hidden="true"
                          />
                          <span>{item.assessmentNote}</span>
                        </p>

                        <div className="specialty-panel-actions">
                          <ConsultationTriggerButton
                            label={item.ctaLabel}
                            topicId={item.id}
                            variant="primary"
                            fallbackHref={itemWhatsappUrl}
                          />
                          <a
                            href={itemWhatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="specialty-direct-wa-link editorial-underline-link"
                          >
                            <span>
                              {copy.specialtiesSection.directWhatsappCta}
                            </span>
                            <span className="btn-arrow-glyph" aria-hidden="true">
                              {locale === "ar" ? "↖" : "↗"}
                            </span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
