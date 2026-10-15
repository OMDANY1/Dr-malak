import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCopy } from "@/lib/content";
import { isValidLocale } from "@/lib/locales";
import { buildPageAlternates } from "@/lib/seo";
import { FaqAndBooking } from "@/components/editorial/FaqAndBooking";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const copy = getCopy(locale);
  const alternates = buildPageAlternates(locale, "privacy");

  return {
    title: copy.privacyPage.meta.title,
    description: copy.privacyPage.meta.description,
    alternates,
  };
}

export default async function PrivacyPage({ params }: PageProps) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const copy = getCopy(locale);

  return (
    <>
      <section
        className="ed-inner-red-masthead"
        aria-labelledby="privacy-page-heading"
      >
        <div className="ed-container">
          <div className="ed-inner-masthead-content">
            <div className="ed-red-hero-label-row">
              <span className="ed-red-hero-rule" aria-hidden="true" />
              <span className="ed-red-hero-specialty-label">
                01 — {copy.privacyPage.eyebrow}
              </span>
              <span className="ed-red-hero-rule" aria-hidden="true" />
            </div>

            <h1 id="privacy-page-heading" className="ed-inner-masthead-title">
              {copy.privacyPage.title}
            </h1>

            <p className="ed-inner-masthead-lead">{copy.privacyPage.lead}</p>
          </div>
        </div>
      </section>

      <section
        className="ed-privacy-ledger-section"
        aria-label={copy.privacyPage.title}
      >
        <div className="ed-container">
          <div className="ed-privacy-grid">
            {copy.privacyPage.sections.map((sec, idx) => (
              <article key={sec.heading} className="ed-privacy-card">
                <span className="ed-about-pillar-num" dir="ltr">
                  0{idx + 1}
                </span>
                <h2 className="ed-about-pillar-title">{sec.heading}</h2>
                <p className="ed-about-pillar-body">{sec.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <FaqAndBooking locale={locale} includeFaq={false} />
    </>
  );
}
