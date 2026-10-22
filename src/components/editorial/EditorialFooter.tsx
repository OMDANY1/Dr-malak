"use client";

import React from "react";
import Link from "next/link";
import { getCopy, siteConfig } from "@/lib/content";
import {
  getInstagramUrl,
  getPhoneDisplay,
  getTelUrl,
} from "@/lib/links";
import { Locale, localizePath } from "@/lib/locales";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { useCmsSnapshot } from "@/components/cms/CmsSnapshotContext";
import { resolveLocalizedText } from "@/lib/cms/sanitize";

interface EditorialFooterProps {
  locale: Locale;
}

export function EditorialFooter({ locale }: EditorialFooterProps) {
  const copy = getCopy(locale);
  const cms = useCmsSnapshot();

  const brandName = cms
    ? resolveLocalizedText(
        cms.contactSettings.siteName,
        locale,
        siteConfig.name[locale]
      )
    : siteConfig.name[locale];
  const brandSubtitle = cms
    ? resolveLocalizedText(
        cms.contactSettings.siteSubtitle,
        locale,
        siteConfig.subtitle[locale]
      )
    : siteConfig.subtitle[locale];

  const telUrl = getTelUrl(cms?.contactSettings.phone);
  const phone = getPhoneDisplay(cms?.contactSettings.phone);
  const instagramUrl = getInstagramUrl(cms?.contactSettings.instagramUrl);
  const instagramHandle = cms?.contactSettings.instagramHandle || "@dralsaifma";

  const navLinks = [
    { label: copy.nav.home, href: localizePath(locale, "") },
    { label: copy.nav.about, href: localizePath(locale, "about") },
    { label: copy.nav.specialties, href: localizePath(locale, "specialties") },
    { label: copy.nav.articles, href: localizePath(locale, "articles") },
    { label: copy.nav.contact, href: localizePath(locale, "contact") },
    { label: copy.nav.privacy, href: localizePath(locale, "privacy") },
  ];

  return (
    <footer className="ed-red-footer">
      <div className="ed-container">
        {/* Upper Band: Brand Signature + Concise Navigation + Direct Coordination */}
        <div className="ed-red-footer-top">
          <div className="ed-red-footer-brand">
            <Link
              href={localizePath(locale, "")}
              className="ed-red-footer-logo"
            >
              <span className="brand-name ed-red-footer-name">{brandName}</span>
              <span className="ed-red-footer-subtitle">{brandSubtitle}</span>
            </Link>
            <p className="ed-red-footer-disclaimer">{copy.footer.disclaimer}</p>
          </div>

          <nav
            aria-label={copy.a11y.footerNavLabel}
            className="ed-red-footer-nav"
          >
            <span className="ed-red-footer-col-label">
              {copy.footer.navigationHeading}
            </span>
            <ul className="ed-red-footer-nav-list">
              {navLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="ed-red-footer-link">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ed-red-footer-contact">
            <span className="ed-red-footer-col-label">
              {copy.footer.contactHeading}
            </span>
            <div className="ed-red-footer-contact-items">
              <a
                href={telUrl}
                className="ed-red-footer-phone ltr-inline"
                dir="ltr"
              >
                {phone.formatted}
              </a>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ed-red-footer-social ltr-inline"
                dir="ltr"
              >
                {instagramHandle} ↗
              </a>
              <div className="ed-red-footer-lang-wrap">
                <LanguageSwitcher
                  locale={locale}
                  label={copy.a11y.switchLanguageText}
                  ariaLabel={copy.a11y.switchLanguageLabel}
                  className="ed-footer-lang"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Lower Band: Architectural Rule + Copyright */}
        <div className="ed-red-footer-bottom">
          <p className="ed-red-footer-copy">
            {brandName} — {brandSubtitle}
          </p>
          <Link
            href={localizePath(locale, "privacy")}
            className="ed-red-footer-privacy"
          >
            {copy.nav.privacy}
          </Link>
        </div>
      </div>
    </footer>
  );
}
