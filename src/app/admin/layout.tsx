import React from "react";
import type { Metadata } from "next";
import "./admin.css";

export const metadata: Metadata = {
  title: "لوحة إدارة المحتوى | د. ملاك السيف",
  description: "لوحة التحكم التحريرية لإدارة محتوى موقع د. ملاك السيف",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
