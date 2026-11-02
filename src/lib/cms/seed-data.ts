import { getCopy, siteConfig } from "@/lib/content";
import arPrepArticle from "../../../content/articles/ar/preparing-for-consultation.json";
import enPrepArticle from "../../../content/articles/en/preparing-for-consultation.json";
import arDraftArticle from "../../../content/articles/ar/questions-to-discuss.json";
import enDraftArticle from "../../../content/articles/en/questions-to-discuss.json";
import type {
  CmsArticleContent,
  CmsArticleRecord,
  CmsContactSettingsDocument,
  CmsFaqDocument,
  CmsMediaAsset,
  CmsSpecialtyRecord,
  DoctorProfileDocument,
  HomepageDocument,
  RichTextBlock,
} from "./types";

const arCopy = getCopy("ar");
const enCopy = getCopy("en");

function legacyBodyToRichBlocks(
  sections: Array<{
    id: string;
    heading: string;
    paragraphs: string[];
    listItems?: string[];
  }>
): RichTextBlock[] {
  const blocks: RichTextBlock[] = [];
  for (const section of sections) {
    blocks.push({
      id: section.id,
      type: "heading",
      headingLevel: 2,
      text: section.heading,
    });
    section.paragraphs.forEach((p, idx) => {
      blocks.push({
        id: `${section.id}-p-${idx + 1}`,
        type: "paragraph",
        text: p,
      });
    });
    if (section.listItems && section.listItems.length > 0) {
      blocks.push({
        id: `${section.id}-list`,
        type: "bullet-list",
        items: [...section.listItems],
      });
    }
  }
  return blocks;
}

export function buildSeedHomepageDocument(): HomepageDocument {
  return {
    hero: {
      eyebrow: {
        ar: arCopy.hero.eyebrow,
        en: enCopy.hero.eyebrow,
      },
      subtitle: {
        ar: arCopy.hero.subtitle,
        en: enCopy.hero.subtitle,
      },
      title: {
        ar: arCopy.hero.title,
        en: enCopy.hero.title,
      },
      description: {
        ar: arCopy.hero.body,
        en: enCopy.hero.body,
      },
      image: "/images/generated/hero-panoramic-editorial.jpg",
      imageAlt: {
        ar: "صورة بانورامية تحريرية هادئة تعكس العناية الطبية والجمال الطبيعي المتوازن",
        en: "Panoramic editorial photograph reflecting balanced natural beauty and attentive medical care",
      },
      focalPoint: { x: 50, y: 40 },
      caption: {
        ar: arCopy.hero.portraitCaption,
        en: enCopy.hero.portraitCaption,
      },
      editorialNote: {
        ar: arCopy.hero.editorialNote,
        en: enCopy.hero.editorialNote,
      },
      coordinationNote: {
        ar: arCopy.hero.coordinationNote,
        en: enCopy.hero.coordinationNote,
      },
      primaryCtaLabel: {
        ar: arCopy.hero.primary,
        en: enCopy.hero.primary,
      },
      primaryCtaDestination: "#consultation-dialog",
      secondaryCtaLabel: {
        ar: arCopy.hero.secondary,
        en: enCopy.hero.secondary,
      },
      secondaryCtaDestination: "/specialties",
    },
    sections: [
      {
        id: "specialties",
        visible: true,
        order: 1,
        eyebrow: {
          ar: arCopy.specialtiesSection.eyebrow,
          en: enCopy.specialtiesSection.eyebrow,
        },
        title: {
          ar: arCopy.specialtiesSection.title,
          en: enCopy.specialtiesSection.title,
        },
        supportingText: {
          ar: arCopy.specialtiesSection.intro,
          en: enCopy.specialtiesSection.intro,
        },
      },
      {
        id: "doctor",
        visible: true,
        order: 2,
        eyebrow: {
          ar: arCopy.aboutPreview.eyebrow,
          en: enCopy.aboutPreview.eyebrow,
        },
        title: {
          ar: arCopy.aboutPreview.title,
          en: enCopy.aboutPreview.title,
        },
        supportingText: {
          ar: arCopy.aboutPreview.body,
          en: enCopy.aboutPreview.body,
        },
      },
      {
        id: "steps",
        visible: true,
        order: 3,
        eyebrow: {
          ar: arCopy.journeySection.eyebrow,
          en: enCopy.journeySection.eyebrow,
        },
        title: {
          ar: arCopy.journeySection.title,
          en: enCopy.journeySection.title,
        },
        supportingText: {
          ar: arCopy.journeySection.subtitle,
          en: enCopy.journeySection.subtitle,
        },
      },
      {
        id: "journal",
        visible: true,
        order: 4,
        eyebrow: {
          ar: arCopy.articlesPreviewSection.eyebrow,
          en: enCopy.articlesPreviewSection.eyebrow,
        },
        title: {
          ar: arCopy.articlesPreviewSection.title,
          en: enCopy.articlesPreviewSection.title,
        },
        supportingText: {
          ar: arCopy.articlesPreviewSection.subtitle,
          en: enCopy.articlesPreviewSection.subtitle,
        },
      },
      {
        id: "faq",
        visible: true,
        order: 5,
        eyebrow: {
          ar: arCopy.faqSection.eyebrow,
          en: enCopy.faqSection.eyebrow,
        },
        title: {
          ar: arCopy.faqSection.title,
          en: enCopy.faqSection.title,
        },
        supportingText: {
          ar: arCopy.faqSection.intro,
          en: enCopy.faqSection.intro,
        },
      },
      {
        id: "booking",
        visible: true,
        order: 6,
        eyebrow: {
          ar: arCopy.contactCta.eyebrow,
          en: enCopy.contactCta.eyebrow,
        },
        title: {
          ar: arCopy.contactCta.title,
          en: enCopy.contactCta.title,
        },
        supportingText: {
          ar: arCopy.contactCta.body,
          en: enCopy.contactCta.body,
        },
      },
    ],
  };
}

export function buildSeedDoctorProfileDocument(): DoctorProfileDocument {
  return {
    fullName: {
      ar: siteConfig.name.ar,
      en: siteConfig.name.en,
    },
    specialtyTitle: {
      ar: siteConfig.subtitle.ar,
      en: siteConfig.subtitle.en,
    },
    portraitImage: siteConfig.doctorPortrait || "/images/doctor/dr-malak-alsaif.jpg",
    portraitAlt: {
      ar: arCopy.aboutPage.portraitAlt,
      en: enCopy.aboutPage.portraitAlt,
    },
    portraitCaption: {
      ar: arCopy.aboutPage.portraitCaption,
      en: enCopy.aboutPage.portraitCaption,
    },
    portraitFocalPoint: { x: 50, y: 28 },
    shortBio: {
      ar: arCopy.aboutPreview.body,
      en: enCopy.aboutPreview.body,
    },
    biographyHeading: {
      ar: arCopy.aboutPage.biographyTitle,
      en: enCopy.aboutPage.biographyTitle,
    },
    biographyParagraphs: {
      ar: [...arCopy.aboutPage.biographyParagraphs],
      en: [...enCopy.aboutPage.biographyParagraphs],
    },
    editorialNotice: {
      ar: arCopy.aboutPage.editorialNotice,
      en: enCopy.aboutPage.editorialNotice,
    },
    credentialsEyebrow: {
      ar: arCopy.credentialsSection.eyebrow,
      en: enCopy.credentialsSection.eyebrow,
    },
    credentialsHeading: {
      ar: arCopy.aboutPage.credentialsTitle,
      en: enCopy.aboutPage.credentialsTitle,
    },
    credentialsNote: {
      ar: arCopy.credentialsSection.note,
      en: enCopy.credentialsSection.note,
    },
    credentials: arCopy.credentialsSection.items.map((arItem, idx) => {
      const enItem = enCopy.credentialsSection.items[idx] || arItem;
      return {
        id: `cred-${idx + 1}`,
        label: {
          ar: arItem.label,
          en: enItem.label,
        },
        text: {
          ar: arItem.text,
          en: enItem.text,
        },
      };
    }),
    approachEyebrow: {
      ar: arCopy.aboutPage.approachEyebrow,
      en: enCopy.aboutPage.approachEyebrow,
    },
    approachTitle: {
      ar: arCopy.aboutPage.approachTitle,
      en: enCopy.aboutPage.approachTitle,
    },
    approachPillars: arCopy.aboutPage.approachPillars.map((arPillar, idx) => {
      const enPillar = enCopy.aboutPage.approachPillars[idx] || arPillar;
      return {
        id: `pillar-${idx + 1}`,
        title: {
          ar: arPillar.title,
          en: enPillar.title,
        },
        body: {
          ar: arPillar.body,
          en: enPillar.body,
        },
      };
    }),
    seo: {
      title: {
        ar: arCopy.aboutPage.meta.title,
        en: enCopy.aboutPage.meta.title,
      },
      description: {
        ar: arCopy.aboutPage.meta.description,
        en: enCopy.aboutPage.meta.description,
      },
    },
  };
}

export function buildSeedSpecialties(): CmsSpecialtyRecord[] {
  const nowIso = "2026-10-15T12:00:00.000Z";
  return arCopy.specialtiesSection.items.map((arItem, idx) => {
    const enItem = enCopy.specialtiesSection.items[idx] || arItem;
    const content = {
      slug: arItem.id,
      numberLabel: arItem.number,
      title: {
        ar: arItem.title,
        en: enItem.title,
      },
      introduction: {
        ar: arItem.summary,
        en: enItem.summary,
      },
      fullContent: {
        ar: arItem.detail,
        en: enItem.detail,
      },
      assessmentNote: {
        ar: arItem.assessmentNote,
        en: enItem.assessmentNote,
      },
      visualCaption: {
        ar: arItem.visualCaption,
        en: enItem.visualCaption,
      },
      coverImage: arItem.image,
      imageAlt: {
        ar: arItem.imageAlt,
        en: enItem.imageAlt,
      },
      focalPoint: { x: 50, y: 50 },
      ctaLabel: {
        ar: arItem.ctaLabel,
        en: enItem.ctaLabel,
      },
      whatsappMessage: {
        ar: arItem.whatsappEnquiryMessage,
        en: enItem.whatsappEnquiryMessage,
      },
    };

    return {
      id: arItem.id,
      slug: arItem.id,
      displayOrder: idx + 1,
      status: "published",
      draft: content,
      published: JSON.parse(JSON.stringify(content)),
      publishedAt: nowIso,
      updatedAt: nowIso,
    };
  });
}

export function buildSeedArticles(): CmsArticleRecord[] {
  const nowIso = "2026-10-15T12:00:00.000Z";

  const prepContent: CmsArticleContent = {
    slug: arPrepArticle.slug,
    category: arPrepArticle.category,
    coverImage: arPrepArticle.coverImage,
    coverFocalPoint: { x: 50, y: 50 },
    socialImage: arPrepArticle.coverImage,
    publishedAt: arPrepArticle.publishedAt,
    updatedAt: arPrepArticle.updatedAt,
    locales: {
      ar: {
        title: arPrepArticle.title,
        excerpt: arPrepArticle.description,
        coverAlt: arPrepArticle.coverAlt,
        authorName: arPrepArticle.authorName || "",
        reviewedBy: arPrepArticle.reviewedBy || "",
        seoTitle: `${arPrepArticle.title} | ${siteConfig.name.ar}`,
        seoDescription: arPrepArticle.description,
        blocks: legacyBodyToRichBlocks(arPrepArticle.body),
      },
      en: {
        title: enPrepArticle.title,
        excerpt: enPrepArticle.description,
        coverAlt: enPrepArticle.coverAlt,
        authorName: enPrepArticle.authorName || "",
        reviewedBy: enPrepArticle.reviewedBy || "",
        seoTitle: `${enPrepArticle.title} | ${siteConfig.name.en}`,
        seoDescription: enPrepArticle.description,
        blocks: legacyBodyToRichBlocks(enPrepArticle.body),
      },
    },
  };

  // Unreviewed draft article ("questions-to-discuss") MUST remain status="draft" and published=null
  const draftContent: CmsArticleContent = {
    slug: arDraftArticle.slug,
    category: arDraftArticle.category,
    coverImage: arDraftArticle.coverImage,
    coverFocalPoint: { x: 50, y: 50 },
    socialImage: arDraftArticle.coverImage,
    publishedAt: null,
    updatedAt: null,
    locales: {
      ar: {
        title: arDraftArticle.title,
        excerpt: arDraftArticle.description,
        coverAlt: arDraftArticle.coverAlt,
        authorName: arDraftArticle.authorName || "",
        reviewedBy: arDraftArticle.reviewedBy || "",
        seoTitle: `${arDraftArticle.title} | ${siteConfig.name.ar}`,
        seoDescription: arDraftArticle.description,
        blocks: legacyBodyToRichBlocks(arDraftArticle.body),
      },
      en: {
        title: enDraftArticle.title,
        excerpt: enDraftArticle.description,
        coverAlt: enDraftArticle.coverAlt,
        authorName: enDraftArticle.authorName || "",
        reviewedBy: enDraftArticle.reviewedBy || "",
        seoTitle: `${enDraftArticle.title} | ${siteConfig.name.en}`,
        seoDescription: enDraftArticle.description,
        blocks: legacyBodyToRichBlocks(enDraftArticle.body),
      },
    },
  };

  return [
    {
      id: "article-preparing-for-consultation",
      slug: arPrepArticle.slug,
      translationKey: arPrepArticle.translationKey,
      category: arPrepArticle.category,
      status: "published",
      draft: prepContent,
      published: JSON.parse(JSON.stringify(prepContent)),
      publishedAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: "article-questions-to-discuss",
      slug: arDraftArticle.slug,
      translationKey: arDraftArticle.translationKey,
      category: arDraftArticle.category,
      status: "draft",
      draft: draftContent,
      published: null,
      publishedAt: null,
      updatedAt: nowIso,
    },
  ];
}

export function buildSeedFaqDocument(): CmsFaqDocument {
  return {
    eyebrow: {
      ar: arCopy.faqSection.eyebrow,
      en: enCopy.faqSection.eyebrow,
    },
    title: {
      ar: arCopy.faqSection.title,
      en: enCopy.faqSection.title,
    },
    intro: {
      ar: arCopy.faqSection.intro,
      en: enCopy.faqSection.intro,
    },
    items: arCopy.faqSection.items.map((arItem, idx) => {
      const enItem = enCopy.faqSection.items[idx] || arItem;
      return {
        id: `faq-${idx + 1}`,
        order: idx + 1,
        visible: true,
        question: {
          ar: arItem.q,
          en: enItem.q,
        },
        answer: {
          ar: arItem.a,
          en: enItem.a,
        },
      };
    }),
  };
}

export function buildSeedContactSettingsDocument(): CmsContactSettingsDocument {
  return {
    siteName: {
      ar: siteConfig.name.ar,
      en: siteConfig.name.en,
    },
    siteSubtitle: {
      ar: siteConfig.subtitle.ar,
      en: siteConfig.subtitle.en,
    },
    brandLogoLight: "/brand/malak-logo-light-bg.svg",
    brandLogoDark: "/brand/malak-logo-dark-bg.svg",
    phone: siteConfig.contact.phone,
    whatsappDigits: siteConfig.contact.whatsappDigits,
    defaultWhatsappMessage: {
      ar: "مرحبًا، أرغب في الاستفسار عن حجز استشارة مع د. ملاك السيف.",
      en: "Hello, I would like to enquire about booking a consultation with Dr. Malak Alsaif.",
    },
    instagramUrl: siteConfig.contact.instagram,
    instagramHandle: "@dralsaifma",
    address: {
      ar: "",
      en: "",
    },
    workingHours: {
      ar: "",
      en: "",
    },
    mapUrl: "",
    bookingCta: {
      eyebrow: {
        ar: arCopy.contactCta.eyebrow,
        en: enCopy.contactCta.eyebrow,
      },
      title: {
        ar: arCopy.contactCta.title,
        en: enCopy.contactCta.title,
      },
      body: {
        ar: arCopy.contactCta.body,
        en: enCopy.contactCta.body,
      },
      primaryLabel: {
        ar: arCopy.contactCta.primaryWhatsapp,
        en: enCopy.contactCta.primaryWhatsapp,
      },
      secondaryCallLabel: {
        ar: arCopy.contactCta.secondaryCall,
        en: enCopy.contactCta.secondaryCall,
      },
    },
    globalSeo: {
      defaultTitle: {
        ar: arCopy.homeMeta.title,
        en: enCopy.homeMeta.title,
      },
      defaultDescription: {
        ar: arCopy.homeMeta.description,
        en: enCopy.homeMeta.description,
      },
      socialImage:
        siteConfig.defaultSocialImage || "/brand/og-default-1200x630.png",
    },
  };
}

export function buildSeedMediaAssets(): CmsMediaAsset[] {
  const nowIso = "2026-10-15T12:00:00.000Z";
  return [
    {
      id: "media-og-default-social",
      filename: "og-default-1200x630.png",
      originalName: "og-default-1200x630.png",
      mimeType: "image/png",
      sizeBytes: 38400,
      width: 1200,
      height: 630,
      altText: {
        ar: "د. ملاك السيف — استشارية جراحة التجميل والترميم",
        en: "Dr. Malak Alsaif — Consultant Plastic & Reconstructive Surgeon",
      },
      focalPoint: { x: 50, y: 50 },
      isPublic: true,
      storageBucket: "public",
      storagePath: "brand/og-default-1200x630.png",
      publicUrl: "/brand/og-default-1200x630.png",
      uploadedBy: "system",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: "media-brand-logo-light",
      filename: "malak-logo-light-bg.svg",
      originalName: "malak-logo-light-bg.svg",
      mimeType: "image/svg+xml",
      sizeBytes: 5120,
      width: 237,
      height: 104,
      altText: {
        ar: "شعار د. ملاك السيف للخلفيات الفاتحة",
        en: "Dr. Malak Alsaif logo for light backgrounds",
      },
      focalPoint: { x: 50, y: 50 },
      isPublic: true,
      storageBucket: "public",
      storagePath: "brand/malak-logo-light-bg.svg",
      publicUrl: "/brand/malak-logo-light-bg.svg",
      uploadedBy: "system",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: "media-brand-logo-dark",
      filename: "malak-logo-dark-bg.svg",
      originalName: "malak-logo-dark-bg.svg",
      mimeType: "image/svg+xml",
      sizeBytes: 5120,
      width: 237,
      height: 104,
      altText: {
        ar: "شعار د. ملاك السيف للخلفيات الداكنة",
        en: "Dr. Malak Alsaif reversed logo for dark backgrounds",
      },
      focalPoint: { x: 50, y: 50 },
      isPublic: true,
      storageBucket: "public",
      storagePath: "brand/malak-logo-dark-bg.svg",
      publicUrl: "/brand/malak-logo-dark-bg.svg",
      uploadedBy: "system",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: "media-dr-malak-portrait",
      filename: "dr-malak-alsaif.jpg",
      originalName: "dr-malak-alsaif.jpg",
      mimeType: "image/jpeg",
      sizeBytes: 146800,
      width: 1080,
      height: 1080,
      altText: {
        ar: "د. ملاك السيف — جراحة التجميل والترميم",
        en: "Dr. Malak Alsaif — Plastic & Reconstructive Surgery",
      },
      focalPoint: { x: 50, y: 28 },
      isPublic: true,
      storageBucket: "public",
      storagePath: "/images/doctor/dr-malak-alsaif.jpg",
      publicUrl: "/images/doctor/dr-malak-alsaif.jpg",
      uploadedBy: "system",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: "media-hero-panoramic",
      filename: "hero-panoramic-editorial.jpg",
      originalName: "hero-panoramic-editorial.jpg",
      mimeType: "image/jpeg",
      sizeBytes: 245000,
      width: 1408,
      height: 768,
      altText: {
        ar: "صورة بانورامية تحريرية هادئة تعكس العناية الطبية والجمال الطبيعي المتوازن",
        en: "Panoramic editorial photograph reflecting balanced natural beauty and attentive medical care",
      },
      focalPoint: { x: 50, y: 40 },
      isPublic: true,
      storageBucket: "public",
      storagePath: "/images/generated/hero-panoramic-editorial.jpg",
      publicUrl: "/images/generated/hero-panoramic-editorial.jpg",
      uploadedBy: "system",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: "media-specialty-plastic",
      filename: "specialty-plastic-surgery.jpg",
      originalName: "specialty-plastic-surgery.jpg",
      mimeType: "image/jpeg",
      sizeBytes: 210000,
      width: 896,
      height: 1152,
      altText: {
        ar: "صورة تحريرية هادئة تبرز الملامح الطبيعية والتناسق الوجهي في إطار جراحة التجميل",
        en: "Medical editorial portrait highlighting natural facial proportions and calm aesthetic care",
      },
      focalPoint: { x: 50, y: 50 },
      isPublic: true,
      storageBucket: "public",
      storagePath: "/images/generated/specialty-plastic-surgery.jpg",
      publicUrl: "/images/generated/specialty-plastic-surgery.jpg",
      uploadedBy: "system",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: "media-specialty-reconstructive",
      filename: "specialty-reconstructive-editorial.jpg",
      originalName: "specialty-reconstructive-editorial.jpg",
      mimeType: "image/jpeg",
      sizeBytes: 185000,
      width: 1024,
      height: 768,
      altText: {
        ar: "تكوين تحريري معماري يعبر عن الترابط واستعادة الشكل والتوازن البنيوي",
        en: "Architectural editorial still-life representing structural restoration and balanced form",
      },
      focalPoint: { x: 50, y: 50 },
      isPublic: true,
      storageBucket: "public",
      storagePath: "/images/generated/specialty-reconstructive-editorial.jpg",
      publicUrl: "/images/generated/specialty-reconstructive-editorial.jpg",
      uploadedBy: "system",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: "media-specialty-burn",
      filename: "specialty-burn-editorial.jpg",
      originalName: "specialty-burn-editorial.jpg",
      mimeType: "image/jpeg",
      sizeBytes: 178000,
      width: 1024,
      height: 768,
      altText: {
        ar: "تكوين تحريري هادئ من الأنسجة الكتانية العاجية يعبر عن العناية اللطيفة والمتابعة التأهيلية",
        en: "Calm editorial composition of folded ivory linen gauze representing gentle care and follow-up",
      },
      focalPoint: { x: 50, y: 50 },
      isPublic: true,
      storageBucket: "public",
      storagePath: "/images/generated/specialty-burn-editorial.jpg",
      publicUrl: "/images/generated/specialty-burn-editorial.jpg",
      uploadedBy: "system",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: "media-article-prep",
      filename: "article-consultation-prep.jpg",
      originalName: "article-consultation-prep.jpg",
      mimeType: "image/jpeg",
      sizeBytes: 192000,
      width: 1280,
      height: 720,
      altText: {
        ar: "دفتر ملاحظات بلون عاجي دافئ مع قلم وملف أحمر داكن على سطح مكتبي هادئ",
        en: "An ivory notebook with blank pages, a minimal pen, and a deep-red folder on a calm desk surface",
      },
      focalPoint: { x: 50, y: 50 },
      isPublic: true,
      storageBucket: "public",
      storagePath: "/images/generated/article-consultation-prep.jpg",
      publicUrl: "/images/generated/article-consultation-prep.jpg",
      uploadedBy: "system",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: "media-article-questions",
      filename: "article-questions-to-discuss.jpg",
      originalName: "article-questions-to-discuss.jpg",
      mimeType: "image/jpeg",
      sizeBytes: 184000,
      width: 1280,
      height: 720,
      altText: {
        ar: "بطاقات ورقية عاجية فارغة مرتبة بعناية مع شريط أحمر رفيع على سطح هادئ",
        en: "Minimal blank ivory cards arranged thoughtfully with a fine deep-red divider line",
      },
      focalPoint: { x: 50, y: 50 },
      isPublic: true,
      storageBucket: "public",
      storagePath: "/images/generated/article-questions-to-discuss.jpg",
      publicUrl: "/images/generated/article-questions-to-discuss.jpg",
      uploadedBy: "system",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: "media-step-03-options",
      filename: "step-03-options.jpg",
      originalName: "step-03-options.jpg",
      mimeType: "image/jpeg",
      sizeBytes: 175000,
      width: 1024,
      height: 768,
      altText: {
        ar: "ثلاث كتل حجرية عاجية متدرجة بجانب ملف أحمر داكن تعبر عن وضوح الخيارات والخطوات",
        en: "Three ascending warm-ivory travertine blocks beside a deep-red linen portfolio",
      },
      focalPoint: { x: 50, y: 50 },
      isPublic: true,
      storageBucket: "public",
      storagePath: "/images/generated/step-03-options.jpg",
      publicUrl: "/images/generated/step-03-options.jpg",
      uploadedBy: "system",
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];
}
