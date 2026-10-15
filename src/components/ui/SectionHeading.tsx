import React from "react";

interface SectionHeadingProps {
  id?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  as?: "h1" | "h2" | "h3";
  className?: string;
  showRule?: boolean;
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  subtitle,
  as: HeadingTag = "h2",
  className = "",
  showRule = true,
}: SectionHeadingProps) {
  return (
    <div className={`section-heading-block ${className}`.trim()}>
      {eyebrow && (
        <div className="eyebrow-row">
          <span className="eyebrow-line" aria-hidden="true" />
          <span className="eyebrow-text">{eyebrow}</span>
        </div>
      )}
      <HeadingTag id={id} className="section-title">
        {title}
      </HeadingTag>
      {showRule && <div className="section-Rule" aria-hidden="true" />}
      {subtitle && <p className="section-subtitle">{subtitle}</p>}
    </div>
  );
}
