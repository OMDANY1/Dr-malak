import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCopy, siteConfig } from "@/lib/content";
import { isValidLocale } from "@/lib/locales";
import { buildPageAlternates, toAbsoluteUrl } from "@/lib/seo";
import { Container } from "@/components/ui/Container";
import { ContactCTA } from "@/components/sections/ContactCTA";
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

  return (
    <>
      <StructuredData locale={locale} />

      {/* 1. Portrait-Led Editorial Monograph Opening */}
      <section
        className="about-editorial-opening"
        aria-labelledby="about-page-heading"
      >
        <Container>
          <div className="about-opening-grid">
            {portraitSrc && (
              <Reveal variant="mask-reveal" className="about-portrait-col">
                <figure className="about-portrait-figure">
                  <div className="doctor-editorial-mat">
                    <span
                      className="doctor-architectural-corner"
                      aria-hidden="true"
                    />
                    <div className="about-portrait-crop-wrap">
                      <img
                        src={portraitSrc}
                        alt={copy.aboutPage.portraitAlt}
                        width={1080}
                        height={1080}
                        loading="eager"
                        decoding="async"
                        className="about-portrait-img"
                      />
                    </div>
                  </div>
                  <figcaption className="about-portrait-caption">
                    <span className="doctor-caption-index" dir="ltr">
                      01
                    </span>
                    <span className="eyebrow-line" aria-hidden="true" />
                    <span>{copy.aboutPage.portraitCaption}</span>
                  </figcaption>
                </figure>
              </Reveal>
            )}

            <Reveal
              variant="fade-up"
              delayMs={100}
              className="about-biography-col"
            >
              <div className="eyebrow-row">
                <span className="eyebrow-line" aria-hidden="true" />
                <span className="eyebrow-text">
                  01 — {copy.aboutPage.eyebrow}
                </span>
              </div>

              <h1 id="about-page-heading" className="page-hero-title">
                {copy.aboutPage.title}
              </h1>

              <p className="page-hero-lead">{copy.aboutPage.lead}</p>

              <div className="section-Rule" aria-hidden="true" />

              <h2 className="about-bio-subheading">
                {copy.aboutPage.biographyTitle}
              </h2>

              <div className="editorial-prose">
                {copy.aboutPage.biographyParagraphs.map((paragraph, index) => (
                  <p key={index} className="about-bio-paragraph">
                    {paragraph}
                  </p>
                ))}
              </div>

              <p className="about-editorial-notice">
                {copy.aboutPage.editorialNotice}
              </p>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* 2. Open Editorial Credentials & Care Philosophy Spread */}
      <section
        className="about-open-spread-section"
        aria-labelledby="credentials-spread-heading"
      >
        <Container>
          <div className="about-open-spread-grid">
            {/* Confirmed Academic & Clinical Credentials */}
            <Reveal variant="fade-up" className="about-open-col">
              <div className="eyebrow-row">
                <span className="eyebrow-line" aria-hidden="true" />
                <span className="eyebrow-text">
                  02 — {copy.credentialsSection.eyebrow}
                </span>
              </div>

              <h2 id="credentials-spread-heading" className="section-title">
                {copy.credentialsSection.title}
              </h2>

              <ol className="doctor-open-credentials">
                {copy.credentialsSection.items.map((item, idx) => (
                  <li
                    key={item.label}
                    className="doctor-open-credential-point"
                  >
                    <span className="doctor-point-num" dir="ltr">
                      0{idx + 1}
                    </span>
                    <div className="doctor-point-body">
                      <span className="doctor-point-label">{item.label}</span>
                      <p className="doctor-point-text">{item.text}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <p className="credentials-footnote">
                {copy.credentialsSection.note}
              </p>
            </Reveal>

            {/* Care Approach & Principles (Open Horizontal Rows) */}
            <Reveal
              variant="fade-up"
              delayMs={120}
              className="about-open-col"
            >
              <div className="eyebrow-row">
                <span className="eyebrow-line" aria-hidden="true" />
                <span className="eyebrow-text">
                  03 — {copy.aboutPage.approachEyebrow}
                </span>
              </div>

              <h2 className="section-title">{copy.aboutPage.approachTitle}</h2>

              <div className="about-open-pillars-list">
                {copy.aboutPage.approachPillars.map((pillar, idx) => (
                  <article key={pillar.title} className="about-open-pillar-row">
                    <div className="about-open-pillar-header">
                      <span className="doctor-point-num" dir="ltr">
                        0{idx + 1}
                      </span>
                      <h3 className="about-open-pillar-title">
                        {pillar.title}
                      </h3>
                    </div>
                    <p className="about-open-pillar-body">{pillar.body}</p>
                  </article>
                ))}
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      <ContactCTA locale={locale} />
    </>
  );
}
