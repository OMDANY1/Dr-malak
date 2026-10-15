import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCopy, siteConfig } from "@/lib/content";
import { getWhatsAppUrl } from "@/lib/links";
import { isValidLocale } from "@/lib/locales";
import { buildPageAlternates, toAbsoluteUrl } from "@/lib/seo";
import { Container } from "@/components/ui/Container";
import { ConsultationTriggerButton } from "@/components/interactive/ConsultationTriggerButton";
import { ConsultationJourney } from "@/components/sections/ConsultationJourney";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { Reveal } from "@/components/interactive/Reveal";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const copy = getCopy(locale);
  const alternates = buildPageAlternates(locale, "specialties");

  return {
    title: copy.specialtiesPage.meta.title,
    description: copy.specialtiesPage.meta.description,
    alternates,
    openGraph: {
      title: copy.specialtiesPage.meta.title,
      description: copy.specialtiesPage.meta.description,
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

export default async function SpecialtiesPage({ params }: PageProps) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const copy = getCopy(locale);
  const items = copy.specialtiesSection.items;

  return (
    <>
      {/* Editorial Header with Quick Jump Anchor Links */}
      <section
        className="page-hero specialties-page-hero"
        aria-labelledby="specialties-page-heading"
      >
        <Container>
          <div className="eyebrow-row">
            <span className="eyebrow-line" aria-hidden="true" />
            <span className="eyebrow-text">
              01 — {copy.specialtiesPage.eyebrow}
            </span>
          </div>
          <h1 id="specialties-page-heading" className="page-hero-title">
            {copy.specialtiesPage.title}
          </h1>
          <div className="section-Rule" aria-hidden="true" />
          <p className="page-hero-lead">{copy.specialtiesPage.lead}</p>

          <nav
            className="specialties-anchor-nav"
            aria-label={copy.specialtiesSection.tabsAriaLabel}
          >
            {items.map((item) => (
              <a
                key={item.id}
                href={`#chapter-${item.id}`}
                className="specialties-anchor-pill"
              >
                <span className="ltr-inline" dir="ltr">
                  {item.number}
                </span>
                <span>{item.title}</span>
              </a>
            ))}
          </nav>
        </Container>
      </section>

      {/* Three Visually Distinct Alternating Photographic Sections */}
      <div className="specialties-chapters-wrapper">
        {items.map((item, idx) => {
          const itemWhatsappUrl = getWhatsAppUrl(
            locale,
            item.whatsappEnquiryMessage
          );
          const isReversed = idx % 2 === 1;

          return (
            <section
              key={item.id}
              id={`chapter-${item.id}`}
              className={`specialty-chapter-section ${
                isReversed ? "is-reversed" : ""
              }`.trim()}
              aria-labelledby={`heading-${item.id}`}
            >
              <Container>
                <div className="specialty-chapter-grid">
                  <Reveal
                    variant="mask-reveal"
                    className="specialty-chapter-media"
                  >
                    <figure className="specialty-chapter-figure">
                      <div className="specialty-chapter-img-wrap">
                        <img
                          src={item.image}
                          alt={item.imageAlt}
                          width={896}
                          height={1152}
                          loading={idx === 0 ? "eager" : "lazy"}
                          decoding="async"
                          className="specialty-chapter-img"
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
                  </Reveal>

                  <Reveal
                    variant="fade-up"
                    delayMs={100}
                    className="specialty-chapter-copy"
                  >
                    <div className="specialty-panel-badge-row">
                      <span className="specialty-number" dir="ltr">
                        {item.number}
                      </span>
                      <span className="eyebrow-line" aria-hidden="true" />
                      <span className="eyebrow-text">
                        {copy.specialtiesSection.eyebrow}
                      </span>
                    </div>

                    <h2
                      id={`heading-${item.id}`}
                      className="specialty-chapter-title"
                    >
                      {item.title}
                    </h2>

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
                  </Reveal>
                </div>
              </Container>
            </section>
          );
        })}
      </div>

      {/* Deep-Red Consultation Journey */}
      <ConsultationJourney locale={locale} />

      {/* Warm-Ivory Clinical Assessment Principles (separating the two red sections) */}
      <section
        className="specialties-context-section"
        aria-labelledby="assessment-context-heading"
      >
        <Container>
          <div className="editorial-two-col">
            <div>
              <div className="eyebrow-row">
                <span className="eyebrow-line" aria-hidden="true" />
                <span className="eyebrow-text">
                  {copy.specialtiesPage.scopeNoteTitle}
                </span>
              </div>
              <h2 id="assessment-context-heading" className="section-title">
                {copy.specialtiesPage.consultationContextTitle}
              </h2>
              <p
                style={{
                  marginBlockStart: "1rem",
                  color: "var(--color-ink-muted)",
                  lineHeight: 1.85,
                }}
              >
                {copy.specialtiesPage.scopeNoteBody}
              </p>
            </div>

            <div className="editorial-prose">
              <ul className="editorial-bullet-list">
                {copy.specialtiesPage.consultationContextPoints.map((point) => (
                  <li key={point} className="editorial-bullet-item">
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </section>

      <ContactCTA locale={locale} />
    </>
  );
}
