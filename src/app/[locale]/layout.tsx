import React from "react";
import { notFound } from "next/navigation";
import { isValidLocale } from "@/lib/locales";
import { MinimalNav } from "@/components/editorial/MinimalNav";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";
import { LocaleDocumentSync } from "@/components/layout/LocaleDocumentSync";
import { ConsultationDialogProvider } from "@/components/interactive/ConsultationDialogContext";

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

  return (
    <ConsultationDialogProvider locale={locale}>
      <LocaleDocumentSync locale={locale} />
      <div className="ed-site">
        <MinimalNav locale={locale} />
        <main id="main-content" className="ed-main">
          {children}
        </main>
        <EditorialFooter locale={locale} />
      </div>
    </ConsultationDialogProvider>
  );
}
