"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { getCopy } from "@/lib/content";
import { getWhatsAppUrl } from "@/lib/links";
import { Locale } from "@/lib/locales";
import { useCmsSnapshot } from "@/components/cms/CmsSnapshotContext";
import { resolveLocalizedText } from "@/lib/cms/sanitize";

interface ConsultationDialogContextValue {
  openDialog: (initialTopicId?: string, triggerEl?: HTMLElement | null) => void;
  closeDialog: () => void;
}

const ConsultationDialogContext =
  createContext<ConsultationDialogContextValue | null>(null);

export function useConsultationDialog() {
  const ctx = useContext(ConsultationDialogContext);
  return ctx;
}

interface ConsultationDialogProviderProps {
  locale: Locale;
  children: React.ReactNode;
}

export function ConsultationDialogProvider({
  locale,
  children,
}: ConsultationDialogProviderProps) {
  const copy = getCopy(locale);
  const cms = useCmsSnapshot();
  const dialogCopy = copy.consultationDialog;

  const whatsappDigits = cms?.contactSettings.whatsappDigits;
  const defaultGeneralMsg = cms
    ? resolveLocalizedText(
        cms.contactSettings.defaultWhatsappMessage,
        locale,
        dialogCopy.topics[0]?.message ?? ""
      )
    : dialogCopy.topics[0]?.message ?? "";

  const topics = useMemo(() => {
    if (!cms || cms.specialties.length === 0) {
      return dialogCopy.topics;
    }
    const generalTopic = {
      ...dialogCopy.topics[0],
      message: defaultGeneralMsg,
    };
    const specTopics = cms.specialties.map((spec) => ({
      id: spec.slug,
      label: resolveLocalizedText(spec.content.title, locale, spec.slug),
      description: resolveLocalizedText(
        spec.content.introduction,
        locale,
        ""
      ),
      message: resolveLocalizedText(
        spec.content.whatsappMessage,
        locale,
        defaultGeneralMsg
      ),
    }));
    return [generalTopic, ...specTopics];
  }, [cms, dialogCopy.topics, locale, defaultGeneralMsg]);

  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedTopicId, setSelectedTopicId] = useState<string>("general");
  const [draftMessage, setDraftMessage] = useState<string>(
    topics[0]?.message ?? ""
  );

  const lastTriggerRef = useRef<HTMLElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  const openDialog = useCallback(
    (initialTopicId: string = "general", triggerEl?: HTMLElement | null) => {
      if (triggerEl) {
        lastTriggerRef.current = triggerEl;
      } else if (typeof document !== "undefined") {
        lastTriggerRef.current = document.activeElement as HTMLElement | null;
      }

      const matched =
        topics.find((t) => t.id === initialTopicId) ?? topics[0];
      setSelectedTopicId(matched.id);
      setDraftMessage(matched.message);
      setStep(1);
      setIsOpen(true);
    },
    [topics]
  );

  const closeDialog = useCallback(() => {
    setIsOpen(false);
    requestAnimationFrame(() => {
      lastTriggerRef.current?.focus();
    });
  }, []);

  const handleTopicChange = (topicId: string) => {
    setSelectedTopicId(topicId);
    const matched = topics.find((t) => t.id === topicId);
    if (matched) {
      setDraftMessage(matched.message);
    }
  };

  // Focus management, body scroll lock, and Escape + Tab focus trap
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const timer = requestAnimationFrame(() => {
      closeBtnRef.current?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDialog();
        return;
      }

      if (event.key === "Tab" && dialogRef.current) {
        const focusable = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === first) {
            event.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelAnimationFrame(timer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, closeDialog]);

  const encodedWhatsappUrl = getWhatsAppUrl(
    locale,
    draftMessage,
    whatsappDigits
  );
  const directDefaultWhatsappUrl = getWhatsAppUrl(
    locale,
    defaultGeneralMsg,
    whatsappDigits
  );

  return (
    <ConsultationDialogContext.Provider value={{ openDialog, closeDialog }}>
      <div
        className="app-shell-content"
        inert={isOpen ? true : undefined}
        aria-hidden={isOpen ? true : undefined}
      >
        {children}
      </div>

      {isOpen && (
        <div
          className="dialog-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeDialog();
            }
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="consultation-dialog-title"
            className="consultation-dialog"
          >
            <div className="dialog-header">
              <div>
                <div className="eyebrow-row" style={{ marginBlockEnd: "0.35rem" }}>
                  <span className="eyebrow-line" aria-hidden="true" />
                  <span className="eyebrow-text">{dialogCopy.eyebrow}</span>
                  <span className="dialog-step-badge">
                    {dialogCopy.stepIndicator(step, 2)}
                  </span>
                </div>
                <h2 id="consultation-dialog-title" className="dialog-title">
                  {dialogCopy.title}
                </h2>
              </div>

              <button
                ref={closeBtnRef}
                type="button"
                className="dialog-close-btn"
                aria-label={dialogCopy.closeButtonLabel}
                onClick={closeDialog}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M4 4L16 16M16 4L4 16"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="square"
                  />
                </svg>
              </button>
            </div>

            {step === 1 ? (
              <div key="step-1" className="dialog-body dialog-step-panel">
                <h3 className="dialog-step-heading">{dialogCopy.step1Title}</h3>
                <p className="dialog-step-subtitle">
                  {dialogCopy.step1Subtitle}
                </p>

                <div
                  className="dialog-topics-list"
                  role="radiogroup"
                  aria-label={dialogCopy.step1Title}
                >
                  {topics.map((topic) => {
                    const isSelected = selectedTopicId === topic.id;
                    return (
                      <label
                        key={topic.id}
                        className={`dialog-topic-option ${
                          isSelected ? "is-selected" : ""
                        }`.trim()}
                      >
                        <input
                          type="radio"
                          name="consultation-topic"
                          value={topic.id}
                          checked={isSelected}
                          onChange={() => handleTopicChange(topic.id)}
                          className="dialog-topic-radio"
                        />
                        <span className="dialog-topic-content">
                          <span className="dialog-topic-label">
                            {topic.label}
                          </span>
                          <span className="dialog-topic-desc">
                            {topic.description}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>

                <div className="dialog-actions">
                  <button
                    type="button"
                    className="btn btn-primary dialog-primary-btn"
                    onClick={() => setStep(2)}
                  >
                    <span>{dialogCopy.nextButton}</span>
                    <span className="btn-arrow-glyph" aria-hidden="true">
                      {locale === "ar" ? "←" : "→"}
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              <div key="step-2" className="dialog-body dialog-step-panel">
                <h3 className="dialog-step-heading">{dialogCopy.step2Title}</h3>
                <p className="dialog-step-subtitle">
                  {dialogCopy.step2Subtitle}
                </p>

                <div className="dialog-message-box">
                  <label
                    htmlFor="consultation-draft-message"
                    className="dialog-message-label"
                  >
                    {dialogCopy.messageLabel}
                  </label>
                  <textarea
                    id="consultation-draft-message"
                    className="dialog-message-textarea"
                    rows={3}
                    value={draftMessage}
                    onChange={(e) => setDraftMessage(e.target.value)}
                  />
                </div>

                <p className="dialog-privacy-note">
                  {dialogCopy.privacyReminder}
                </p>

                <div className="dialog-actions dialog-actions-split">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setStep(1)}
                  >
                    {dialogCopy.backButton}
                  </button>

                  <a
                    href={encodedWhatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    onClick={closeDialog}
                  >
                    {dialogCopy.continueWhatsappButton}
                  </a>
                </div>
              </div>
            )}

            <div className="dialog-footer">
              <a
                href={directDefaultWhatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="dialog-direct-link"
              >
                <span>{dialogCopy.directWhatsappFallback}</span>
                <span aria-hidden="true">{locale === "ar" ? "↖" : "↗"}</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </ConsultationDialogContext.Provider>
  );
}
