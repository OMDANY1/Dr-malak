import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCopy, siteConfig } from "@/lib/content";
import {
  getInstagramUrl,
  getPhoneDisplay,
  getTelUrl,
  getWhatsAppUrl,
} from "@/lib/links";
import { isValidLocale } from "@/lib/locales";
import { buildPageAlternates, toAbsoluteUrl } from "@/lib/seo";
import { ConsultationTriggerButton } from "@/components/interactive/ConsultationTriggerButton";
import { FaqAndBooking } from "@/components/editorial/FaqAndBooking";
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
  const alternates = buildPageAlternates(locale, "contact");

  return {
    title: copy.contactPage.meta.title,
    description: copy.contactPage.meta.description,
    alternates,
    openGraph: {
      title: copy.contactPage.meta.title,
      description: copy.contactPage.meta.description,
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

export default async function ContactPage({ params }: PageProps) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const copy = getCopy(locale);
  const whatsappUrl = getWhatsAppUrl(locale);
  const telUrl = getTelUrl();
  const phone = getPhoneDisplay();
  const instagramUrl = getInstagramUrl();

  return (
    <>
      {/* 1. Deep-Red Editorial Masthead */}
      <section
        className="ed-inner-red-masthead"
        aria-labelledby="contact-page-heading"
      >
        <div className="ed-container">
          <div className="ed-inner-masthead-content">
            <div className="ed-red-hero-label-row">
              <span className="ed-red-hero-rule" aria-hidden="true" />
              <span className="ed-red-hero-specialty-label">
                01 — {copy.contactPage.eyebrow}
              </span>
              <span className="ed-red-hero-rule" aria-hidden="true" />
            </div>

            <h1 id="contact-page-heading" className="ed-inner-masthead-title">
              {copy.contactPage.title}
            </h1>

            <p className="ed-inner-masthead-lead">{copy.contactPage.lead}</p>

            <div className="ed-red-hero-action-cluster">
              <ConsultationTriggerButton
                label={copy.contactPage.whatsappCard.action}
                topicId="general"
                variant="ivory"
                fallbackHref={whatsappUrl}
              />
              <a
                href={telUrl}
                className="ed-masthead-tel-pill ltr-inline"
                dir="ltr"
              >
                {phone.formatted}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Three-Column Architectural Coordination Channels Showcase */}
      <section
        className="ed-contact-channels-section"
        aria-labelledby="contact-channels-heading"
      >
        <div className="ed-container">
          <Reveal variant="fade-up" className="ed-contact-channels-header">
            <div className="ed-eyebrow-cluster">
              <span className="ed-index-num" dir="ltr">
                02
              </span>
              <span className="ed-eyebrow-rule" aria-hidden="true" />
              <span className="ed-eyebrow-label">
                {copy.contactPage.eyebrow}
              </span>
            </div>
            <h2 id="contact-channels-heading" className="ed-section-title">
              {copy.contactPage.channelsTitle}
            </h2>
          </Reveal>

          <div className="ed-contact-channels-grid">
            {/* Channel 01: WhatsApp Coordination */}
            <Reveal variant="fade-up" className="ed-contact-channel-card">
              <span className="ed-about-pillar-num" dir="ltr">
                01 · {copy.contactPage.whatsappCard.label}
              </span>
              <h3 className="ed-about-pillar-title">
                {copy.contactPage.whatsappCard.title}
              </h3>
              <p className="ed-about-pillar-body">
                {copy.contactPage.whatsappCard.description}
              </p>
              <div className="ed-contact-channel-action">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ed-inline-arrow-link"
                >
                  <span>{copy.contactCta.directWhatsappLinkLabel}</span>
                  <span aria-hidden="true">
                    {locale === "ar" ? "↖" : "↗"}
                  </span>
                </a>
              </div>
            </Reveal>

            {/* Channel 02: Coordination Phone */}
            <Reveal
              variant="fade-up"
              delayMs={90}
              className="ed-contact-channel-card"
            >
              <span className="ed-about-pillar-num" dir="ltr">
                02 · {copy.contactPage.phoneCard.label}
              </span>
              <h3 className="ed-about-pillar-title">
                {copy.contactPage.phoneCard.title}
              </h3>
              <p className="ed-about-pillar-body">
                {copy.contactPage.phoneCard.description}
              </p>
              <div className="ed-contact-channel-action">
                <a
                  href={telUrl}
                  className="ed-contact-phone-large ltr-inline"
                  dir="ltr"
                >
                  {phone.formatted}
                </a>
              </div>
            </Reveal>

            {/* Channel 03: Official Instagram */}
            <Reveal
              variant="fade-up"
              delayMs={180}
              className="ed-contact-channel-card"
            >
              <span className="ed-about-pillar-num" dir="ltr">
                03 · {copy.contactPage.instagramCard.label}
              </span>
              <h3 className="ed-about-pillar-title">
                {copy.contactPage.instagramCard.title}
              </h3>
              <p className="ed-about-pillar-body">
                {copy.contactPage.instagramCard.description}
              </p>
              <div className="ed-contact-channel-action">
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ed-inline-arrow-link ltr-inline"
                  dir="ltr"
                >
                  <span>@dralsaifma</span>
                  <span aria-hidden="true">↗</span>
                </a>
              </div>
            </Reveal>
          </div>

          {/* Pre-Contact Guidelines Ledger */}
          <Reveal variant="fade-up" className="ed-contact-guidelines-box">
            <div className="ed-eyebrow-cluster">
              <span className="ed-eyebrow-rule" aria-hidden="true" />
              <span className="ed-eyebrow-label">
                {copy.contactPage.importantNoticeTitle}
              </span>
            </div>
            <ol className="ed-context-points-list">
              {copy.contactPage.importantNotices.map((notice, idx) => (
                <li key={notice} className="ed-context-point-item">
                  <span className="ed-credential-num" dir="ltr">
                    0{idx + 1}
                  </span>
                  <p>{notice}</p>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

      {/* 3. Compact Accessible FAQ + Spacious Ivory Booking Section */}
      <FaqAndBooking locale={locale} includeFaq={true} />
    </>
  );
}
