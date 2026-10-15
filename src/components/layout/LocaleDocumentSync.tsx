"use client";

import { useEffect, useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { getDirection, Locale } from "@/lib/locales";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

interface LocaleDocumentSyncProps {
  locale: Locale;
}

function resolveLocaleFromPathname(
  pathname: string | null,
  fallback: Locale
): Locale {
  if (!pathname) return fallback;
  if (pathname === "/en" || pathname.startsWith("/en/")) {
    return "en";
  }
  if (pathname === "/ar" || pathname.startsWith("/ar/")) {
    return "ar";
  }
  return fallback;
}

/**
 * Synchronizes document.documentElement.lang and document.documentElement.dir
 * on initial mount, client-side route navigation, and browser Back/Forward (popstate).
 */
export function LocaleDocumentSync({ locale }: LocaleDocumentSyncProps) {
  const pathname = usePathname();

  useIsomorphicLayoutEffect(() => {
    const applyDocumentLocale = (currentPath: string | null) => {
      const activeLocale = resolveLocaleFromPathname(currentPath, locale);
      const activeDir = getDirection(activeLocale);

      if (document.documentElement.lang !== activeLocale) {
        document.documentElement.lang = activeLocale;
      }
      if (document.documentElement.dir !== activeDir) {
        document.documentElement.dir = activeDir;
      }
    };

    applyDocumentLocale(pathname);

    const handlePopState = () => {
      applyDocumentLocale(window.location.pathname);
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [locale, pathname]);

  return null;
}
