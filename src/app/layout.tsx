import React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { siteConfig } from "@/lib/content";
import { getDirection, Locale } from "@/lib/locales";
import {
  buildSocialMetadata,
  DEFAULT_SOCIAL_IMAGE_PATH,
  getBaseUrl,
  toAbsoluteUrl,
} from "@/lib/seo";
import "./globals.css";

const defaultTitle = "د. ملاك السيف | جراحة التجميل والترميم";
const defaultDescription =
  "الموقع التعريفي للدكتورة ملاك السيف — جراحة التجميل والترميم.";

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: defaultTitle,
  description: defaultDescription,
  icons: {
    icon: [
      {
        url: "/favicon.ico?v=2026b",
        sizes: "16x16 32x32 48x48",
        type: "image/x-icon",
      },
      {
        url: "/icon.svg?v=2026b",
        type: "image/svg+xml",
      },
      {
        url: "/favicon-32x32.png?v=2026b",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/favicon-16x16.png?v=2026b",
        sizes: "16x16",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/apple-touch-icon.png?v=2026b",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcut: ["/favicon.ico?v=2026b"],
  },
  manifest: "/site.webmanifest?v=2026b",
  ...buildSocialMetadata({
    locale: "ar",
    title: defaultTitle,
    description: defaultDescription,
    url: toAbsoluteUrl("/ar"),
    imagePath: DEFAULT_SOCIAL_IMAGE_PATH,
  }),
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
