import React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { siteConfig } from "@/lib/content";
import { getDirection, Locale } from "@/lib/locales";
import { getBaseUrl } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: "د. ملاك السيف | جراحة التجميل والترميم",
  description:
    "الموقع التعريفي للدكتورة ملاك السيف — جراحة التجميل والترميم.",
  robots: siteConfig.previewNoIndex
    ? {
        index: false,
        follow: false,
        nocache: true,
        googleBot: {
          index: false,
          follow: false,
        },
      }
    : {
        index: true,
        follow: true,
      },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const headerLocale = headersList.get("x-locale");
  const locale: Locale = headerLocale === "en" ? "en" : "ar";
  const dir = getDirection(locale);

  return (
    <html lang={locale} dir={dir}>
      <body>{children}</body>
    </html>
  );
}
