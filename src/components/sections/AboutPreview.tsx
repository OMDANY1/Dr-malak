import React from "react";
import { getCopy, siteConfig } from "@/lib/content";
import { getInstagramUrl } from "@/lib/links";
import { Locale, localizePath } from "@/lib/locales";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/interactive/Reveal";

interface AboutPreviewProps {
  locale: Locale;
}

export function AboutPreview({ locale }: AboutPreviewProps) {
  const copy = getCopy(locale);
  const aboutHref = localizePath(locale, "about");
  const instagramUrl = getInstagramUrl();
  const portraitSrc = siteConfig.doctorPortrait;

  return (
    <section
      id="doctor-section"
      className="doctor-editorial-section"
      aria-labelledby="about-preview-heading"
    >
      <Container>
        <div className="doctor-asymmetric-grid">
          {/* Architectural Editorial Portrait Presentation */}
          <Reveal variant="mask-reveal" className="doctor-portrait-column">
            {portraitSrc && (
              <figure className="doctor-editorial-figure">
                <div className="doctor-editorial-mat">
                  <span
                    className="doctor-architectural-corner"
                    aria-hidden="true"
                  />
                  <div className="doctor-editorial-img-wrap">
                    <img
                      src={portraitSrc}
                      alt={copy.hero.portraitAlt}
                      width={1080}
                      height={1080}
                      loading="lazy"
                      decoding="async"
                      className="doctor-editorial-img"
                    />
                  </div>
                </div>
                <figcaption className="doctor-editorial-caption">
                  <span className="doctor-caption-index" dir="ltr">
                    02
                  </span>
                  <span className="eyebrow-line" aria-hidden="true" />
                  <span>{copy.hero.portraitCaption}</span>
                </figcaption>
              </figure>
            )}
          </Reveal>

          {/* Editorial Biography & Open Verified Credentials Points */}
          <Reveal
            variant="fade-up"
            delayMs={120}
            className="doctor-content-column"
          >
            <div className="eyebrow-row">
              <span className="doctor-section-num" dir="ltr" aria-hidden="true">
                02
              </span>
              <span className="eyebrow-line" aria-hidden="true" />
              <span className="eyebrow-text">{copy.aboutPreview.eyebrow}</span>
            </div>

            <h2 id="about-preview-heading" className="doctor-display-name">
              {copy.aboutPreview.title}
            </h2>

            <p className="doctor-display-subtitle">{copy.hero.subtitle}</p>

            <p className="about-preview-lead">{copy.aboutPreview.body}</p>

            {/* Clean, open editorial points — no nested box */}
            <div className="doctor-credentials-ledger">
              <span className="doctor-ledger-heading">
                {copy.credentialsSection.eyebrow}
              </span>
              <ol
                className="doctor-open-credentials"
                aria-label={copy.credentialsSection.title}
              >
                {copy.credentialsSection.items.map((item, idx) => (
                  <li key={item.label} className="doctor-open-credential-point">
                    <span className="doctor-point-num" dir="ltr">
                      0{idx + 1}
                    </span>
                    <div className="doctor-point-body">
                      <span className="doctor-point-label">{item.label}</span>
                      <p className="doctor-point-text">{item.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="about-preview-actions">
              <Button href={aboutHref} variant="secondary">
                <span>{copy.aboutPreview.cta}</span>
                <span className="btn-arrow-glyph" aria-hidden="true">
                  {locale === "ar" ? "←" : "→"}
                </span>
              </Button>

              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="instagram-editorial-link editorial-underline-link"
              >
                <span>{copy.aboutPreview.instagramLabel}</span>
                <span className="ltr-inline" dir="ltr">
                  (@dralsaifma)
                </span>
                <span className="btn-arrow-glyph" aria-hidden="true">
                  {locale === "ar" ? "↖" : "↗"}
                </span>
              </a>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
