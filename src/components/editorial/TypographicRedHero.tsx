"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { getCopy } from "@/lib/content";
import { getWhatsAppUrl } from "@/lib/links";
import { Locale, localizePath } from "@/lib/locales";
import { ConsultationTriggerButton } from "@/components/interactive/ConsultationTriggerButton";
import { useCmsSnapshot } from "@/components/cms/CmsSnapshotContext";
import { resolveLocalizedText } from "@/lib/cms/sanitize";

interface TypographicRedHeroProps {
  locale: Locale;
}

export function TypographicRedHero({ locale }: TypographicRedHeroProps) {
  const copy = getCopy(locale);
  const cms = useCmsSnapshot();
  const whatsappUrl = getWhatsAppUrl(
    locale,
    undefined,
    cms?.contactSettings.whatsappDigits
  );
  const sectionRef = useRef<HTMLElement | null>(null);

  const hero = cms?.homepage.hero;

  const eyebrow = hero
    ? resolveLocalizedText(hero.eyebrow, locale, copy.hero.eyebrow)
    : copy.hero.eyebrow;
  const subtitle = hero
    ? resolveLocalizedText(hero.subtitle, locale, copy.hero.subtitle)
    : copy.hero.subtitle;
  const title = hero
    ? resolveLocalizedText(hero.title, locale, copy.hero.title)
    : copy.hero.title;
  const description = hero
    ? resolveLocalizedText(hero.description, locale, copy.hero.body)
    : copy.hero.body;
  const imageSrc =
    hero?.image || "/images/generated/hero-panoramic-editorial.jpg";
  const imageAlt = hero
    ? resolveLocalizedText(
        hero.imageAlt,
        locale,
        locale === "ar"
          ? "صورة بانورامية تحريرية هادئة تعكس العناية الطبية والجمال الطبيعي المتوازن"
          : "Panoramic editorial photograph reflecting balanced natural beauty and attentive medical care"
      )
    : locale === "ar"
    ? "صورة بانورامية تحريرية هادئة تعكس العناية الطبية والجمال الطبيعي المتوازن"
    : "Panoramic editorial photograph reflecting balanced natural beauty and attentive medical care";
  const focalPoint = hero?.focalPoint ?? { x: 50, y: 40 };
  const caption = hero
    ? resolveLocalizedText(hero.caption, locale, copy.hero.portraitCaption)
    : copy.hero.portraitCaption;
  const editorialNote = hero
    ? resolveLocalizedText(hero.editorialNote, locale, copy.hero.editorialNote)
    : copy.hero.editorialNote;
  const coordinationNote = hero
    ? resolveLocalizedText(
        hero.coordinationNote,
        locale,
        copy.hero.coordinationNote
      )
    : copy.hero.coordinationNote;
  const primaryLabel = hero
    ? resolveLocalizedText(hero.primaryCtaLabel, locale, copy.hero.primary)
    : copy.hero.primary;
  const primaryDest = hero?.primaryCtaDestination || "#consultation-dialog";

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

  const formattedHeadline =
    locale === "ar" && !title.startsWith("“") ? `“${title}”` : title;

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
            <span>{subtitle}</span>
            <span className="ed-label-dot" aria-hidden="true">
              ·
            </span>
            <span>{eyebrow}</span>
          </p>
          <span className="ed-red-hero-rule" aria-hidden="true" />
        </div>

        <h1 id="hero-heading" className="ed-red-hero-headline">
          <span className="ed-hero-line-mask">
            <span className="ed-hero-line-reveal hero-line-1">
              {formattedHeadline}
            </span>
          </span>
        </h1>

        <p className="ed-red-hero-lead hero-immersive-lead">{description}</p>

        <div className="ed-red-hero-action-cluster">
          {primaryDest === "#consultation-dialog" ? (
            <ConsultationTriggerButton
              label={primaryLabel}
              topicId="general"
              variant="ivory"
              className="ed-red-hero-cta"
              fallbackHref={whatsappUrl}
            />
          ) : (
            <Link
              href={
                primaryDest.startsWith("/") &&
                !primaryDest.startsWith(`/${locale}`)
                  ? localizePath(locale, primaryDest.replace(/^\//, ""))
                  : primaryDest
              }
              className="btn btn-ivory ed-red-hero-cta"
            >
              <span>{primaryLabel}</span>
            </Link>
          )}
          <span className="ed-red-hero-coord-note">{coordinationNote}</span>
        </div>
      </div>

      {/* Layer 2: Wide Panoramic Editorial Photograph Inset Slightly from Viewport Edges, Extending into Next Section */}
      <div className="ed-red-hero-panoramic-stage">
        <figure className="ed-panoramic-figure">
          <div className="ed-panoramic-mask">
            <img
              src={imageSrc}
              alt={imageAlt}
              width={1408}
              height={768}
              fetchPriority="high"
              loading="eager"
              decoding="async"
              className="ed-panoramic-img"
              style={{
                objectPosition: `${focalPoint.x}% ${focalPoint.y}%`,
              }}
            />
          </div>
          <figcaption className="ed-panoramic-caption">
            <span>{caption}</span>
            <span className="ed-panoramic-caption-note">{editorialNote}</span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
