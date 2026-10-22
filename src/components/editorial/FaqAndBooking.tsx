"use client";

import React, { useMemo } from "react";
import { getCopy } from "@/lib/content";
import { getPhoneDisplay, getTelUrl, getWhatsAppUrl } from "@/lib/links";
import { Locale } from "@/lib/locales";
import { ConsultationTriggerButton } from "@/components/interactive/ConsultationTriggerButton";
import { Reveal } from "@/components/interactive/Reveal";
import { useCmsSnapshot } from "@/components/cms/CmsSnapshotContext";
import { resolveLocalizedText } from "@/lib/cms/sanitize";

interface FaqAndBookingProps {
  locale: Locale;
  includeFaq?: boolean;
  includeBooking?: boolean;
}

export function FaqAndBooking({
  locale,
  includeFaq = false,
  includeBooking = true,
}: FaqAndBookingProps) {
  const copy = getCopy(locale);
  const cms = useCmsSnapshot();

  const whatsappUrl = getWhatsAppUrl(
    locale,
    undefined,
    cms?.contactSettings.whatsappDigits
  );
  const telUrl = getTelUrl(cms?.contactSettings.phone);
  const phone = getPhoneDisplay(cms?.contactSettings.phone);

  const faqDoc = cms?.faq;
  const faqEyebrow = faqDoc
    ? resolveLocalizedText(faqDoc.eyebrow, locale, copy.faqSection.eyebrow)
    : copy.faqSection.eyebrow;
  const faqTitle = faqDoc
    ? resolveLocalizedText(faqDoc.title, locale, copy.faqSection.title)
    : copy.faqSection.title;
  const faqIntro = faqDoc
    ? resolveLocalizedText(faqDoc.intro, locale, copy.faqSection.intro)
    : copy.faqSection.intro;

  const faqItems = useMemo(() => {
    if (!faqDoc) {
      return copy.faqSection.items;
    }
    return [...faqDoc.items]
      .filter((item) => item.visible)
      .sort((a, b) => a.order - b.order)
      .map((item) => ({
        q: resolveLocalizedText(item.question, locale, ""),
        a: resolveLocalizedText(item.answer, locale, ""),
      }))
      .filter((item) => Boolean(item.q));
  }, [faqDoc, copy.faqSection.items, locale]);

  const bookingCta = cms?.contactSettings.bookingCta;
  const bookingEyebrow = bookingCta
    ? resolveLocalizedText(
        bookingCta.eyebrow,
        locale,
        copy.contactCta.eyebrow
      )
    : copy.contactCta.eyebrow;
  const bookingTitle = bookingCta
    ? resolveLocalizedText(bookingCta.title, locale, copy.contactCta.title)
    : copy.contactCta.title;
  const bookingBody = bookingCta
    ? resolveLocalizedText(bookingCta.body, locale, copy.contactCta.body)
    : copy.contactCta.body;
  const bookingPrimaryLabel = bookingCta
    ? resolveLocalizedText(
        bookingCta.primaryLabel,
        locale,
        copy.contactCta.primaryWhatsapp
      )
    : copy.contactCta.primaryWhatsapp;
  const bookingSecondaryCall = bookingCta
    ? resolveLocalizedText(
        bookingCta.secondaryCallLabel,
        locale,
        copy.contactCta.secondaryCall
      )
    : copy.contactCta.secondaryCall;

  return (
    <>
      {includeFaq && faqItems.length > 0 && (
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
                  <span className="ed-eyebrow-label">{faqEyebrow}</span>
                </div>

                <h2 id="faq-section-heading" className="ed-section-title">
                  {faqTitle}
                </h2>

                <p className="ed-compact-faq-intro">{faqIntro}</p>
              </div>

              <div className="ed-compact-faq-list">
                {faqItems.map((item, idx) => (
                  <details
                    key={`${item.q}-${idx}`}
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
      {includeBooking && (
        <section
          id="booking-section"
          className="ed-ivory-booking-section"
          aria-labelledby="ivory-booking-heading"
        >
          <div className="ed-container">
            <Reveal variant="fade-up" className="ed-ivory-booking-stage">
              <div className="ed-ivory-booking-eyebrow">
                <span className="ed-eyebrow-rule" aria-hidden="true" />
                <span className="ed-eyebrow-label">{bookingEyebrow}</span>
                <span className="ed-eyebrow-rule" aria-hidden="true" />
              </div>

              <h2 id="ivory-booking-heading" className="ed-ivory-booking-title">
                {bookingTitle}
              </h2>

              <p className="ed-ivory-booking-lead">{bookingBody}</p>

              <div className="ed-ivory-booking-actions">
                <ConsultationTriggerButton
                  label={bookingPrimaryLabel}
                  topicId="general"
                  variant="primary"
                  className="ed-ivory-booking-primary-btn"
                  fallbackHref={whatsappUrl}
                />

                <a href={telUrl} className="ed-ivory-booking-tel-link">
                  <span className="ed-tel-label">{bookingSecondaryCall}:</span>
                  <span className="ed-tel-num ltr-inline" dir="ltr">
                    {phone.formatted}
                  </span>
                </a>
              </div>
            </Reveal>
          </div>
        </section>
      )}
    </>
  );
}
