"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  getDirection,
  getOppositeLocale,
  Locale,
  switchLocalePath,
} from "@/lib/locales";

interface LanguageSwitcherProps {
  locale: Locale;
  label: string;
  ariaLabel: string;
  className?: string;
  onSelect?: () => void;
}

export function LanguageSwitcher({
  locale,
  label,
  ariaLabel,
  className = "",
  onSelect,
}: LanguageSwitcherProps) {
  const pathname = usePathname() || `/${locale}`;
  const targetLocale = getOppositeLocale(locale);
  const defaultHref = switchLocalePath(pathname, targetLocale);
  const [resolvedHref, setResolvedHref] = useState(defaultHref);

  useEffect(() => {
    const marker = document.querySelector<HTMLElement>(
      "[data-article-switch-href]"
    );
    const customHref = marker?.getAttribute("data-article-switch-href");
    if (customHref) {
      setResolvedHref(customHref);
    } else {
      setResolvedHref(switchLocalePath(pathname, targetLocale));
    }
  }, [pathname, targetLocale]);

  const handleSwitchClick = () => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = targetLocale;
      document.documentElement.dir = getDirection(targetLocale);
    }
    onSelect?.();
  };

  return (
    <Link
      href={resolvedHref}
      lang={targetLocale}
      hrefLang={targetLocale}
      aria-label={ariaLabel}
      className={`lang-switch ${className}`.trim()}
      onClick={handleSwitchClick}
    >
      {label}
    </Link>
  );
}
