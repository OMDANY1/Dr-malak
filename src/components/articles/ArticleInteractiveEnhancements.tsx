"use client";

import React, { useEffect, useRef, useState } from "react";
import { TocItem } from "@/lib/articles";

interface ArticleInteractiveEnhancementsProps {
  toc: TocItem[];
  tocTitle: string;
}

export function ArticleInteractiveEnhancements({
  toc,
  tocTitle,
}: ArticleInteractiveEnhancementsProps) {
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const [activeId, setActiveId] = useState<string>(toc[0]?.id ?? "");

  // Smooth reading progress bar using transform: scaleX via rAF (no React state re-renders on scroll)
  useEffect(() => {
    let rafId = 0;

    const updateProgress = () => {
      if (!progressBarRef.current) return;
      const articleEl = document.querySelector(".article-detail-page");
      if (!articleEl) return;

      const rect = articleEl.getBoundingClientRect();
      const totalScrollable = Math.max(
        1,
        articleEl.scrollHeight - window.innerHeight * 0.65
      );
      const scrolled = Math.min(
        totalScrollable,
        Math.max(0, -rect.top + window.innerHeight * 0.15)
      );
      const ratio = Math.min(1, Math.max(0, scrolled / totalScrollable));
      progressBarRef.current.style.transform = `scaleX(${ratio.toFixed(4)})`;
    };

    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // IntersectionObserver for active-section Table of Contents highlighting
  useEffect(() => {
    if (toc.length === 0 || typeof window === "undefined") return;

    const sectionElements = toc
      .map((item) => document.getElementById(item.id))
      .filter(Boolean) as HTMLElement[];

    if (sectionElements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      {
        threshold: 0.25,
        rootMargin: "-15% 0px -55% 0px",
      }
    );

    for (const el of sectionElements) {
      observer.observe(el);
    }

    return () => {
      observer.disconnect();
    };
  }, [toc]);

  return (
    <>
      {/* Subtle fixed reading-progress bar along the top of the viewport */}
      <div className="reading-progress-track" aria-hidden="true">
        <div ref={progressBarRef} className="reading-progress-bar" />
      </div>

      {toc.length > 0 && (
        <aside className="article-toc-sidebar">
          <nav aria-labelledby="article-toc-heading" className="article-toc-box">
            <h2 id="article-toc-heading" className="article-toc-title">
              {tocTitle}
            </h2>
            <ol className="article-toc-list">
              {toc.map((item, idx) => {
                const isActive = item.id === activeId;
                return (
                  <li key={item.id} className="article-toc-item">
                    <a
                      href={`#${item.id}`}
                      aria-current={isActive ? "location" : undefined}
                      className={`article-toc-link ${
                        isActive ? "is-active" : ""
                      }`.trim()}
                      onClick={() => setActiveId(item.id)}
                    >
                      <span className="article-toc-num" dir="ltr">
                        0{idx + 1}
                      </span>
                      <span>{item.heading}</span>
                    </a>
                  </li>
                );
              })}
            </ol>
          </nav>
        </aside>
      )}
    </>
  );
}
