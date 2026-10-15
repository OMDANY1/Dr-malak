import React from "react";
import Link from "next/link";
import { getCopy, siteConfig } from "@/lib/content";
import {
  getInstagramUrl,
  getPhoneDisplay,
  getTelUrl,
  getWhatsAppUrl,
} from "@/lib/links";
import { Locale, localizePath } from "@/lib/locales";
import { Container } from "@/components/ui/Container";
import { LanguageSwitcher } from "./LanguageSwitcher";

interface FooterProps {
  locale: Locale;
}

export function Footer({ locale }: FooterProps) {
  const copy = getCopy(locale);
  const whatsappUrl = getWhatsAppUrl(locale);
  const telUrl = getTelUrl();
  const phone = getPhoneDisplay();
  const instagramUrl = getInstagramUrl();

  return (
    <footer className="site-footer">
      <Container>
        <div className="footer-top">
          <div className="footer-brand-col">
            <Link
              href={localizePath(locale, "")}
              className="brand-lockup"
              style={{ marginBlockEnd: "1.15rem" }}
              aria-label={`${siteConfig.name[locale]} — ${siteConfig.subtitle[locale]}`}
            >
              <span className="brand-lockup-bar" aria-hidden="true" />
              <span className="brand-lockup-text">
                <span className="brand-name">{siteConfig.name[locale]}</span>
                <span className="brand-subtitle">
                  {siteConfig.subtitle[locale]}
                </span>
              </span>
            </Link>
            <p className="footer-disclaimer">{copy.footer.disclaimer}</p>
          </div>

          <nav aria-label={copy.a11y.footerNavLabel}>
            <h2 className="footer-heading">{copy.footer.navigationHeading}</h2>
            <ul className="footer-links">
              <li>
                <Link href={localizePath(locale, "")} className="footer-link">
                  {copy.nav.home}
                </Link>
              </li>
              <li>
                <Link
                  href={localizePath(locale, "about")}
                  className="footer-link"
                >
                  {copy.nav.about}
                </Link>
              </li>
              <li>
                <Link
                  href={localizePath(locale, "specialties")}
                  className="footer-link"
                >
                  {copy.nav.specialties}
                </Link>
              </li>
              <li>
                <Link
                  href={localizePath(locale, "articles")}
                  className="footer-link"
                >
                  {copy.nav.articles}
                </Link>
              </li>
              <li>
                <Link
                  href={localizePath(locale, "contact")}
                  className="footer-link"
                >
                  {copy.nav.contact}
                </Link>
              </li>
              <li>
                <Link
                  href={localizePath(locale, "privacy")}
                  className="footer-link"
                >
                  {copy.nav.privacy}
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className="footer-heading">{copy.footer.contactHeading}</h2>
            <ul className="footer-links">
              <li>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-link"
                >
                  <span>{copy.hero.primary}</span>
                </a>
              </li>
              <li>
                <a href={telUrl} className="footer-link">
                  <span>{copy.footer.coordinationLabel}:&nbsp;</span>
                  <span className="ltr-inline" dir="ltr">
                    {phone.raw}
                  </span>
                </a>
              </li>
              <li>
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-link"
                >
                  <span>{copy.aboutPreview.instagramLabel}</span>
                  <span>&nbsp;</span>
                  <span className="ltr-inline" dir="ltr">
                    (@dralsaifma)
                  </span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>{copy.footer.copyright}</span>
          <div className="footer-bottom-links">
            <LanguageSwitcher
              locale={locale}
              label={copy.a11y.switchLanguageText}
              ariaLabel={copy.a11y.switchLanguageLabel}
              className="footer-lang-switch"
            />
            <span className="footer-sep" aria-hidden="true">
              ·
            </span>
            <Link href={localizePath(locale, "privacy")} className="footer-link">
              {copy.nav.privacy}
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
