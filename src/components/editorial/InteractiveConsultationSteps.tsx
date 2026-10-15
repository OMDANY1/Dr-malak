"use client";

import React, { useState, useRef } from "react";
import { getCopy } from "@/lib/content";
import { getWhatsAppUrl } from "@/lib/links";
import { Locale } from "@/lib/locales";
import { ConsultationTriggerButton } from "@/components/interactive/ConsultationTriggerButton";
import { Reveal } from "@/components/interactive/Reveal";

interface InteractiveConsultationStepsProps {
  locale: Locale;
}

export function InteractiveConsultationSteps({
  locale,
}: InteractiveConsultationStepsProps) {
  const copy = getCopy(locale);
  const steps = copy.journeySection.steps;
  const whatsappUrl = getWhatsAppUrl(locale);

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const stepBtnRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const activeStep = steps[activeIndex] ?? steps[0];

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    idx: number
  ) => {
    const isRtl = locale === "ar";
    const nextKey = isRtl ? "ArrowLeft" : "ArrowRight";
    const prevKey = isRtl ? "ArrowRight" : "ArrowLeft";

    let targetIdx: number | null = null;
    if (event.key === nextKey || event.key === "ArrowDown") {
      targetIdx = (idx + 1) % steps.length;
    } else if (event.key === prevKey || event.key === "ArrowUp") {
      targetIdx = (idx - 1 + steps.length) % steps.length;
    } else if (event.key === "Home") {
      targetIdx = 0;
    } else if (event.key === "End") {
      targetIdx = steps.length - 1;
    }

    if (targetIdx !== null) {
      event.preventDefault();
      setActiveIndex(targetIdx);
      stepBtnRefs.current[targetIdx]?.focus();
    }
  };

  return (
    <section
      id="consultation-steps-section"
      className="ed-steps-section"
      aria-labelledby="consultation-steps-heading"
    >
      <div className="ed-container">
        <Reveal variant="fade-up" className="ed-steps-contained-module">
          {/* Module Header */}
          <div className="ed-steps-module-header">
            <div className="ed-steps-header-main">
              <div className="ed-eyebrow-cluster">
                <span className="ed-index-num" dir="ltr">
                  03
                </span>
                <span className="ed-eyebrow-rule" aria-hidden="true" />
                <span className="ed-eyebrow-label">
                  {copy.journeySection.eyebrow}
                </span>
              </div>

              <h2
                id="consultation-steps-heading"
                className="ed-section-title"
              >
                {copy.journeySection.title}
              </h2>
            </div>

            <p className="ed-steps-header-subtitle">
              {copy.journeySection.subtitle}
            </p>
          </div>

          {/* Three Numbered Step Controls (Understandable with or without animation) */}
          <div
            className="ed-steps-controls-bar"
            role="tablist"
            aria-label={copy.journeySection.title}
          >
            {steps.map((step, idx) => {
              const isSelected = idx === activeIndex;
              return (
                <button
                  key={step.number}
                  ref={(el) => {
                    stepBtnRefs.current[idx] = el;
                  }}
                  type="button"
                  id={`consultation-step-tab-${step.number}`}
                  role="tab"
                  aria-selected={isSelected}
                  aria-controls={`consultation-step-panel-${step.number}`}
                  tabIndex={isSelected ? 0 : -1}
                  className={`ed-step-control-btn ${
                    isSelected ? "is-active" : ""
                  }`.trim()}
                  onClick={() => setActiveIndex(idx)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                >
                  <div className="ed-step-control-top">
                    <span className="ed-step-control-num" dir="ltr">
                      {step.number}
                    </span>
                    <span className="ed-step-control-title">{step.title}</span>
                  </div>
                  <span className="ed-step-control-preview">
                    {step.description}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Step Stage: Explanatory Copy + Supporting Image */}
          <div
            id={`consultation-step-panel-${activeStep.number}`}
            role="tabpanel"
            aria-labelledby={`consultation-step-tab-${activeStep.number}`}
            className="ed-steps-active-stage"
          >
            <div className="ed-steps-stage-copy">
              <div className="ed-steps-stage-badge-row">
                <span className="ed-steps-live-counter" dir="ltr">
                  {activeStep.number} / 0{steps.length}
                </span>
                <span className="ed-eyebrow-rule" aria-hidden="true" />
                <span className="ed-eyebrow-label">
                  {copy.journeySection.eyebrow}
                </span>
              </div>

              <h3 className="ed-steps-stage-title">{activeStep.title}</h3>

              <p className="ed-steps-stage-description">
                {activeStep.description}
              </p>

              <p className="ed-steps-stage-note">{copy.journeySection.note}</p>

              <div className="ed-steps-stage-actions">
                <ConsultationTriggerButton
                  label={copy.journeySection.cta}
                  topicId="general"
                  variant="primary"
                  fallbackHref={whatsappUrl}
                />

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ed-inline-arrow-link"
                >
                  <span>{copy.hero.directWhatsappLabel}</span>
                  <span aria-hidden="true">
                    {locale === "ar" ? "↖" : "↗"}
                  </span>
                </a>
              </div>
            </div>

            <div className="ed-steps-stage-media">
              <figure className="ed-steps-stage-figure">
                <div className="ed-steps-stage-img-wrap">
                  <img
                    key={activeStep.image}
                    src={activeStep.image}
                    alt={activeStep.imageAlt}
                    width={960}
                    height={720}
                    loading="eager"
                    decoding="async"
                    className="ed-steps-stage-img"
                  />
                </div>
                <figcaption className="ed-steps-stage-caption">
                  {activeStep.caption}
                </figcaption>
              </figure>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
