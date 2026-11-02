import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCopy, siteConfig } from "@/lib/content";
import { getWhatsAppUrl } from "@/lib/links";
import { isValidLocale } from "@/lib/locales";
import {
  buildPageAlternates,
  buildSocialMetadata,
  DEFAULT_SOCIAL_IMAGE_PATH,
} from "@/lib/seo";
import { ConsultationTriggerButton } from "@/components/interactive/ConsultationTriggerButton";
import { InteractiveConsultationSteps } from "@/components/editorial/InteractiveConsultationSteps";
import { FaqAndBooking } from "@/components/editorial/FaqAndBooking";
import { Reveal } from "@/components/interactive/Reveal";
import { isDraftPreviewRequest } from "@/lib/cms/auth";
import { getPublicCmsSnapshot } from "@/lib/cms/db";
import { resolveLocalizedText } from "@/lib/cms/sanitize";

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
  const alternates = buildPageAlternates(locale, "specialties");

  return {
    title: copy.specialtiesPage.meta.title,
    description: copy.specialtiesPage.meta.description,
    ...(previewDrafts
      ? { robots: { index: false, follow: false } }
      : {}),
    alternates,
    ...buildSocialMetadata({
      locale,
      title: copy.specialtiesPage.meta.title,
      description: copy.specialtiesPage.meta.description,
      url: alternates.canonical,
      type: "website",
      imagePath: DEFAULT_SOCIAL_IMAGE_PATH,
    }),
  };
}

export default async function SpecialtiesPage({
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

  const items = cms.specialties.map((spec, idx) => {
    const c = spec.content;
    return {
      id: spec.slug,
      number: c.numberLabel || String(idx + 1).padStart(2, "0"),
      title: resolveLocalizedText(c.title, locale, spec.slug),
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
      ctaLabel: resolveLocalizedText(c.ctaLabel, locale, copy.hero.primary),
    };
  });

  return (
    <>
      {/* 1. Deep-Red Editorial Masthead with Chapter Index Bar */}
      <section
        className="ed-inner-red-masthead"
        aria-labelledby="specialties-page-heading"
      >
        <div className="ed-container">
          <div className="ed-inner-masthead-content">
            <div className="ed-red-hero-label-row">
              <span className="ed-red-hero-rule" aria-hidden="true" />
              <span className="ed-red-hero-specialty-label">
                01 — {copy.specialtiesPage.eyebrow}
              </span>
              <span className="ed-red-hero-rule" aria-hidden="true" />
            </div>

            <h1
              id="specialties-page-heading"
              className="ed-inner-masthead-title"
            >
              {copy.specialtiesPage.title}
            </h1>

            <p className="ed-inner-masthead-lead">
              {copy.specialtiesPage.lead}
            </p>

            <nav
              className="ed-masthead-anchor-bar"
              aria-label={copy.specialtiesSection.tabsAriaLabel}
            >
              {items.map((item) => (
                <a
                  key={item.id}
                  href={`#chapter-${item.id}`}
                  className="ed-masthead-anchor-pill"
                >
                  <span className="ltr-inline" dir="ltr">
                    {item.number}
                  </span>
                  <span>{item.title}</span>
                </a>
              ))}
            </nav>
          </div>
        </div>
      </section>

      {/* 2. Alternating Editorial Monograph Chapters */}
      <div className="ed-specialties-chapters">
        {items.map((item, idx) => {
          const itemWhatsappUrl = getWhatsAppUrl(
            locale,
            item.whatsappEnquiryMessage,
            cms.contactSettings.whatsappDigits
          );
          const isReversed = idx % 2 === 1;

          return (
            <section
              key={item.id}
              id={`chapter-${item.id}`}
              className={`ed-specialty-chapter ${
                isReversed ? "is-reversed" : ""
              }`.trim()}
              aria-labelledby={`heading-${item.id}`}
            >
              <div className="ed-container">
                <div className="ed-specialty-chapter-grid">
                  <Reveal
                    variant="mask-reveal"
                    className="ed-specialty-chapter-media"
                  >
                    <figure className="ed-specialty-chapter-figure">
                      <div className="ed-specialty-chapter-img-frame">
                        <img
                          src={item.image}
                          alt={item.imageAlt}
                          width={idx === 0 ? 896 : 1024}
                          height={idx === 0 ? 1152 : 768}
                          loading={idx === 0 ? "eager" : "lazy"}
                          decoding="async"
                          className="ed-specialty-chapter-img"
                          style={{
                            objectPosition: `${item.focalPoint.x}% ${item.focalPoint.y}%`,
                          }}
                        />
                        <span
                          className="ed-gallery-index-tag"
                          dir="ltr"
                          aria-hidden="true"
                        >
                          {item.number} / 0{items.length}
                        </span>
                      </div>
                      <figcaption className="ed-specialty-sheet-caption">
                        {item.visualCaption}
                      </figcaption>
                    </figure>
                  </Reveal>

                  <Reveal
                    variant="fade-up"
                    delayMs={100}
                    className="ed-specialty-chapter-copy"
                  >
                    <div className="ed-eyebrow-cluster">
                      <span className="ed-index-num" dir="ltr">
                        {item.number}
                      </span>
                      <span className="ed-eyebrow-rule" aria-hidden="true" />
                      <span className="ed-eyebrow-label">
                        {copy.specialtiesSection.eyebrow}
                      </span>
                    </div>

                    <h2
                      id={`heading-${item.id}`}
                      className="ed-specialty-chapter-title"
                    >
                      {item.title}
                    </h2>

                    <p className="ed-specialty-sheet-summary">{item.summary}</p>
                    <p className="ed-specialty-sheet-detail">{item.detail}</p>

                    <div className="ed-specialty-sheet-note">
                      <span className="ed-eyebrow-rule" aria-hidden="true" />
                      <p>{item.assessmentNote}</p>
                    </div>

                    <div className="ed-specialty-sheet-actions">
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
                        className="ed-inline-arrow-link"
                      >
                        <span>
                          {copy.specialtiesSection.directWhatsappCta}
                        </span>
                        <span aria-hidden="true">
                          {locale === "ar" ? "↖" : "↗"}
                        </span>
                      </a>
                    </div>
                  </Reveal>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* 3. Clinical Assessment Context Spread */}
      <section
        className="ed-specialties-context-section"
        aria-labelledby="assessment-context-heading"
      >
        <div className="ed-container">
          <div className="ed-context-spread-grid">
            <div>
              <div className="ed-eyebrow-cluster">
                <span className="ed-eyebrow-rule" aria-hidden="true" />
                <span className="ed-eyebrow-label">
                  {copy.specialtiesPage.scopeNoteTitle}
                </span>
              </div>
              <h2 id="assessment-context-heading" className="ed-section-title">
                {copy.specialtiesPage.consultationContextTitle}
              </h2>
              <p className="ed-context-scope-body">
                {copy.specialtiesPage.scopeNoteBody}
              </p>
            </div>

            <ol className="ed-context-points-list">
              {copy.specialtiesPage.consultationContextPoints.map(
                (point, idx) => (
                  <li key={point} className="ed-context-point-item">
                    <span className="ed-credential-num" dir="ltr">
                      0{idx + 1}
                    </span>
                    <p>{point}</p>
                  </li>
                )
              )}
            </ol>
          </div>
        </div>
      </section>

      {/* 4. Contained Interactive Consultation Steps Module */}
      <InteractiveConsultationSteps locale={locale} />

      {/* 5. Spacious Ivory Booking Section */}
      <FaqAndBooking locale={locale} includeFaq={false} />
    </>
  );
}
