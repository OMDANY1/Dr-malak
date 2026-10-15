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
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { ConsultationTriggerButton } from "@/components/interactive/ConsultationTriggerButton";
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
      <section
        className="contact-unified-page-section"
        aria-labelledby="contact-page-heading"
      >
        <Container>
          <div className="contact-unified-grid">
            {/* Column 1: Direct Consultation Action & Open Channels Directory */}
            <Reveal variant="fade-up" className="contact-unified-main-col">
              <div className="eyebrow-row">
                <span className="eyebrow-line" aria-hidden="true" />
                <span className="eyebrow-text">
                  01 — {copy.contactPage.eyebrow}
                </span>
              </div>

              <h1 id="contact-page-heading" className="page-hero-title">
                {copy.contactPage.title}
              </h1>

              <div className="section-Rule" aria-hidden="true" />

              <p className="page-hero-lead">{copy.contactPage.lead}</p>

              <div className="contact-cta-buttons">
                <ConsultationTriggerButton
                  label={copy.contactPage.whatsappCard.action}
                  topicId="general"
                  variant="primary"
                  fallbackHref={whatsappUrl}
                />
                <Button href={telUrl} variant="secondary" external>
                  <span>{copy.contactPage.phoneCard.action}</span>
                  <span>&nbsp;</span>
                  <span className="ltr-inline" dir="ltr">
                    ({phone.raw})
                  </span>
                </Button>
              </div>

              <p className="contact-concise-clarification">
                {copy.hero.coordinationNote}
              </p>

              {/* Open Editorial Contact Directory */}
              <div
                className="contact-open-directory"
                aria-label={copy.contactPage.channelsTitle}
              >
                <article className="contact-directory-row">
                  <div className="contact-directory-meta">
                    <span className="contact-channel-label">
                      01 · {copy.contactPage.whatsappCard.label}
                    </span>
                    <h2 className="contact-directory-title">
                      {copy.contactPage.whatsappCard.title}
                    </h2>
                    <p className="contact-directory-desc">
                      {copy.contactPage.whatsappCard.description}
                    </p>
                  </div>
                  <div className="contact-directory-action">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="editorial-underline-link"
                    >
                      <span>{copy.contactCta.directWhatsappLinkLabel}</span>
                      <span aria-hidden="true">
                        {locale === "ar" ? "↖" : "↗"}
                      </span>
                    </a>
                  </div>
                </article>

                <article className="contact-directory-row">
                  <div className="contact-directory-meta">
                    <span className="contact-channel-label">
                      02 · {copy.contactPage.phoneCard.label}
                    </span>
                    <h2 className="contact-directory-title">
                      {copy.contactPage.phoneCard.title}
                    </h2>
                    <p className="contact-directory-desc">
                      {copy.contactPage.phoneCard.description}
                    </p>
                  </div>
                  <div className="contact-directory-action">
                    <a
                      href={telUrl}
                      className="contact-phone-display ltr-inline"
                      dir="ltr"
                    >
                      {phone.raw}
                    </a>
                  </div>
                </article>

                <article className="contact-directory-row">
                  <div className="contact-directory-meta">
                    <span className="contact-channel-label">
                      03 · {copy.contactPage.instagramCard.label}
                    </span>
                    <h2 className="contact-directory-title">
                      {copy.contactPage.instagramCard.title}
                    </h2>
                    <p className="contact-directory-desc">
                      {copy.contactPage.instagramCard.description}
                    </p>
                  </div>
                  <div className="contact-directory-action">
                    <a
                      href={instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="instagram-editorial-link editorial-underline-link"
                    >
                      <span className="ltr-inline" dir="ltr">
                        @dralsaifma
                      </span>
                      <span aria-hidden="true">
                        {locale === "ar" ? "↖" : "↗"}
                      </span>
                    </a>
                  </div>
                </article>
              </div>
            </Reveal>

            {/* Column 2: Coordination Guidelines & Administrative FAQ */}
            <Reveal
              variant="fade-up"
              delayMs={120}
              className="contact-unified-faq-col"
            >
              <div className="contact-guidelines-ledger">
                <div className="eyebrow-row">
                  <span className="eyebrow-line" aria-hidden="true" />
                  <span className="eyebrow-text">
                    02 — {copy.contactPage.importantNoticeTitle}
                  </span>
                </div>
                <ul className="editorial-bullet-list">
                  {copy.contactPage.importantNotices.map((notice) => (
                    <li key={notice} className="editorial-bullet-item">
                      {notice}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="eyebrow-row" style={{ marginBlockStart: "2.5rem" }}>
                <span className="eyebrow-line" aria-hidden="true" />
                <span className="eyebrow-text">
                  03 — {copy.faqSection.eyebrow}
                </span>
              </div>

              <h2 className="section-title">{copy.faqSection.title}</h2>
              <p className="questions-col-intro">{copy.faqSection.intro}</p>

              <div className="faq-list">
                {copy.faqSection.items.map((item, index) => (
                  <details
                    key={item.q}
                    className="faq-item"
                    open={index === 0}
                  >
                    <summary className="faq-summary">
                      <span className="faq-summary-text">
                        <span className="faq-num ltr-inline" dir="ltr">
                          0{index + 1}
                        </span>
                        <span>{item.q}</span>
                      </span>
                      <svg
                        className="faq-icon"
                        viewBox="0 0 20 20"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M10 3V17M3 10H17"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="square"
                        />
                      </svg>
                    </summary>
                    <div className="faq-answer">
                      <p>{item.a}</p>
                    </div>
                  </details>
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
