import React from "react";
import { getCopy } from "@/lib/content";
import {
  getInstagramUrl,
  getPhoneDisplay,
  getTelUrl,
  getWhatsAppUrl,
} from "@/lib/links";
import { Locale } from "@/lib/locales";
import { Container } from "@/components/ui/Container";
import { ConsultationTriggerButton } from "@/components/interactive/ConsultationTriggerButton";
import { Reveal } from "@/components/interactive/Reveal";

interface ContactCTAProps {
  locale: Locale;
  includeFaq?: boolean;
}

export function ContactCTA({ locale, includeFaq = false }: ContactCTAProps) {
  const copy = getCopy(locale);
  const whatsappUrl = getWhatsAppUrl(locale);
  const telUrl = getTelUrl();
  const phone = getPhoneDisplay();
  const instagramUrl = getInstagramUrl();

  return (
    <>
      {includeFaq && (
        <section
          id="questions-and-contact"
          className="faq-editorial-section"
          aria-labelledby="questions-contact-heading"
        >
          <Container>
            <div className="faq-editorial-grid">
              <Reveal variant="fade-up" className="faq-header-col">
                <div className="eyebrow-row">
                  <span className="eyebrow-line" aria-hidden="true" />
                  <span className="eyebrow-text">
                    06 — {copy.faqSection.eyebrow}
                  </span>
                </div>

                <h2 id="questions-contact-heading" className="section-title">
                  {copy.faqSection.title}
                </h2>

                <p className="questions-col-intro">{copy.faqSection.intro}</p>
              </Reveal>

              <Reveal
                variant="fade-up"
                delayMs={90}
                className="faq-accordion-col"
              >
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
      )}

      {/* Distinctive Deep-Red Consultation Closing Section */}
      <section
        className="closing-red-statement-section"
        aria-labelledby="contact-cta-heading"
      >
        <div className="closing-red-architectural-lines" aria-hidden="true" />
        <Container>
          <Reveal variant="fade-up">
            <div className="closing-red-grid">
              <div className="closing-red-main-col">
                <div className="eyebrow-row closing-red-eyebrow">
                  <span className="eyebrow-line" aria-hidden="true" />
                  <span className="eyebrow-text">
                    {includeFaq
                      ? `07 — ${copy.contactCta.eyebrow}`
                      : copy.contactCta.eyebrow}
                  </span>
                </div>

                <h2 id="contact-cta-heading" className="closing-red-title">
                  {copy.contactCta.title}
                </h2>

                <p className="closing-red-body">{copy.contactCta.body}</p>

                <div className="closing-red-primary-action">
                  <ConsultationTriggerButton
                    label={copy.contactCta.primaryWhatsapp}
                    topicId="general"
                    variant="ivory"
                    fallbackHref={whatsappUrl}
                  />
                </div>
              </div>

              <div className="closing-red-channels-col">
                <div className="closing-red-channel-block">
                  <span className="closing-red-channel-label">
                    {copy.contactCta.phoneLabel}
                  </span>
                  <a
                    href={telUrl}
                    className="closing-red-phone ltr-inline"
                    dir="ltr"
                  >
                    {phone.raw}
                  </a>
                </div>

                <div className="closing-red-channel-block">
                  <span className="closing-red-channel-label">
                    {copy.contactCta.instagramLink}
                  </span>
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="closing-red-ig-link"
                  >
                    <span className="ltr-inline" dir="ltr">
                      @dralsaifma
                    </span>
                    <span aria-hidden="true">
                      {locale === "ar" ? "↖" : "↗"}
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
