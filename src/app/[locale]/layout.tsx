import React from "react";
import { notFound } from "next/navigation";
import { isValidLocale } from "@/lib/locales";
import { MinimalNav } from "@/components/editorial/MinimalNav";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";
import { LocaleDocumentSync } from "@/components/layout/LocaleDocumentSync";
import { ConsultationDialogProvider } from "@/components/interactive/ConsultationDialogContext";
import { CmsSnapshotProvider } from "@/components/cms/CmsSnapshotContext";
import { DraftPreviewBanner } from "@/components/cms/DraftPreviewBanner";
import { isDraftPreviewRequest } from "@/lib/cms/auth";
import { getPublicCmsSnapshot } from "@/lib/cms/db";

export const dynamic = "force-dynamic";

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const previewDrafts = await isDraftPreviewRequest();
  const cmsSnapshot = getPublicCmsSnapshot({ previewDrafts });

  return (
    <CmsSnapshotProvider snapshot={cmsSnapshot}>
      <ConsultationDialogProvider locale={locale}>
        <LocaleDocumentSync locale={locale} />
        {cmsSnapshot.isDraftPreview && <DraftPreviewBanner locale={locale} />}
        <div className="ed-site">
          <MinimalNav locale={locale} />
          <main id="main-content" className="ed-main">
            {children}
          </main>
          <EditorialFooter locale={locale} />
        </div>
      </ConsultationDialogProvider>
    </CmsSnapshotProvider>
  );
}
