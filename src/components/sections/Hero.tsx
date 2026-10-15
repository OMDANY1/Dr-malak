"use client";

import React, { useEffect, useRef } from "react";
import { getCopy } from "@/lib/content";
import { getWhatsAppUrl } from "@/lib/links";
import { Locale } from "@/lib/locales";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { ConsultationTriggerButton } from "@/components/interactive/ConsultationTriggerButton";

interface HeroProps {
  locale: Locale;
}

export function Hero({ locale }: HeroProps) {
  const copy = getCopy(locale);
  const whatsappUrl = getWhatsAppUrl(locale);
  const sectionRef = useRef<HTMLElement | null>(null);

  // Subtle image translation on desktop scroll (disabled under prefers-reduced-motion)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        if (sectionRef.current && window.innerWidth >= 960) {
          const shift = Math.min(window.scrollY * 0.04, 18);
          sectionRef.current.style.setProperty(
            "--hero-img-shift-y",
            `${shift.toFixed(1)}px`
          );
        }
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="hero-immersive-section"
      aria-labelledby="hero-heading"
    >
      {/* Large editorial medical-beauty photograph defining the first screen */}
      <div className="hero-immersive-backdrop hero-seq-portrait-mask">
        <img
          src="/images/generated/hero-aesthetic-editorial.jpg"
          alt={
            locale === "ar"
              ? "صورة تعبيرية هادئة تعكس العناية الطبية والجمال الطبيعي المتوازن"
              : "Calm editorial portrait reflecting balanced natural beauty and attentive medical care"
          }
          width={1344}
          height={768}
          fetchPriority="high"
          loading="eager"
          decoding="async"
          className="hero-immersive-img"
        />
        <div className="hero-immersive-gradient" aria-hidden="true" />
        <div className="hero-architectural-frame-lines" aria-hidden="true" />
      </div>

      <Container className="hero-immersive-container">
        <div className="hero-immersive-content-wrap">
          <div className="hero-immersive-copy-panel">
            <div className="hero-seq-eyebrow hero-eyebrow-group">
              <span className="hero-edition-num" dir="ltr" aria-hidden="true">
                01
              </span>
              <span className="eyebrow-line" aria-hidden="true" />
              <span className="hero-eyebrow">{copy.hero.eyebrow}</span>
              <span className="hero-eyebrow-sep" aria-hidden="true">
                ·
              </span>
              <span className="hero-field-tag">{copy.hero.subtitle}</span>
            </div>

            <h1 id="hero-heading" className="hero-immersive-title">
              <span className="hero-line-mask">
                <span className="hero-line-reveal hero-line-1">
                  {copy.hero.title}
                </span>
              </span>
            </h1>

            <div className="hero-title-rule" aria-hidden="true" />

            <div className="hero-seq-copy">
              <p className="hero-immersive-lead">{copy.hero.body}</p>
            </div>

            <div className="hero-seq-cta">
              <div className="hero-cta-group">
                <ConsultationTriggerButton
                  label={copy.hero.primary}
                  topicId="general"
                  variant="primary"
                  fallbackHref={whatsappUrl}
                />
                <Button
                  href="#specialties-section"
                  variant="secondary"
                  className="hero-secondary-explore-link"
                >
                  <span>{copy.hero.secondary}</span>
                  <span className="btn-arrow-glyph" aria-hidden="true">
                    ↓
                  </span>
                </Button>
              </div>

              <div className="hero-bottom-meta-row">
                <p className="hero-concise-note">{copy.hero.coordinationNote}</p>

                <a
                  href="#doctor-section"
                  className="hero-scroll-cue"
                  aria-label={copy.aboutPreview.eyebrow}
                >
                  <span className="hero-scroll-cue-label">
                    {copy.aboutPreview.eyebrow}
                  </span>
                  <span className="hero-scroll-cue-stem" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
