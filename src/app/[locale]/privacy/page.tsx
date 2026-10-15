import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCopy } from "@/lib/content";
import { isValidLocale } from "@/lib/locales";
import { buildPageAlternates } from "@/lib/seo";
import { Container } from "@/components/ui/Container";
import { ContactCTA } from "@/components/sections/ContactCTA";

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
      <section className="page-hero" aria-labelledby="privacy-page-heading">
        <Container>
          <div className="eyebrow-row">
            <span className="eyebrow-line" aria-hidden="true" />
            <span className="eyebrow-text">
              01 — {copy.privacyPage.eyebrow}
            </span>
          </div>
          <h1 id="privacy-page-heading" className="page-hero-title">
            {copy.privacyPage.title}
          </h1>
          <div className="section-Rule" aria-hidden="true" />
          <p className="page-hero-lead">{copy.privacyPage.lead}</p>
        </Container>
      </section>

      <section className="page-section" aria-label={copy.privacyPage.title}>
        <Container>
          <div className="privacy-sections">
            {copy.privacyPage.sections.map((sec) => (
              <article key={sec.heading} className="privacy-block">
                <h2 className="privacy-heading">{sec.heading}</h2>
                <p style={{ fontSize: "1.0625rem", lineHeight: 1.85 }}>
                  {sec.body}
                </p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <ContactCTA locale={locale} />
    </>
  );
}
