import React from "react";
import { getCopy } from "@/lib/content";
import { Locale } from "@/lib/locales";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/interactive/Reveal";

interface FAQProps {
  locale: Locale;
}

export function FAQ({ locale }: FAQProps) {
  const copy = getCopy(locale);

  return (
    <section className="faq-section" aria-labelledby="faq-heading">
      <Container>
        <div className="faq-layout">
          <Reveal variant="fade-up">
            <div>
              <SectionHeading
                eyebrow={copy.faqSection.eyebrow}
                title={copy.faqSection.title}
                subtitle={copy.faqSection.intro}
              />
            </div>
          </Reveal>

          <Reveal variant="fade-up" delayMs={100}>
            <div className="faq-list" id="faq-heading">
              {copy.faqSection.items.map((item, index) => (
                <details
                  key={item.q}
                  className="faq-item"
                  open={index === 0}
                >
                  <summary className="faq-summary">
                    <span className="faq-summary-text">
                      <span className="faq-num ltr-inline" dir="ltr">
                        0{index + 1}
                      </span>
                      <span>{item.q}</span>
                    </span>
                    <svg
                      className="faq-icon"
                      viewBox="0 0 20 20"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M10 3V17M3 10H17"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="square"
                      />
                    </svg>
                  </summary>
                  <div className="faq-answer">
                    <p>{item.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
