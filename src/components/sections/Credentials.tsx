import React from "react";
import { getCopy } from "@/lib/content";
import { Locale } from "@/lib/locales";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/interactive/Reveal";

interface CredentialsProps {
  locale: Locale;
}

export function Credentials({ locale }: CredentialsProps) {
  const copy = getCopy(locale);

  return (
    <section
      className="credentials-section"
      aria-labelledby="credentials-heading"
    >
      <Container>
        <Reveal variant="fade-up">
          <div className="credentials-header">
            <div>
              <div className="eyebrow-row" style={{ marginBlockEnd: "0.4rem" }}>
                <span className="eyebrow-line" aria-hidden="true" />
                <span className="eyebrow-text">
                  {copy.credentialsSection.eyebrow}
                </span>
              </div>
              <h2
                id="credentials-heading"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(1.65rem, 2.8vw, 2.25rem)",
                  color: "var(--brand-red)",
                }}
              >
                {copy.credentialsSection.title}
              </h2>
            </div>
          </div>

          <ol className="credentials-grid">
            {copy.credentialsSection.items.map((item, idx) => (
              <li key={item.label} className="credential-item">
                <div className="credential-top-row">
                  <span className="credential-index" dir="ltr">
                    0{idx + 1}
                  </span>
                  <span className="credential-label">{item.label}</span>
                </div>
                <p className="credential-text">{item.text}</p>
              </li>
            ))}
          </ol>

          <p className="credentials-footnote">{copy.credentialsSection.note}</p>
        </Reveal>
      </Container>
    </section>
  );
}
