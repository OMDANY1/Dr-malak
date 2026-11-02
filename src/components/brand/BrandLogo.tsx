import React from "react";
import {
  DOCTOR_NAME_PATHS,
  LOGO_VIEWBOX,
  MALAK_MARK_PATHS,
  SPARKLE_ACCENT_PATH,
  SUBTITLE_PATHS,
} from "./logo-vectors";

export interface BrandLogoProps {
  /**
   * "on-dark" uses the supplied reversed white artwork (#FFFFFF) + #FF4FA3 accent.
   * "on-light" uses the approved light-background PDF treatment (#A83232 mark + #3A1F1B text + #FF4FA3 accent).
   */
  variant?: "on-dark" | "on-light";
  locale?: "ar" | "en";
  className?: string;
  idPrefix?: string;
}

export function BrandLogo({
  variant = "on-dark",
  locale = "ar",
  className = "",
  idPrefix = "brand-logo",
}: BrandLogoProps) {
  const isLightSurface = variant === "on-light";
  const markFill = isLightSurface ? "#A83232" : "#FFFFFF";
  const textFill = isLightSurface ? "#3A1F1B" : "#FFFFFF";
  const sparkleFill = "#FF4FA3";

  const accessibleTitle =
    locale === "ar"
      ? "د. ملاك السيف — استشارية جراحة التجميل والترميم"
      : "Dr. Malak Alsaif — Consultant Plastic & Reconstructive Surgeon";

  const titleId = `${idPrefix}-title`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={LOGO_VIEWBOX}
      fill="none"
      role="img"
      aria-labelledby={titleId}
      className={`ed-brand-logo-svg ed-brand-logo-svg--${variant} ${className}`.trim()}
      data-brand-logo-variant={variant}
    >
      <title id={titleId}>{accessibleTitle}</title>
      <g className="ed-brand-logo-svg__mark" fill={markFill}>
        {MALAK_MARK_PATHS.map((d, index) => (
          <path key={`mark-${index}`} d={d} />
        ))}
      </g>
      <g className="ed-brand-logo-svg__wordmark" fill={textFill}>
        {DOCTOR_NAME_PATHS.map((d, index) => (
          <path key={`word-${index}`} d={d} />
        ))}
      </g>
      <g className="ed-brand-logo-svg__subtitle" fill={textFill}>
        {SUBTITLE_PATHS.map((d, index) => (
          <path key={`sub-${index}`} d={d} />
        ))}
      </g>
      <path
        className="ed-brand-logo-svg__sparkle"
        d={SPARKLE_ACCENT_PATH}
        fill={sparkleFill}
      />
    </svg>
  );
}
