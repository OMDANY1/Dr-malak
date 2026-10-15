"use client";

import React, { useEffect, useRef, useState } from "react";
import { getCopy } from "@/lib/content";
import { getWhatsAppUrl } from "@/lib/links";
import { Locale } from "@/lib/locales";
import { Container } from "@/components/ui/Container";
import { ConsultationTriggerButton } from "@/components/interactive/ConsultationTriggerButton";

interface ConsultationJourneyProps {
  locale: Locale;
}

export function ConsultationJourney({ locale }: ConsultationJourneyProps) {
  const copy = getCopy(locale);
  const whatsappUrl = getWhatsAppUrl(locale);
  const steps = copy.journeySection.steps;

  const [activeStep, setActiveStep] = useState(0);
  const stepRefs = useRef<Array<HTMLLIElement | null>>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const elements = stepRefs.current.filter(Boolean) as HTMLLIElement[];
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number(
              (entry.target as HTMLElement).getAttribute("data-step-idx")
            );
            if (!Number.isNaN(idx)) {
              setActiveStep(idx);
            }
          }
        }
      },
      {
        threshold: 0.45,
        rootMargin: "-15% 0px -25% 0px",
      }
    );

    for (const el of elements) {
      observer.observe(el);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const progressPercentage = ((activeStep + 1) / steps.length) * 100;

  return (
    <section
      className="section-red journey-scroll-section"
      aria-labelledby="consultation-journey-heading"
    >
      <Container>
        <div className="journey-progression-layout">
          {/* Editorial Media & Heading Column */}
          <div className="journey-sticky-col">
            <div className="eyebrow-row">
              <span className="journey-edition-num" dir="ltr" aria-hidden="true">
                04
              </span>
              <span className="eyebrow-line" aria-hidden="true" />
              <span className="eyebrow-text">
                {copy.journeySection.eyebrow}
              </span>
            </div>

            <h2
              id="consultation-journey-heading"
              className="journey-main-title"
            >
              {copy.journeySection.title}
            </h2>

            <p className="journey-subtitle">{copy.journeySection.subtitle}</p>

            {/* Large 3:2 Conceptual Consultation Photograph */}
            <figure className="journey-editorial-figure">
              <div className="journey-editorial-img-wrap">
                <img
                  src="/images/generated/consultation-editorial.jpg"
                  alt={
                    locale === "ar"
                      ? "مشهد تعبيري لجلسة استشارة طبية هادئة ومناقشة الخيارات العلاجية"
                      : "Conceptual editorial scene of a calm medical consultation and treatment discussion"
                  }
                  width={1216}
                  height={832}
                  loading="lazy"
                  decoding="async"
                  className="journey-editorial-img"
                />
                <div
                  className="journey-photo-counter"
                  dir="ltr"
                  aria-hidden="true"
                >
                  <span>0{activeStep + 1}</span>
                  <span className="journey-counter-sep">/</span>
                  <span className="journey-counter-total">0{steps.length}</span>
                </div>
              </div>
            </figure>

            <div className="journey-sticky-cta-block">
              <ConsultationTriggerButton
                label={copy.journeySection.cta}
                topicId="general"
                variant="ivory"
                fallbackHref={whatsappUrl}
              />
              <p className="journey-note">{copy.journeySection.note}</p>
            </div>
          </div>

          {/* Open 3-Step Progression Column */}
          <div className="journey-steps-col">
            <div className="journey-timeline-track" aria-hidden="true">
              <div
                className="journey-timeline-fill"
                style={{ height: `${progressPercentage}%` }}
              />
            </div>

            <ol className="journey-sequence-list">
              {steps.map((step, idx) => {
                const isCurrent = idx === activeStep;
                const isCompleted = idx <= activeStep;
                return (
                  <li
                    key={step.number}
                    ref={(el) => {
                      stepRefs.current[idx] = el;
                    }}
                    data-step-idx={idx}
                    className={`journey-sequence-item ${
                      isCurrent ? "is-current" : ""
                    } ${isCompleted ? "is-reached" : ""}`.trim()}
                    onClick={() => setActiveStep(idx)}
                  >
                    <span className="journey-sequence-node" aria-hidden="true" />
                    <div className="journey-sequence-open-row">
                      <div className="journey-sequence-top">
                        <span className="journey-step-number" dir="ltr">
                          {step.number}
                        </span>
                        <span
                          className="journey-sequence-line"
                          aria-hidden="true"
                        />
                      </div>
                      <h3 className="journey-step-title">{step.title}</h3>
                      <p className="journey-step-desc">{step.description}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </Container>
    </section>
  );
}
