"use client";

import React, { useEffect, useState } from "react";

interface HeaderScrollShellProps {
  children: React.ReactNode;
}

export function HeaderScrollShell({ children }: HeaderScrollShellProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const updateScroll = () => {
      const next = window.scrollY > 24;
      setIsScrolled((prev) => (prev !== next ? next : prev));
    };

    updateScroll();
    window.addEventListener("scroll", updateScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", updateScroll);
    };
  }, []);

  return (
    <header
      className={`site-header header-seq-enter ${
        isScrolled ? "is-scrolled" : "is-at-top"
      }`.trim()}
      data-scrolled={isScrolled ? "true" : "false"}
    >
      {children}
    </header>
  );
}
