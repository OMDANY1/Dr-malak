"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavItem } from "./MobileMenu";

interface DesktopNavProps {
  items: NavItem[];
  ariaLabel: string;
}

export function DesktopNav({ items, ariaLabel }: DesktopNavProps) {
  const pathname = usePathname() || "";
  const normalize = (p: string) => p.replace(/\/+$/, "") || "/";
  const currentNormalized = normalize(pathname);

  return (
    <nav className="desktop-nav" aria-label={ariaLabel}>
      {items.map((item) => {
        const normHref = normalize(item.href);
        const segments = normHref.split("/").filter(Boolean);
        const isLocaleHome = segments.length === 1;
        const isActive = isLocaleHome
          ? currentNormalized === normHref
          : currentNormalized === normHref ||
            currentNormalized.startsWith(`${normHref}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="nav-link"
            aria-current={isActive ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
