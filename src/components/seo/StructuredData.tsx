import React from "react";
import { siteConfig } from "@/lib/content";
import { Locale } from "@/lib/locales";
import { toAbsoluteUrl } from "@/lib/seo";

interface StructuredDataProps {
  locale: Locale;
}

export function StructuredData({ locale }: StructuredDataProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Physician",
    name: siteConfig.name[locale],
    alternateName: locale === "ar" ? siteConfig.name.en : siteConfig.name.ar,
    description: siteConfig.subtitle[locale],
    url: toAbsoluteUrl(`/${locale}`),
    ...(siteConfig.doctorPortrait
      ? { image: toAbsoluteUrl(siteConfig.doctorPortrait) }
      : {}),
    telephone: siteConfig.contact.phone,
    sameAs: [siteConfig.contact.instagram],
    alumniOf: {
      "@type": "CollegeOrUniversity",
      name:
        locale === "ar"
          ? "جامعة الملك سعود بن عبدالعزيز للعلوم الصحية"
          : "King Saud bin Abdulaziz University for Health Sciences",
    },
    memberOf: {
      "@type": "Organization",
      name:
        locale === "ar"
          ? "الجمعية الأمريكية لجراحة التجميل والترميم"
          : "American Society of Plastic Surgeons",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
