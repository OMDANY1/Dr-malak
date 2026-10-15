import React from "react";
import Link from "next/link";
import { getCopy, siteConfig } from "@/lib/content";
import { getWhatsAppUrl } from "@/lib/links";
import { Locale, localizePath } from "@/lib/locales";
import { Container } from "@/components/ui/Container";
import { ConsultationTriggerButton } from "@/components/interactive/ConsultationTriggerButton";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { MobileMenu, NavItem } from "./MobileMenu";
import { DesktopNav } from "./DesktopNav";
import { HeaderScrollShell } from "./HeaderScrollShell";

interface HeaderProps {
  locale: Locale;
}

export function Header({ locale }: HeaderProps) {
  const copy = getCopy(locale);
  const whatsappUrl = getWhatsAppUrl(locale);

  const navItems: NavItem[] = [
    { href: localizePath(locale, ""), label: copy.nav.home },
    { href: localizePath(locale, "about"), label: copy.nav.about },
    { href: localizePath(locale, "specialties"), label: copy.nav.specialties },
    { href: localizePath(locale, "articles"), label: copy.nav.articles },
    { href: localizePath(locale, "contact"), label: copy.nav.contact },
  ];

  return (
    <HeaderScrollShell>
      <a href="#main-content" className="skip-link">
        {copy.a11y.skipToContent}
      </a>

      <Container className="header-inner">
        <Link
          href={localizePath(locale, "")}
          className="brand-lockup"
          aria-label={`${siteConfig.name[locale]} — ${siteConfig.subtitle[locale]}`}
        >
          <span className="brand-lockup-bar" aria-hidden="true" />
          <span className="brand-lockup-text">
            <span className="brand-name">{siteConfig.name[locale]}</span>
            <span className="brand-subtitle">{siteConfig.subtitle[locale]}</span>
          </span>
        </Link>

        <DesktopNav items={navItems} ariaLabel={copy.a11y.mainNavLabel} />

        <div className="header-actions">
          <LanguageSwitcher
            locale={locale}
            label={copy.a11y.switchLanguageText}
            ariaLabel={copy.a11y.switchLanguageLabel}
          />

          <ConsultationTriggerButton
            label={copy.header.cta}
            fallbackHref={whatsappUrl}
            variant="primary"
            className="header-cta-desktop"
          />

          <MobileMenu
            locale={locale}
            navItems={navItems}
            ctaLabel={copy.header.cta}
            ctaHref={whatsappUrl}
            openMenuLabel={copy.a11y.openMenu}
            closeMenuLabel={copy.a11y.closeMenu}
            navAriaLabel={copy.a11y.mainNavLabel}
            switchLanguageLabel={copy.a11y.switchLanguageLabel}
            switchLanguageText={copy.a11y.switchLanguageText}
          />
        </div>
      </Container>
    </HeaderScrollShell>
  );
}
