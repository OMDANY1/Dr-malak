import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCopy } from "@/lib/content";
import { isValidLocale } from "@/lib/locales";
import {
  buildPageAlternates,
  buildSocialMetadata,
  DEFAULT_SOCIAL_IMAGE_PATH,
} from "@/lib/seo";
import { TypographicRedHero } from "@/components/editorial/TypographicRedHero";
import { SpecialtyGallery } from "@/components/editorial/SpecialtyGallery";
import { DoctorEditorialSpread } from "@/components/editorial/DoctorEditorialSpread";
import { InteractiveConsultationSteps } from "@/components/editorial/InteractiveConsultationSteps";
import { EditorialJournal } from "@/components/editorial/EditorialJournal";
import { FaqAndBooking } from "@/components/editorial/FaqAndBooking";
import { StructuredData } from "@/components/seo/StructuredData";
import { isDraftPreviewRequest } from "@/lib/cms/auth";
import { getPublicCmsSnapshot } from "@/lib/cms/db";
import { resolveLocalizedText } from "@/lib/cms/sanitize";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ preview?: string }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const sp = searchParams ? await searchParams : undefined;
  if (!isValidLocale(locale)) return {};
  const copy = getCopy(locale);
  const previewDrafts = await isDraftPreviewRequest(sp?.preview);
  const cms = getPublicCmsSnapshot({ previewDrafts });
  const alternates = buildPageAlternates(locale, "");

  const seoTitle = resolveLocalizedText(
    cms.contactSettings.globalSeo.defaultTitle,
    locale,
    copy.homeMeta.title
  );
  const seoDesc = resolveLocalizedText(
    cms.contactSettings.globalSeo.defaultDescription,
    locale,
    copy.homeMeta.description
  );
  const socialImg =
    cms.contactSettings.globalSeo.socialImage || DEFAULT_SOCIAL_IMAGE_PATH;

  return {
    title: seoTitle,
    description: seoDesc,
    ...(previewDrafts
      ? { robots: { index: false, follow: false } }
      : {}),
    alternates,
    ...buildSocialMetadata({
      locale,
      title: seoTitle,
      description: seoDesc,
      url: alternates.canonical,
      type: "website",
      imagePath: socialImg,
    }),
  };
}

export default async function HomePage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = searchParams ? await searchParams : undefined;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const previewDrafts = await isDraftPreviewRequest(sp?.preview);
  const cms = getPublicCmsSnapshot({ previewDrafts });

  const orderedVisibleSections = [...cms.homepage.sections]
    .filter((s) => s.visible)
    .sort((a, b) => a.order - b.order);

  return (
    <>
      <StructuredData locale={locale} />
      {/* 1. Typographic Red Hero with Inset Panoramic Photograph */}
      <TypographicRedHero locale={locale} />

      {/* 2..N. Supported Homepage Sections Rendered in Editor-Configured Order & Visibility */}
      {orderedVisibleSections.map((sec) => {
        if (sec.id === "specialties") {
          return <SpecialtyGallery key={sec.id} locale={locale} />;
        }
        if (sec.id === "doctor") {
          return <DoctorEditorialSpread key={sec.id} locale={locale} />;
        }
        if (sec.id === "steps") {
          return <InteractiveConsultationSteps key={sec.id} locale={locale} />;
        }
        if (sec.id === "journal") {
          return <EditorialJournal key={sec.id} locale={locale} />;
        }
        if (sec.id === "faq") {
          return (
            <FaqAndBooking
              key={sec.id}
              locale={locale}
              includeFaq={true}
              includeBooking={false}
            />
          );
        }
        if (sec.id === "booking") {
          return (
            <FaqAndBooking
              key={sec.id}
              locale={locale}
              includeFaq={false}
              includeBooking={true}
            />
          );
        }
        return null;
      })}
    </>
  );
}
