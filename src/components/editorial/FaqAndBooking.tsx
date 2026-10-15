import React from "react";
import { getCopy } from "@/lib/content";
import { getPhoneDisplay, getTelUrl, getWhatsAppUrl } from "@/lib/links";
import { Locale } from "@/lib/locales";
import { ConsultationTriggerButton } from "@/components/interactive/ConsultationTriggerButton";
import { Reveal } from "@/components/interactive/Reveal";

interface FaqAndBookingProps {
  locale: Locale;
  includeFaq?: boolean;
}

export function FaqAndBooking({
  locale,
  includeFaq = false,
}: FaqAndBookingProps) {
  const copy = getCopy(locale);
  const whatsappUrl = getWhatsAppUrl(locale);
  const telUrl = getTelUrl();
  const phone = getPhoneDisplay();

  return (
    <>
      {includeFaq && (
        <section
          id="questions-and-contact"
          className="ed-compact-faq-section"
          aria-labelledby="faq-section-heading"
        >
          <div className="ed-container">
            <Reveal variant="fade-up" className="ed-compact-faq-layout">
              <div className="ed-compact-faq-header">
                <div className="ed-eyebrow-cluster">
                  <span className="ed-index-num" dir="ltr">
                    05
                  </span>
                  <span className="ed-eyebrow-rule" aria-hidden="true" />
                  <span className="ed-eyebrow-label">
                    {copy.faqSection.eyebrow}
                  </span>
                </div>

                <h2 id="faq-section-heading" className="ed-section-title">
                  {copy.faqSection.title}
                </h2>

                <p className="ed-compact-faq-intro">{copy.faqSection.intro}</p>
              </div>

              <div className="ed-compact-faq-list">
                {copy.faqSection.items.map((item, idx) => (
                  <details
                    key={item.q}
                    className="ed-faq-item"
                    open={idx === 0}
                  >
                    <summary className="ed-faq-summary faq-summary">
                      <span className="ed-faq-q-wrap">
                        <span className="ed-faq-num faq-num" dir="ltr">
                          0{idx + 1}
                        </span>
                        <span className="ed-faq-q-text">{item.q}</span>
                      </span>
                      <span className="ed-faq-toggle-glyph" aria-hidden="true">
                        +
                      </span>
                    </summary>
                    <div className="ed-faq-answer">
                      <p>{item.a}</p>
                    </div>
                  </details>
                ))}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* Spacious Ivory Booking Section featuring Large Typography, One Primary Consultation Action & Secondary Telephone Link */}
      <section
        id="booking-section"
        className="ed-ivory-booking-section"
        aria-labelledby="ivory-booking-heading"
      >
        <div className="ed-container">
          <Reveal variant="fade-up" className="ed-ivory-booking-stage">
            <div className="ed-ivory-booking-eyebrow">
              <span className="ed-eyebrow-rule" aria-hidden="true" />
              <span className="ed-eyebrow-label">
                {copy.contactCta.eyebrow}
              </span>
              <span className="ed-eyebrow-rule" aria-hidden="true" />
            </div>

            <h2 id="ivory-booking-heading" className="ed-ivory-booking-title">
              {copy.contactCta.title}
            </h2>

            <p className="ed-ivory-booking-lead">{copy.contactCta.body}</p>

            <div className="ed-ivory-booking-actions">
              <ConsultationTriggerButton
                label={copy.contactCta.primaryWhatsapp}
                topicId="general"
                variant="primary"
                className="ed-ivory-booking-primary-btn"
                fallbackHref={whatsappUrl}
              />

              <a href={telUrl} className="ed-ivory-booking-tel-link">
                <span className="ed-tel-label">
                  {copy.contactCta.secondaryCall}:
                </span>
                <span className="ed-tel-num ltr-inline" dir="ltr">
                  {phone.formatted}
                </span>
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
