"use client";

import React from "react";
import Link from "next/link";
import { getCopy, siteConfig } from "@/lib/content";
import { getInstagramUrl } from "@/lib/links";
import { Locale, localizePath } from "@/lib/locales";
import { Reveal } from "@/components/interactive/Reveal";
import { useCmsSnapshot } from "@/components/cms/CmsSnapshotContext";
import { resolveLocalizedText } from "@/lib/cms/sanitize";

interface DoctorEditorialSpreadProps {
  locale: Locale;
}

export function DoctorEditorialSpread({ locale }: DoctorEditorialSpreadProps) {
  const copy = getCopy(locale);
  const cms = useCmsSnapshot();
  const aboutHref = localizePath(locale, "about");
  const instagramUrl = getInstagramUrl(cms?.contactSettings.instagramUrl);
  const instagramHandle = cms?.contactSettings.instagramHandle || "@dralsaifma";

  const sectionConfig = cms?.homepage.sections.find((s) => s.id === "doctor");
  const dp = cms?.doctorProfile;

  const eyebrow = sectionConfig
    ? resolveLocalizedText(
        sectionConfig.eyebrow,
        locale,
        copy.aboutPreview.eyebrow
      )
    : copy.aboutPreview.eyebrow;
  const doctorName = dp
    ? resolveLocalizedText(dp.fullName, locale, copy.aboutPreview.title)
    : copy.aboutPreview.title;
  const specialtyTitle = dp
    ? resolveLocalizedText(dp.specialtyTitle, locale, siteConfig.subtitle[locale])
    : siteConfig.subtitle[locale];
  const shortBio = dp
    ? resolveLocalizedText(dp.shortBio, locale, copy.aboutPreview.body)
    : copy.aboutPreview.body;
  const portraitSrc = dp?.portraitImage || siteConfig.doctorPortrait;
  const portraitAlt = dp
    ? resolveLocalizedText(dp.portraitAlt, locale, copy.hero.portraitAlt)
    : copy.hero.portraitAlt;
  const portraitCaption = dp
    ? resolveLocalizedText(dp.portraitCaption, locale, copy.hero.portraitCaption)
    : copy.hero.portraitCaption;
  const portraitFocal = dp?.portraitFocalPoint ?? { x: 50, y: 28 };

  const credsEyebrow = dp
    ? resolveLocalizedText(
        dp.credentialsEyebrow,
        locale,
        copy.credentialsSection.eyebrow
      )
    : copy.credentialsSection.eyebrow;
  const credsHeading = dp
    ? resolveLocalizedText(
        dp.credentialsHeading,
        locale,
        copy.credentialsSection.title
      )
    : copy.credentialsSection.title;
  const credsNote = dp
    ? resolveLocalizedText(
        dp.credentialsNote,
        locale,
        copy.credentialsSection.note
      )
    : copy.credentialsSection.note;

  const credentialsList = dp
    ? dp.credentials.map((c) => ({
        label: resolveLocalizedText(c.label, locale, ""),
        text: resolveLocalizedText(c.text, locale, ""),
      }))
    : copy.credentialsSection.items;

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
              <span className="ed-eyebrow-label">{eyebrow}</span>
            </div>

            <h2 id="doctor-spread-heading" className="ed-doctor-spread-name">
              {doctorName}
            </h2>

            <p className="ed-doctor-spread-role">{specialtyTitle}</p>

            <div className="ed-doctor-rule" aria-hidden="true" />

            <p className="ed-doctor-spread-bio">{shortBio}</p>

            <div className="ed-doctor-social-row">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ed-inline-arrow-link"
              >
                <span>{copy.aboutPreview.instagramLabel}</span>
                <span className="ltr-inline" dir="ltr">
                  ({instagramHandle})
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
                    alt={portraitAlt}
                    width={1080}
                    height={1080}
                    loading="eager"
                    decoding="async"
                    className="ed-doctor-central-img doctor-editorial-img"
                    style={{
                      objectPosition: `${portraitFocal.x}% ${portraitFocal.y}%`,
                    }}
                  />
                </div>
                <figcaption className="ed-doctor-central-caption">
                  <span>{portraitCaption}</span>
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
              <span className="ed-eyebrow-label">{credsEyebrow}</span>
            </div>

            <h3 className="ed-doctor-credentials-heading">{credsHeading}</h3>

            <ol className="ed-doctor-credentials-list">
              {credentialsList.map((item, idx) => (
                <li
                  key={`${item.label}-${idx}`}
                  className="ed-doctor-credential-item"
                >
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

            <p className="ed-doctor-credentials-note">{credsNote}</p>

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
