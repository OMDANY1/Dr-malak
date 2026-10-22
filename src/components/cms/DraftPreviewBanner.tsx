"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Locale } from "@/lib/locales";

export function DraftPreviewBanner({ locale }: { locale: Locale }) {
  const pathname = usePathname() || `/${locale}`;
  const exitHref = `/api/cms/preview?action=exit&redirect=${encodeURIComponent(
    pathname
  )}`;

  return (
    <div
      className="cms-draft-preview-banner"
      role="region"
      aria-label={
        locale === "ar"
          ? "شريط معاينة المسودات التحريرية"
          : "Editorial Draft Preview Banner"
      }
      dir="rtl"
    >
      <div className="cms-draft-preview-inner">
        <div className="cms-draft-preview-status">
          <span className="cms-draft-preview-dot" aria-hidden="true" />
          <strong>وضع معاينة المسودات التحريرية:</strong>
          <span>
            أنتِ تشاهدين النسخة التجريبية غير المنشورة للزوار (noindex).
          </span>
        </div>
        <div className="cms-draft-preview-actions">
          <Link href="/admin" className="cms-draft-preview-btn">
            العودة إلى لوحة التحكم
          </Link>
          <a
            href={exitHref}
            className="cms-draft-preview-btn cms-draft-preview-btn--outline"
          >
            إنهاء المعاينة وعرض الموقع العام
          </a>
        </div>
      </div>
    </div>
  );
}
