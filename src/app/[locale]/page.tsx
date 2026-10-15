import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCopy, siteConfig } from "@/lib/content";
import { isValidLocale } from "@/lib/locales";
import { buildPageAlternates, toAbsoluteUrl } from "@/lib/seo";
import { TypographicRedHero } from "@/components/editorial/TypographicRedHero";
import { SpecialtyGallery } from "@/components/editorial/SpecialtyGallery";
import { DoctorEditorialSpread } from "@/components/editorial/DoctorEditorialSpread";
import { InteractiveConsultationSteps } from "@/components/editorial/InteractiveConsultationSteps";
import { EditorialJournal } from "@/components/editorial/EditorialJournal";
import { FaqAndBooking } from "@/components/editorial/FaqAndBooking";
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
      {/* 1. Typographic Red Hero with Inset Panoramic Photograph */}
      <TypographicRedHero locale={locale} />
      {/* 2. Asymmetric Visual Specialty Gallery + Accessible Detail Panel */}
      <SpecialtyGallery locale={locale} />
      {/* 3. Doctor Profile as a Three-Part Editorial Spread */}
      <DoctorEditorialSpread locale={locale} />
      {/* 4. Contained Interactive Consultation Steps Module */}
      <InteractiveConsultationSteps locale={locale} />
      {/* 5. Distinct Editorial Journal Layout */}
      <EditorialJournal locale={locale} />
      {/* 6. Compact Accessible FAQ + Spacious Ivory Booking Section */}
      <FaqAndBooking locale={locale} includeFaq={true} />
    </>
  );
}
