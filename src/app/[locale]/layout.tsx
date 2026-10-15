import React from "react";
import { notFound } from "next/navigation";
import { isValidLocale } from "@/lib/locales";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
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
      <Header locale={locale} />
      <main id="main-content">{children}</main>
      <Footer locale={locale} />
    </ConsultationDialogProvider>
  );
}
