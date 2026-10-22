import React from "react";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { getCopy } from "@/lib/content";
import { getWhatsAppUrl } from "@/lib/links";
import { isValidLocale, localizePath } from "@/lib/locales";
import { isDraftPreviewRequest } from "@/lib/cms/auth";
import { getPublicCmsSnapshot, resolveSlugRedirect } from "@/lib/cms/db";
import { resolveLocalizedText } from "@/lib/cms/sanitize";
import { ConsultationTriggerButton } from "@/components/interactive/ConsultationTriggerButton";
import { FaqAndBooking } from "@/components/editorial/FaqAndBooking";

interface SpecialtyDetailPageProps {
  params: Promise<{ locale: string; slug: string }>;
  searchParams?: Promise<{ preview?: string }>;
}

export default async function SpecialtyDetailRoute({
  params,
  searchParams,
}: SpecialtyDetailPageProps) {
  const { locale, slug } = await params;
  const sp = searchParams ? await searchParams : undefined;

  if (!isValidLocale(locale)) {
    notFound();
  }

  // Handle automatic redirects for renamed specialty slugs
  const redirectTarget = resolveSlugRedirect("specialty", slug);
  if (redirectTarget && redirectTarget !== slug) {
    permanentRedirect(localizePath(locale, `specialties/${redirectTarget}`));
  }

  const previewDrafts = await isDraftPreviewRequest(sp?.preview);
  const cms = getPublicCmsSnapshot({ previewDrafts });
  const matched = cms.specialties.find((s) => s.slug === slug);

  if (!matched) {
    notFound();
  }

  const copy = getCopy(locale);
  const c = matched.content;
  const title = resolveLocalizedText(c.title, locale, matched.slug);
  const summary = resolveLocalizedText(c.introduction, locale, "");
  const detail = resolveLocalizedText(c.fullContent, locale, "");
  const assessmentNote = resolveLocalizedText(c.assessmentNote, locale, "");
  const visualCaption = resolveLocalizedText(c.visualCaption, locale, "");
  const imageAlt = resolveLocalizedText(c.imageAlt, locale, title);
  const ctaLabel = resolveLocalizedText(c.ctaLabel, locale, copy.hero.primary);
  const whatsappMsg = resolveLocalizedText(c.whatsappMessage, locale, "");
  const itemWhatsappUrl = getWhatsAppUrl(
    locale,
    whatsappMsg,
    cms.contactSettings.whatsappDigits
  );

  return (
    <>
      <section
        className="ed-inner-red-masthead"
        aria-labelledby="specialty-detail-heading"
      >
        <div className="ed-container">
          <div className="ed-inner-masthead-content">
            <div className="ed-red-hero-label-row">
              <span className="ed-red-hero-rule" aria-hidden="true" />
              <span className="ed-red-hero-specialty-label">
                {c.numberLabel} — {copy.specialtiesSection.eyebrow}
              </span>
              <span className="ed-red-hero-rule" aria-hidden="true" />
            </div>

            <h1
              id="specialty-detail-heading"
              className="ed-inner-masthead-title"
            >
              {title}
            </h1>

            <p className="ed-inner-masthead-lead">{summary}</p>
          </div>
        </div>
      </section>

      <section className="ed-specialty-chapter" aria-label={title}>
        <div className="ed-container">
          <div className="ed-specialty-chapter-grid">
            <div className="ed-specialty-chapter-media">
              <figure className="ed-specialty-chapter-figure">
                <div className="ed-specialty-chapter-img-frame">
                  <img
                    src={c.coverImage}
                    alt={imageAlt}
                    width={896}
                    height={1152}
                    loading="eager"
                    decoding="async"
                    className="ed-specialty-chapter-img"
                    style={{
                      objectPosition: `${c.focalPoint?.x ?? 50}% ${
                        c.focalPoint?.y ?? 50
                      }%`,
                    }}
                  />
                </div>
                <figcaption className="ed-specialty-sheet-caption">
                  {visualCaption}
                </figcaption>
              </figure>
            </div>

            <div className="ed-specialty-chapter-copy">
              <h2 className="ed-specialty-chapter-title">{title}</h2>
              <p className="ed-specialty-sheet-summary">{summary}</p>
              <p className="ed-specialty-sheet-detail">{detail}</p>

              <div className="ed-specialty-sheet-note">
                <span className="ed-eyebrow-rule" aria-hidden="true" />
                <p>{assessmentNote}</p>
              </div>

              <div className="ed-specialty-sheet-actions">
                <ConsultationTriggerButton
                  label={ctaLabel}
                  topicId={matched.slug}
                  variant="primary"
                  fallbackHref={itemWhatsappUrl}
                />

                <Link
                  href={localizePath(locale, "specialties")}
                  className="btn btn-secondary"
                >
                  <span>{copy.specialtiesSection.viewAllCta}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <FaqAndBooking locale={locale} includeFaq={false} />
    </>
  );
}
