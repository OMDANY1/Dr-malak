"use client";

import React, { useEffect, useRef } from "react";
import { getCopy } from "@/lib/content";
import { getWhatsAppUrl } from "@/lib/links";
import { Locale } from "@/lib/locales";
import { ConsultationTriggerButton } from "@/components/interactive/ConsultationTriggerButton";

interface TypographicRedHeroProps {
  locale: Locale;
}

export function TypographicRedHero({ locale }: TypographicRedHeroProps) {
  const copy = getCopy(locale);
  const whatsappUrl = getWhatsAppUrl(locale);
  const sectionRef = useRef<HTMLElement | null>(null);

  // Very subtle image scale change during initial scrolling (disabled under prefers-reduced-motion)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        if (sectionRef.current) {
          const progress = Math.min(Math.max(window.scrollY / 520, 0), 1);
          const scale = 1 + progress * 0.042;
          sectionRef.current.style.setProperty(
            "--ed-hero-img-scale",
            scale.toFixed(4)
          );
        }
        ticking = false;
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="ed-red-hero"
      aria-labelledby="hero-heading"
    >
      {/* Layer 1: Vertically Centered Ivory Typography on Deep-Brand-Red Canvas */}
      <div className="ed-red-hero-copy-stage">
        <div className="ed-red-hero-label-row">
          <span className="ed-red-hero-rule" aria-hidden="true" />
          <p className="ed-red-hero-specialty-label">
            <span>{copy.hero.subtitle}</span>
            <span className="ed-label-dot" aria-hidden="true">
              ·
            </span>
            <span>{copy.hero.eyebrow}</span>
          </p>
          <span className="ed-red-hero-rule" aria-hidden="true" />
        </div>

        <h1 id="hero-heading" className="ed-red-hero-headline">
          <span className="ed-hero-line-mask">
            <span className="ed-hero-line-reveal hero-line-1">
              {locale === "ar" ? `“${copy.hero.title}”` : copy.hero.title}
            </span>
          </span>
        </h1>

        <p className="ed-red-hero-lead hero-immersive-lead">{copy.hero.body}</p>

        <div className="ed-red-hero-action-cluster">
          <ConsultationTriggerButton
            label={copy.hero.primary}
            topicId="general"
            variant="ivory"
            className="ed-red-hero-cta"
            fallbackHref={whatsappUrl}
          />
          <span className="ed-red-hero-coord-note">
            {copy.hero.coordinationNote}
          </span>
        </div>
      </div>

      {/* Layer 2: Wide Panoramic Editorial Photograph Inset Slightly from Viewport Edges, Extending into Next Section */}
      <div className="ed-red-hero-panoramic-stage">
        <figure className="ed-panoramic-figure">
          <div className="ed-panoramic-mask">
            <img
              src="/images/generated/hero-panoramic-editorial.jpg"
              alt={
                locale === "ar"
                  ? "صورة بانورامية تحريرية هادئة تعكس العناية الطبية والجمال الطبيعي المتوازن"
                  : "Panoramic editorial photograph reflecting balanced natural beauty and attentive medical care"
              }
              width={1408}
              height={768}
              fetchPriority="high"
              loading="eager"
              decoding="async"
              className="ed-panoramic-img"
            />
          </div>
          <figcaption className="ed-panoramic-caption">
            <span>{copy.hero.portraitCaption}</span>
            <span className="ed-panoramic-caption-note">
              {copy.hero.editorialNote}
            </span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
