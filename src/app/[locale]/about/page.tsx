import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCopy, siteConfig } from "@/lib/content";
import { getInstagramUrl, getWhatsAppUrl } from "@/lib/links";
import { isValidLocale } from "@/lib/locales";
import {
  buildPageAlternates,
  buildSocialMetadata,
  DEFAULT_SOCIAL_IMAGE_PATH,
} from "@/lib/seo";
import { ConsultationTriggerButton } from "@/components/interactive/ConsultationTriggerButton";
import { FaqAndBooking } from "@/components/editorial/FaqAndBooking";
import { StructuredData } from "@/components/seo/StructuredData";
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
  const cms = getPublicCmsSnapshot({ previewDrafts });
  const dp = cms.doctorProfile;
  const alternates = buildPageAlternates(locale, "about");

  const metaTitle = resolveLocalizedText(
    dp.seo.title,
    locale,
    copy.aboutPage.meta.title
  );
  const metaDesc = resolveLocalizedText(
    dp.seo.description,
    locale,
    copy.aboutPage.meta.description
  );
  const socialImg =
    cms.contactSettings.globalSeo.socialImage || DEFAULT_SOCIAL_IMAGE_PATH;

  return {
    title: metaTitle,
    description: metaDesc,
    ...(previewDrafts
      ? { robots: { index: false, follow: false } }
      : {}),
    alternates,
    ...buildSocialMetadata({
      locale,
      title: metaTitle,
      description: metaDesc,
      url: alternates.canonical,
      type: "profile",
      imagePath: socialImg,
    }),
  };
}

export default async function AboutPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = searchParams ? await searchParams : undefined;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const copy = getCopy(locale);
  const previewDrafts = await isDraftPreviewRequest(sp?.preview);
  const cms = getPublicCmsSnapshot({ previewDrafts });
  const dp = cms.doctorProfile;

  const portraitSrc = dp.portraitImage || siteConfig.doctorPortrait;
  const portraitAlt = resolveLocalizedText(
    dp.portraitAlt,
    locale,
    copy.aboutPage.portraitAlt
  );
  const portraitCaption = resolveLocalizedText(
    dp.portraitCaption,
    locale,
    copy.aboutPage.portraitCaption
  );
  const portraitFocal = dp.portraitFocalPoint || { x: 50, y: 28 };
  const shortLead = resolveLocalizedText(
    dp.shortBio,
    locale,
    copy.aboutPage.lead
  );
  const bioHeading = resolveLocalizedText(
    dp.biographyHeading,
    locale,
    copy.aboutPage.biographyTitle
  );
  const bioParagraphs =
    dp.biographyParagraphs[locale] && dp.biographyParagraphs[locale].length > 0
      ? dp.biographyParagraphs[locale]
      : copy.aboutPage.biographyParagraphs;
  const editorialNotice = resolveLocalizedText(
    dp.editorialNotice,
    locale,
    copy.aboutPage.editorialNotice
  );
  const credsEyebrow = resolveLocalizedText(
    dp.credentialsEyebrow,
    locale,
    copy.credentialsSection.eyebrow
  );
  const credsHeading = resolveLocalizedText(
    dp.credentialsHeading,
    locale,
    copy.aboutPage.credentialsTitle
  );
  const credsSubtitle = resolveLocalizedText(
    dp.credentialsNote,
    locale,
    copy.aboutPage.credentialsSubtitle
  );
  const approachEyebrow = resolveLocalizedText(
    dp.approachEyebrow,
    locale,
    copy.aboutPage.approachEyebrow
  );
  const approachTitle = resolveLocalizedText(
    dp.approachTitle,
    locale,
    copy.aboutPage.approachTitle
  );

  const whatsappUrl = getWhatsAppUrl(
    locale,
    undefined,
    cms.contactSettings.whatsappDigits
  );
  const instagramUrl = getInstagramUrl(cms.contactSettings.instagramUrl);
  const instagramHandle = cms.contactSettings.instagramHandle || "@dralsaifma";

  return (
    <>
      <StructuredData locale={locale} />

      {/* 1. Deep-Red Editorial Masthead */}
      <section
        className="ed-inner-red-masthead"
        aria-labelledby="about-page-heading"
      >
        <div className="ed-container">
          <div className="ed-inner-masthead-content">
            <div className="ed-red-hero-label-row">
              <span className="ed-red-hero-rule" aria-hidden="true" />
              <span className="ed-red-hero-specialty-label">
                01 — {copy.aboutPage.eyebrow}
              </span>
              <span className="ed-red-hero-rule" aria-hidden="true" />
            </div>

            <h1 id="about-page-heading" className="ed-inner-masthead-title">
              {copy.aboutPage.title}
            </h1>

            <p className="ed-inner-masthead-lead">{shortLead}</p>
          </div>
        </div>
      </section>

      {/* 2. Three-Part Editorial Monograph Spread (Biography + Central Real Portrait + Verified Credentials) */}
      <section
        className="ed-about-monograph-section"
        aria-labelledby="about-bio-heading"
      >
        <div className="ed-container">
          <div className="ed-doctor-spread-grid">
            {/* Part 1: Extended Biography */}
            <Reveal variant="fade-up" className="ed-doctor-spread-intro">
              <div className="ed-eyebrow-cluster">
                <span className="ed-index-num" dir="ltr">
                  01
                </span>
                <span className="ed-eyebrow-rule" aria-hidden="true" />
                <span className="ed-eyebrow-label">
                  {copy.aboutPage.eyebrow}
                </span>
              </div>

              <h2 id="about-bio-heading" className="ed-doctor-spread-name">
                {bioHeading}
              </h2>

              <div className="ed-doctor-rule" aria-hidden="true" />

              <div className="ed-about-prose-stack">
                {bioParagraphs.map((paragraph, index) => (
                  <p key={index} className="ed-doctor-spread-bio">
                    {paragraph}
                  </p>
                ))}
              </div>

              <p className="ed-doctor-credentials-note">{editorialNotice}</p>

              <div className="ed-doctor-social-row">
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ed-inline-arrow-link"
                >
                  <span>{copy.aboutPreview.instagramLabel}</span>
                  <span className="ltr-inline" dir="ltr">
                    ({instagramHandle})
                  </span>
                  <span aria-hidden="true">{locale === "ar" ? "↖" : "↗"}</span>
                </a>
              </div>
            </Reveal>

            {/* Part 2: Large Central Unframed Real Doctor Portrait */}
            {portraitSrc && (
              <Reveal
                variant="mask-reveal"
                delayMs={80}
                className="ed-doctor-spread-portrait"
              >
                <figure className="ed-doctor-central-figure">
                  <div className="ed-doctor-central-img-wrap">
                    <img
                      src={portraitSrc}
                      alt={portraitAlt}
                      width={1080}
                      height={1080}
                      loading="eager"
                      decoding="async"
                      className="ed-doctor-central-img"
                      style={{
                        objectPosition: `${portraitFocal.x}% ${portraitFocal.y}%`,
                      }}
                    />
                  </div>
                  <figcaption className="ed-doctor-central-caption">
                    <span>{portraitCaption}</span>
                  </figcaption>
                </figure>
              </Reveal>
            )}

            {/* Part 3: Verified Academic & Clinical Qualifications */}
            <Reveal
              variant="fade-up"
              delayMs={140}
              className="ed-doctor-spread-credentials"
            >
              <div className="ed-eyebrow-cluster">
                <span className="ed-index-num" dir="ltr">
                  02
                </span>
                <span className="ed-eyebrow-rule" aria-hidden="true" />
                <span className="ed-eyebrow-label">{credsEyebrow}</span>
              </div>

              <h2 className="ed-doctor-credentials-heading">{credsHeading}</h2>

              <ol className="ed-doctor-credentials-list">
                {dp.credentials.map((item, idx) => (
                  <li key={item.id} className="ed-doctor-credential-item">
                    <span className="ed-credential-num" dir="ltr">
                      0{idx + 1}
                    </span>
                    <div className="ed-credential-content">
                      <span className="ed-credential-label">
                        {resolveLocalizedText(item.label, locale, "")}
                      </span>
                      <p className="ed-credential-text">
                        {resolveLocalizedText(item.text, locale, "")}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>

              <p className="ed-doctor-credentials-note">{credsSubtitle}</p>

              <div className="ed-doctor-profile-action">
                <ConsultationTriggerButton
                  label={copy.hero.primary}
                  topicId="general"
                  variant="primary"
                  fallbackHref={whatsappUrl}
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 3. Consultation Philosophy & Principles (3-Column Editorial Ledger) */}
      <section
        className="ed-about-pillars-section"
        aria-labelledby="about-philosophy-heading"
      >
        <div className="ed-container">
          <Reveal variant="fade-up" className="ed-about-pillars-header">
            <div className="ed-eyebrow-cluster">
              <span className="ed-index-num" dir="ltr">
                03
              </span>
              <span className="ed-eyebrow-rule" aria-hidden="true" />
              <span className="ed-eyebrow-label">{approachEyebrow}</span>
            </div>

            <h2 id="about-philosophy-heading" className="ed-section-title">
              {approachTitle}
            </h2>
          </Reveal>

          <div className="ed-about-pillars-grid">
            {dp.approachPillars.map((pillar, idx) => (
              <Reveal
                key={pillar.id}
                variant="fade-up"
                delayMs={idx * 90}
                className="ed-about-pillar-card"
              >
                <span className="ed-about-pillar-num" dir="ltr">
                  0{idx + 1}
                </span>
                <h3 className="ed-about-pillar-title">
                  {resolveLocalizedText(pillar.title, locale, "")}
                </h3>
                <p className="ed-about-pillar-body">
                  {resolveLocalizedText(pillar.body, locale, "")}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <FaqAndBooking locale={locale} includeFaq={false} />
    </>
  );
}
