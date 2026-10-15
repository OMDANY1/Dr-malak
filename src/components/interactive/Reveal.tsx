"use client";

import React, { useEffect, useRef, useState } from "react";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  variant?: "fade-up" | "mask-reveal" | "scale-subtle";
  as?: React.ElementType;
}

export function Reveal({
  children,
  className = "",
  delayMs = 0,
  variant = "fade-up",
  as: Component = "div",
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [state, setState] = useState<"idle" | "pending" | "visible">("idle");

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined") return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) {
      setState("visible");
      return;
    }

    const rect = el.getBoundingClientRect();
    // If already in or above the viewport on mount, trigger visible transition immediately
    if (rect.top <= window.innerHeight * 0.92) {
      setState("visible");
      return;
    }

    setState("pending");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setState("visible");
            observer.disconnect();
            break;
          }
        }
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <Component
      ref={ref}
      data-reveal={variant}
      data-reveal-state={state}
      style={
        delayMs > 0
          ? ({ "--reveal-delay": `${delayMs}ms` } as React.CSSProperties)
          : undefined
      }
      className={`reveal-item ${className}`.trim()}
    >
      {children}
    </Component>
  );
}
