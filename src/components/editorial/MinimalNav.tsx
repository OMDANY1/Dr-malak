"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getCopy, siteConfig } from "@/lib/content";
import {
  getInstagramUrl,
  getPhoneDisplay,
  getTelUrl,
  getWhatsAppUrl,
} from "@/lib/links";
import { Locale, localizePath } from "@/lib/locales";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { ConsultationTriggerButton } from "@/components/interactive/ConsultationTriggerButton";

interface MinimalNavProps {
  locale: Locale;
}

export function MinimalNav({ locale }: MinimalNavProps) {
  const copy = getCopy(locale);
  const pathname = usePathname() || `/${locale}`;
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const whatsappUrl = getWhatsAppUrl(locale);
  const telUrl = getTelUrl();
  const phone = getPhoneDisplay();
  const instagramUrl = getInstagramUrl();

  const navItems = [
    { key: "home", num: "01", label: copy.nav.home, href: localizePath(locale, "") },
    { key: "about", num: "02", label: copy.nav.about, href: localizePath(locale, "about") },
    {
      key: "specialties",
      num: "03",
      label: copy.nav.specialties,
      href: localizePath(locale, "specialties"),
    },
    {
      key: "articles",
      num: "04",
      label: copy.nav.articles,
      href: localizePath(locale, "articles"),
    },
    {
      key: "contact",
      num: "05",
      label: copy.nav.contact,
      href: localizePath(locale, "contact"),
    },
    {
      key: "privacy",
      num: "06",
      label: copy.nav.privacy,
      href: localizePath(locale, "privacy"),
    },
  ];

  const closeMenu = useCallback((restoreFocus = true) => {
    setIsOpen(false);
    if (restoreFocus) {
      requestAnimationFrame(() => {
        triggerRef.current?.focus();
      });
    }
  }, []);

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Subtle scroll state for minimal bar
  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Focus trap, Escape key, and body scroll lock when full-screen menu is open
  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = requestAnimationFrame(() => {
      closeBtnRef.current?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu(true);
        return;
      }

      if (event.key === "Tab" && panelRef.current) {
        const focusable = Array.from(
          panelRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === first) {
            event.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelAnimationFrame(focusTimer);
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, closeMenu]);

  return (
    <>
      <a href="#main-content" className="ed-skip-link">
        {copy.a11y.skipToContent}
      </a>

      <header
        className={`ed-minimal-header ${isScrolled ? "is-scrolled" : "is-at-top"} ${
          isOpen ? "is-menu-open" : ""
        }`.trim()}
      >
        <div className="ed-minimal-header-inner">
          {/* Doctor's existing brand identity */}
          <Link href={localizePath(locale, "")} className="ed-brand-lockup">
            <span className="brand-name ed-brand-name">
              {siteConfig.name[locale]}
            </span>
            <span className="ed-brand-sep" aria-hidden="true" />
            <span className="ed-brand-subtitle">
              {siteConfig.subtitle[locale]}
            </span>
          </Link>

          {/* Minimal Actions: Language Access + Consultation Action + Clearly Labeled Menu Button */}
          <div className="ed-minimal-actions">
            <LanguageSwitcher
              locale={locale}
              label={copy.a11y.switchLanguageText}
              ariaLabel={copy.a11y.switchLanguageLabel}
              className="ed-header-lang"
            />

            <ConsultationTriggerButton
              label={copy.header.cta}
              topicId="general"
              variant="ivory"
              className="ed-header-consult-btn"
              fallbackHref={whatsappUrl}
            />

            <button
              ref={triggerRef}
              type="button"
              className="ed-menu-trigger-btn"
              aria-expanded={isOpen}
              aria-controls="ed-fullscreen-menu-panel"
              aria-label={isOpen ? copy.a11y.closeMenu : copy.a11y.openMenu}
              onClick={() => setIsOpen((prev) => !prev)}
            >
              <span className="ed-menu-trigger-label">
                {isOpen
                  ? locale === "ar"
                    ? "إغلاق"
                    : "Close"
                  : locale === "ar"
                  ? "القائمة"
                  : "Menu"}
              </span>
              <span className="ed-menu-trigger-icon" aria-hidden="true">
                <span className="ed-menu-line ed-menu-line-1" />
                <span className="ed-menu-line ed-menu-line-2" />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Full-Screen Menu Panel with Large Page Links and Smaller Contact Area */}
      <div
        id="ed-fullscreen-menu-panel"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={copy.a11y.mainNavLabel}
        hidden={!isOpen}
        aria-hidden={!isOpen}
        inert={!isOpen ? true : undefined}
        className={`ed-fullscreen-menu ${isOpen ? "is-open" : ""}`.trim()}
      >
        <div className="ed-fullscreen-menu-inner">
          {/* Top Bar inside Full-Screen Panel */}
          <div className="ed-fullscreen-menu-topbar">
            <Link
              href={localizePath(locale, "")}
              className="ed-brand-lockup"
              onClick={() => closeMenu(false)}
            >
              <span className="brand-name ed-brand-name">
                {siteConfig.name[locale]}
              </span>
              <span className="ed-brand-sep" aria-hidden="true" />
              <span className="ed-brand-subtitle">
                {siteConfig.subtitle[locale]}
              </span>
            </Link>

            <div className="ed-fullscreen-menu-top-actions">
              <LanguageSwitcher
                locale={locale}
                label={copy.a11y.switchLanguageText}
                ariaLabel={copy.a11y.switchLanguageLabel}
                className="ed-header-lang"
                onSelect={() => setIsOpen(false)}
              />

              <button
                ref={closeBtnRef}
                type="button"
                className="ed-menu-close-btn"
                aria-label={copy.a11y.closeMenu}
                onClick={() => closeMenu(true)}
              >
                <span>{locale === "ar" ? "إغلاق القائمة" : "Close Menu"}</span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M4 4L16 16M16 4L4 16"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="square"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Main Grid: Large Page Links + Smaller Contact Area */}
          <div className="ed-fullscreen-menu-grid">
            <nav
              aria-label={copy.a11y.mainNavLabel}
              className="ed-fullscreen-nav"
            >
              <ul className="ed-fullscreen-nav-list">
                {navItems.map((item) => {
                  const isActive =
                    item.key === "home"
                      ? pathname === item.href
                      : pathname === item.href ||
                        pathname.startsWith(`${item.href}/`);
                  return (
                    <li key={item.key} className="ed-fullscreen-nav-item">
                      <Link
                        href={item.href}
                        aria-current={isActive ? "page" : undefined}
                        className={`ed-fullscreen-nav-link ${
                          isActive ? "is-active" : ""
                        }`.trim()}
                        onClick={() => closeMenu(false)}
                      >
                        <span className="ed-fullscreen-nav-num" dir="ltr">
                          {item.num}
                        </span>
                        <span className="ed-fullscreen-nav-label">
                          {item.label}
                        </span>
                        <span
                          className="ed-fullscreen-nav-arrow"
                          aria-hidden="true"
                        >
                          {locale === "ar" ? "←" : "→"}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Smaller Contact Area */}
            <aside className="ed-fullscreen-contact-area">
              <div className="ed-fullscreen-contact-box">
                <span className="ed-fullscreen-contact-eyebrow">
                  {copy.footer.contactHeading}
                </span>

                <p className="ed-fullscreen-contact-note">
                  {copy.hero.coordinationNote}
                </p>

                <div className="ed-fullscreen-contact-links">
                  <div className="ed-fullscreen-contact-row">
                    <span className="ed-fullscreen-contact-label">
                      {copy.contactCta.phoneLabel}
                    </span>
                    <a
                      href={telUrl}
                      className="ed-fullscreen-phone ltr-inline"
                      dir="ltr"
                    >
                      {phone.formatted}
                    </a>
                  </div>

                  <div className="ed-fullscreen-contact-row">
                    <span className="ed-fullscreen-contact-label">
                      {copy.aboutPreview.instagramLabel}
                    </span>
                    <a
                      href={instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ed-fullscreen-social ltr-inline"
                      dir="ltr"
                    >
                      @dralsaifma ↗
                    </a>
                  </div>
                </div>

                <div className="ed-fullscreen-contact-cta">
                  <ConsultationTriggerButton
                    label={copy.header.cta}
                    topicId="general"
                    variant="ivory"
                    fallbackHref={whatsappUrl}
                    onTrigger={() => setIsOpen(false)}
                  />
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
