import type { Locale } from "@/lib/locales";

export type CmsRole = "owner" | "editor";

export type PublicationStatus = "draft" | "published";

export type HomepageSectionId =
  | "specialties"
  | "doctor"
  | "steps"
  | "journal"
  | "faq"
  | "booking";

export interface LocalizedText {
  ar: string;
  en: string;
}

export interface FocalPoint {
  x: number; // 0 to 100 percentage
  y: number; // 0 to 100 percentage
}

export interface HomepageSectionConfig {
  id: HomepageSectionId;
  visible: boolean;
  order: number;
  eyebrow: LocalizedText;
  title: LocalizedText;
  supportingText: LocalizedText;
}

export interface HomepageDocument {
  hero: {
    eyebrow: LocalizedText;
    subtitle: LocalizedText;
    title: LocalizedText;
    description: LocalizedText;
    image: string;
    imageAlt: LocalizedText;
    focalPoint: FocalPoint;
    caption: LocalizedText;
    editorialNote: LocalizedText;
    coordinationNote: LocalizedText;
    primaryCtaLabel: LocalizedText;
    primaryCtaDestination: string; // e.g. "#consultation-dialog" or "/ar/contact"
    secondaryCtaLabel: LocalizedText;
    secondaryCtaDestination: string; // e.g. "/ar/specialties"
  };
  sections: HomepageSectionConfig[];
}

export interface DoctorCredentialItem {
  id: string;
  label: LocalizedText;
  text: LocalizedText;
}

export interface DoctorApproachPillar {
  id: string;
  title: LocalizedText;
  body: LocalizedText;
}

export interface DoctorProfileDocument {
  fullName: LocalizedText;
  specialtyTitle: LocalizedText;
  portraitImage: string;
  portraitAlt: LocalizedText;
  portraitCaption: LocalizedText;
  portraitFocalPoint: FocalPoint;
  shortBio: LocalizedText;
  biographyHeading: LocalizedText;
  biographyParagraphs: {
    ar: string[];
    en: string[];
  };
  editorialNotice: LocalizedText;
  credentialsEyebrow: LocalizedText;
  credentialsHeading: LocalizedText;
  credentialsNote: LocalizedText;
  credentials: DoctorCredentialItem[];
  approachEyebrow: LocalizedText;
  approachTitle: LocalizedText;
  approachPillars: DoctorApproachPillar[];
  seo: {
    title: LocalizedText;
    description: LocalizedText;
  };
}

export interface CmsFaqItem {
  id: string;
  order: number;
  visible: boolean;
  question: LocalizedText;
  answer: LocalizedText;
}

export interface CmsFaqDocument {
  eyebrow: LocalizedText;
  title: LocalizedText;
  intro: LocalizedText;
  items: CmsFaqItem[];
}

export interface CmsContactSettingsDocument {
  siteName: LocalizedText;
  siteSubtitle: LocalizedText;
  phone: string;
  whatsappDigits: string;
  defaultWhatsappMessage: LocalizedText;
  instagramUrl: string;
  instagramHandle: string;
  address: LocalizedText; // Rendered on public site ONLY when non-empty
  workingHours: LocalizedText; // Rendered on public site ONLY when non-empty
  mapUrl: string; // Rendered on public site ONLY when non-empty
  bookingCta: {
    eyebrow: LocalizedText;
    title: LocalizedText;
    body: LocalizedText;
    primaryLabel: LocalizedText;
    secondaryCallLabel: LocalizedText;
  };
  globalSeo: {
    defaultTitle: LocalizedText;
    defaultDescription: LocalizedText;
    socialImage: string;
  };
}

export interface CmsSpecialtyContent {
  slug: string;
  numberLabel: string;
  title: LocalizedText;
  introduction: LocalizedText;
  fullContent: LocalizedText;
  assessmentNote: LocalizedText;
  visualCaption: LocalizedText;
  coverImage: string;
  imageAlt: LocalizedText;
  focalPoint: FocalPoint;
  ctaLabel: LocalizedText;
  whatsappMessage: LocalizedText;
}

export interface CmsSpecialtyRecord {
  id: string;
  slug: string;
  displayOrder: number;
  status: PublicationStatus;
  draft: CmsSpecialtyContent;
  published: CmsSpecialtyContent | null;
  publishedAt: string | null;
  updatedAt: string;
}

export type RichTextBlockType =
  | "heading"
  | "paragraph"
  | "bullet-list"
  | "ordered-list"
  | "image"
  | "callout";

export interface RichTextBlock {
  id: string;
  type: RichTextBlockType;
  headingLevel?: 2 | 3;
  text?: string; // sanitized inline text/links
  items?: string[];
  imageUrl?: string;
  imageAlt?: string;
  imageCaption?: string;
  linkHref?: string;
  linkLabel?: string;
}

export interface CmsArticleLocaleContent {
  title: string;
  excerpt: string;
  coverAlt: string;
  authorName: string;
  reviewedBy: string;
  seoTitle: string;
  seoDescription: string;
  blocks: RichTextBlock[];
}

export interface CmsArticleContent {
  slug: string;
  category: string;
  coverImage: string;
  coverFocalPoint: FocalPoint;
  socialImage: string;
  publishedAt: string | null;
  updatedAt: string | null;
  locales: Record<Locale, CmsArticleLocaleContent>;
}

export interface CmsArticleRecord {
  id: string;
  slug: string;
  translationKey: string;
  category: string;
  status: PublicationStatus;
  draft: CmsArticleContent;
  published: CmsArticleContent | null;
  publishedAt: string | null;
  updatedAt: string;
}

export interface CmsMediaAsset {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  width: number;
  height: number;
  altText: LocalizedText;
  focalPoint: FocalPoint;
  isPublic: boolean;
  storageBucket: string;
  storagePath: string;
  publicUrl: string;
  uploadedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CmsRedirect {
  id: string;
  entityType: "specialty" | "article";
  fromSlug: string;
  toSlug: string;
  createdAt: string;
}

export type CmsEntityType =
  | "document"
  | "specialty"
  | "article";

export type CmsRevisionAction =
  | "seed"
  | "save_draft"
  | "publish"
  | "unpublish"
  | "restore_to_draft";

export interface CmsRevision {
  id: string;
  entityType: CmsEntityType;
  entityId: string;
  entityTitle: string;
  action: CmsRevisionAction;
  snapshot: unknown;
  summary: string;
  actorEmail: string;
  actorRole: CmsRole | "system";
  createdAt: string;
}

export interface CmsUser {
  id: string;
  email: string;
  displayName: string;
  role: CmsRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TranslationCompletenessReport {
  arPercent: number;
  enPercent: number;
  missingArFields: string[];
  missingEnFields: string[];
  isArComplete: boolean;
  isEnComplete: boolean;
}

export interface AdminCmsState {
  storageMode: "supabase" | "sqlite-local" | "serverless-readonly";
  canPersist: boolean;
  persistenceNotice: string | null;
  currentUser: CmsUser;
  documents: {
    homepage: {
      draft: HomepageDocument;
      published: HomepageDocument;
      updatedAt: string;
      publishedAt: string | null;
      hasUnpublishedChanges: boolean;
    };
    doctorProfile: {
      draft: DoctorProfileDocument;
      published: DoctorProfileDocument;
      updatedAt: string;
      publishedAt: string | null;
      hasUnpublishedChanges: boolean;
    };
    faq: {
      draft: CmsFaqDocument;
      published: CmsFaqDocument;
      updatedAt: string;
      publishedAt: string | null;
      hasUnpublishedChanges: boolean;
    };
    contactSettings: {
      draft: CmsContactSettingsDocument;
      published: CmsContactSettingsDocument;
      updatedAt: string;
      publishedAt: string | null;
      hasUnpublishedChanges: boolean;
    };
  };
  specialties: CmsSpecialtyRecord[];
  articles: CmsArticleRecord[];
  mediaAssets: CmsMediaAsset[];
  revisions: CmsRevision[];
  redirects: CmsRedirect[];
  users: CmsUser[];
}

export interface PublicCmsSnapshot {
  isDraftPreview: boolean;
  homepage: HomepageDocument;
  doctorProfile: DoctorProfileDocument;
  faq: CmsFaqDocument;
  contactSettings: CmsContactSettingsDocument;
  specialties: Array<{
    id: string;
    slug: string;
    displayOrder: number;
    status: PublicationStatus;
    content: CmsSpecialtyContent;
    updatedAt: string;
  }>;
  articles: Array<{
    id: string;
    slug: string;
    translationKey: string;
    category: string;
    status: PublicationStatus;
    content: CmsArticleContent;
    publishedAt: string | null;
    updatedAt: string;
  }>;
  redirects: CmsRedirect[];
}
