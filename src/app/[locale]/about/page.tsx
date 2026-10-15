import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCopy, siteConfig } from "@/lib/content";
import { getInstagramUrl, getWhatsAppUrl } from "@/lib/links";
import { isValidLocale } from "@/lib/locales";
import { buildPageAlternates, toAbsoluteUrl } from "@/lib/seo";
import { ConsultationTriggerButton } from "@/components/interactive/ConsultationTriggerButton";
import { FaqAndBooking } from "@/components/editorial/FaqAndBooking";
import { StructuredData } from "@/components/seo/StructuredData";
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
  const alternates = buildPageAlternates(locale, "about");

  return {
    title: copy.aboutPage.meta.title,
    description: copy.aboutPage.meta.description,
    alternates,
    openGraph: {
      title: copy.aboutPage.meta.title,
      description: copy.aboutPage.meta.description,
      url: alternates.canonical,
      locale: locale === "ar" ? "ar_SA" : "en_US",
      type: "profile",
      ...(siteConfig.doctorPortrait
        ? {
            images: [
              {
                url: toAbsoluteUrl(siteConfig.doctorPortrait),
                alt: copy.aboutPage.portraitAlt,
              },
            ],
          }
        : {}),
    },
  };
}

export default async function AboutPage({ params }: PageProps) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const copy = getCopy(locale);
  const portraitSrc = siteConfig.doctorPortrait;
  const whatsappUrl = getWhatsAppUrl(locale);
  const instagramUrl = getInstagramUrl();

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

            <p className="ed-inner-masthead-lead">{copy.aboutPage.lead}</p>
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
                {copy.aboutPage.biographyTitle}
              </h2>

              <div className="ed-doctor-rule" aria-hidden="true" />

              <div className="ed-about-prose-stack">
                {copy.aboutPage.biographyParagraphs.map((paragraph, index) => (
                  <p key={index} className="ed-doctor-spread-bio">
                    {paragraph}
                  </p>
                ))}
              </div>

              <p className="ed-doctor-credentials-note">
                {copy.aboutPage.editorialNotice}
              </p>

              <div className="ed-doctor-social-row">
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ed-inline-arrow-link"
                >
                  <span>{copy.aboutPreview.instagramLabel}</span>
                  <span className="ltr-inline" dir="ltr">
                    (@dralsaifma)
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
                      alt={copy.aboutPage.portraitAlt}
                      width={1080}
                      height={1080}
                      loading="eager"
                      decoding="async"
                      className="ed-doctor-central-img"
                    />
                  </div>
                  <figcaption className="ed-doctor-central-caption">
                    <span>{copy.aboutPage.portraitCaption}</span>
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
                <span className="ed-eyebrow-label">
                  {copy.credentialsSection.eyebrow}
                </span>
              </div>

              <h2 className="ed-doctor-credentials-heading">
                {copy.aboutPage.credentialsTitle}
              </h2>

              <ol className="ed-doctor-credentials-list">
                {copy.credentialsSection.items.map((item, idx) => (
                  <li key={item.label} className="ed-doctor-credential-item">
                    <span className="ed-credential-num" dir="ltr">
                      0{idx + 1}
                    </span>
                    <div className="ed-credential-content">
                      <span className="ed-credential-label">{item.label}</span>
                      <p className="ed-credential-text">{item.text}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <p className="ed-doctor-credentials-note">
                {copy.aboutPage.credentialsSubtitle}
              </p>

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
              <span className="ed-eyebrow-label">
                {copy.aboutPage.approachEyebrow}
              </span>
            </div>

            <h2 id="about-philosophy-heading" className="ed-section-title">
              {copy.aboutPage.approachTitle}
            </h2>
          </Reveal>

          <div className="ed-about-pillars-grid">
            {copy.aboutPage.approachPillars.map((pillar, idx) => (
              <Reveal
                key={pillar.title}
                variant="fade-up"
                delayMs={idx * 90}
                className="ed-about-pillar-card"
              >
                <span className="ed-about-pillar-num" dir="ltr">
                  0{idx + 1}
                </span>
                <h3 className="ed-about-pillar-title">{pillar.title}</h3>
                <p className="ed-about-pillar-body">{pillar.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <FaqAndBooking locale={locale} includeFaq={false} />
    </>
  );
}
