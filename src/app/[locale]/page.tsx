import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCopy, siteConfig } from "@/lib/content";
import { isValidLocale } from "@/lib/locales";
import { buildPageAlternates, toAbsoluteUrl } from "@/lib/seo";
import { Hero } from "@/components/sections/Hero";
import { AboutPreview } from "@/components/sections/AboutPreview";
import { Specialties } from "@/components/sections/Specialties";
import { ConsultationJourney } from "@/components/sections/ConsultationJourney";
import { ArticlesPreview } from "@/components/sections/ArticlesPreview";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { StructuredData } from "@/components/seo/StructuredData";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const copy = getCopy(locale);
  const alternates = buildPageAlternates(locale, "");

  return {
    title: copy.homeMeta.title,
    description: copy.homeMeta.description,
    alternates,
    openGraph: {
      title: copy.homeMeta.title,
      description: copy.homeMeta.description,
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

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  return (
    <>
      <StructuredData locale={locale} />
      {/* 1. Immersive Photographic Hero */}
      <Hero locale={locale} />
      {/* 2. Meet Dr. Malak */}
      <AboutPreview locale={locale} />
      {/* 3. Explore the Areas of Practice */}
      <Specialties
        locale={locale}
        showExtendedDetail={false}
        showPageLink={true}
      />
      {/* 4. Your Consultation Journey */}
      <ConsultationJourney locale={locale} />
      {/* 5. Articles and Patient Education */}
      <ArticlesPreview locale={locale} />
      {/* 6. Questions and Contact */}
      <ContactCTA locale={locale} includeFaq={true} />
    </>
  );
}
