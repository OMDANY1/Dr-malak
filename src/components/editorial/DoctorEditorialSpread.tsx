import React from "react";
import Link from "next/link";
import { getCopy, siteConfig } from "@/lib/content";
import { getInstagramUrl } from "@/lib/links";
import { Locale, localizePath } from "@/lib/locales";
import { Reveal } from "@/components/interactive/Reveal";

interface DoctorEditorialSpreadProps {
  locale: Locale;
}

export function DoctorEditorialSpread({ locale }: DoctorEditorialSpreadProps) {
  const copy = getCopy(locale);
  const aboutHref = localizePath(locale, "about");
  const instagramUrl = getInstagramUrl();
  const portraitSrc = siteConfig.doctorPortrait;

  return (
    <section
      id="doctor-section"
      className="ed-doctor-spread-section"
      aria-labelledby="doctor-spread-heading"
    >
      <div className="ed-container">
        <div className="ed-doctor-spread-grid">
          {/* Part 1: Short Personal Introduction */}
          <Reveal variant="fade-up" className="ed-doctor-spread-intro">
            <div className="ed-eyebrow-cluster">
              <span className="ed-index-num" dir="ltr">
                02
              </span>
              <span className="ed-eyebrow-rule" aria-hidden="true" />
              <span className="ed-eyebrow-label">
                {copy.aboutPreview.eyebrow}
              </span>
            </div>

            <h2 id="doctor-spread-heading" className="ed-doctor-spread-name">
              {copy.aboutPreview.title}
            </h2>

            <p className="ed-doctor-spread-role">
              {siteConfig.subtitle[locale]}
            </p>

            <div className="ed-doctor-rule" aria-hidden="true" />

            <p className="ed-doctor-spread-bio">{copy.aboutPreview.body}</p>

            <div className="ed-doctor-social-row">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ed-inline-arrow-link"
              >
                <span>{copy.aboutPreview.instagramLabel}</span>
                <span className="ltr-inline" dir="ltr">
                  (@dralsaifma)
                </span>
                <span aria-hidden="true">{locale === "ar" ? "↖" : "↗"}</span>
              </a>
            </div>
          </Reveal>

          {/* Part 2: Large Central Doctor Portrait (Real Photograph, Unframed Editorial Presentation) */}
          {portraitSrc && (
            <Reveal
              variant="mask-reveal"
              delayMs={80}
              className="ed-doctor-spread-portrait"
            >
              <figure className="ed-doctor-central-figure">
                <div className="ed-doctor-central-img-wrap">
                  <img
                    src={portraitSrc}
                    alt={copy.hero.portraitAlt}
                    width={1080}
                    height={1080}
                    loading="eager"
                    decoding="async"
                    className="ed-doctor-central-img doctor-editorial-img"
                  />
                </div>
                <figcaption className="ed-doctor-central-caption">
                  <span>{copy.hero.portraitCaption}</span>
                </figcaption>
              </figure>
            </Reveal>
          )}

          {/* Part 3: Verified Qualifications & Full-Profile Link */}
          <Reveal
            variant="fade-up"
            delayMs={150}
            className="ed-doctor-spread-credentials"
          >
            <div className="ed-eyebrow-cluster">
              <span className="ed-eyebrow-rule" aria-hidden="true" />
              <span className="ed-eyebrow-label">
                {copy.credentialsSection.eyebrow}
              </span>
            </div>

            <h3 className="ed-doctor-credentials-heading">
              {copy.credentialsSection.title}
            </h3>

            <ol className="ed-doctor-credentials-list">
              {copy.credentialsSection.items.map((item, idx) => (
                <li key={item.label} className="ed-doctor-credential-item">
                  <span className="ed-credential-num" dir="ltr">
                    0{idx + 1}
                  </span>
                  <div className="ed-credential-content">
                    <span className="ed-credential-label">{item.label}</span>
                    <p className="ed-credential-text">{item.text}</p>
                  </div>
                </li>
              ))}
            </ol>

            <p className="ed-doctor-credentials-note">
              {copy.credentialsSection.note}
            </p>

            <div className="ed-doctor-profile-action">
              <Link href={aboutHref} className="btn btn-primary">
                <span>{copy.aboutPreview.cta}</span>
                <span aria-hidden="true">{locale === "ar" ? "←" : "→"}</span>
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
