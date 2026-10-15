"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Locale } from "@/lib/locales";
import { ConsultationTriggerButton } from "@/components/interactive/ConsultationTriggerButton";
import { LanguageSwitcher } from "./LanguageSwitcher";

export interface NavItem {
  href: string;
  label: string;
}

interface MobileMenuProps {
  locale: Locale;
  navItems: NavItem[];
  ctaLabel: string;
  ctaHref: string;
  openMenuLabel: string;
  closeMenuLabel: string;
  navAriaLabel: string;
  switchLanguageLabel: string;
  switchLanguageText: string;
}

export function MobileMenu({
  locale,
  navItems,
  ctaLabel,
  ctaHref,
  openMenuLabel,
  closeMenuLabel,
  navAriaLabel,
  switchLanguageLabel,
  switchLanguageText,
}: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const closeMenu = (restoreFocus: boolean = false) => {
    setIsOpen(false);
    if (restoreFocus) {
      requestAnimationFrame(() => {
        triggerRef.current?.focus();
      });
    }
  };

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu(true);
        return;
      }

      if (event.key === "Tab" && panelRef.current) {
        const focusableInPanel = Array.from(
          panelRef.current.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );
        const focusables = triggerRef.current
          ? [triggerRef.current, ...focusableInPanel]
          : focusableInPanel;

        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (event.shiftKey && active === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const normalize = (p: string) => p.replace(/\/+$/, "") || "/";
  const currentNormalized = normalize(pathname || `/${locale}`);

  return (
    <div className="mobile-menu-wrapper">
      <button
        ref={triggerRef}
        type="button"
        className={`mobile-menu-btn ${isOpen ? "is-open" : ""}`.trim()}
        aria-expanded={isOpen}
        aria-controls="mobile-navigation-panel"
        aria-label={isOpen ? closeMenuLabel : openMenuLabel}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
          className="mobile-menu-icon"
        >
          {isOpen ? (
            <path
              d="M4 4L16 16M16 4L4 16"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="square"
            />
          ) : (
            <path
              d="M2.5 5.5H17.5M2.5 10H17.5M2.5 14.5H12.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="square"
            />
          )}
        </svg>
        <span>{isOpen ? closeMenuLabel : openMenuLabel}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="mobile-menu-backdrop"
            aria-hidden="true"
            onClick={() => closeMenu(true)}
          />
          <div
            ref={panelRef}
            id="mobile-navigation-panel"
            className="mobile-menu-panel"
            role="dialog"
            aria-modal="true"
            aria-label={navAriaLabel}
          >
            <nav aria-label={navAriaLabel}>
              <ul className="mobile-nav-list">
                {navItems.map((item, idx) => {
                  const normHref = normalize(item.href);
                  const isHome = normHref === `/${locale}`;
                  const isActive = isHome
                    ? currentNormalized === normHref
                    : currentNormalized === normHref ||
                      currentNormalized.startsWith(`${normHref}/`);
                  return (
                    <li
                      key={item.href}
                      className="mobile-nav-item-stagger"
                      style={
                        {
                          "--stagger-idx": idx,
                        } as React.CSSProperties
                      }
                    >
                      <Link
                        href={item.href}
                        className="mobile-nav-link"
                        aria-current={isActive ? "page" : undefined}
                        onClick={() => closeMenu(false)}
                      >
                        <span className="mobile-nav-link-inner">
                          <span className="mobile-nav-index" dir="ltr">
                            0{idx + 1}
                          </span>
                          <span>{item.label}</span>
                        </span>
                        <span className="btn-arrow-glyph" aria-hidden="true">
                          {locale === "ar" ? "←" : "→"}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div
              className="mobile-menu-footer mobile-nav-item-stagger"
              style={
                {
                  "--stagger-idx": navItems.length,
                } as React.CSSProperties
              }
            >
              <ConsultationTriggerButton
                label={ctaLabel}
                fallbackHref={ctaHref}
                variant="primary"
                onTrigger={() => closeMenu(false)}
              />
              <LanguageSwitcher
                locale={locale}
                label={switchLanguageText}
                ariaLabel={switchLanguageLabel}
                onSelect={() => closeMenu(false)}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
