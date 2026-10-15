import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidLocale } from "@/lib/locales";
import { Container } from "@/components/ui/Container";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export const metadata: Metadata = {
  title: "Arabic Typography & Shaping Fixture | Dr. Malak Alsaif",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

const FIXTURE_SAMPLES = [
  {
    id: "hero-headline",
    label: "1. Hero Display Headline & Kasrah on Kaa (جمال يليق بكِ)",
    phrase: "جمال يليق بكِ",
    context: "تعرّفي على د. ملاك السيف ومجالات جراحة التجميل والترميم.",
  },
  {
    id: "tashkeel-comparison",
    label: "2. Bare vs. Fully Vocalized Tashkeel (استشارة / اِسْتِشَارَة)",
    phrase: "استشارة / اِسْتِشَارَة",
    context:
      "مقارنة اتجاه الحروف واتصالها في كلمة استشارة بدون تشكيل ومع التشكيل الكامل (اِسْتِشَارَة) في العناوين والنصوص والأزرار.",
  },
  {
    id: "specialty-title",
    label: "3. Core Practice Title (جراحة التجميل والترميم)",
    phrase: "جراحة التجميل والترميم",
    context:
      "تتركز الممارسة الطبية في ثلاثة مجالات رئيسية ضمن تخصص جراحة التجميل والترميم، وتُناقش الخيارات الملائمة بعد الفحص والتقييم الفردي المباشر.",
  },
  {
    id: "skin-care",
    label: "4. Medial & Final Connections (العناية بالبشرة)",
    phrase: "العناية بالبشرة",
    context:
      "العناية بالبشرة والأنسجة وفق تقييم سريري فردي يراعي الناحيتين الوظيفية والجمالية.",
  },
  {
    id: "shadda-tanween-lamalef-digits",
    label:
      "5. Shadda, Tanween, Lam-Alef & Mixed Digits (شدّة، تنوينًا، لام ألف، أرقام ١٢٣ و123)",
    phrase: "شدّة، تنوينًا، لام ألف، أرقام ١٢٣ و123",
    context:
      "تُحدَّد الخطة العلاجية تقييمًا دقيقًا لكل مراجِعة، مع إيضاح الخطوات ١٢٣ و123 وهاتف التنسيق +966 58 037 6463.",
  },
];

export default async function TypographyFixturePage({ params }: PageProps) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  return (
    <section
      className="page-section"
      aria-labelledby="typography-fixture-heading"
      data-testid="typography-fixture"
    >
      <Container>
        <div className="eyebrow-row">
          <span className="eyebrow-line" aria-hidden="true" />
          <span className="eyebrow-text" dir="ltr">
            INTERNAL QA FIXTURE · ARABIC SHAPING & DIACRITICS
          </span>
        </div>

        <h1 id="typography-fixture-heading" className="page-hero-title">
          اختبار اتصال الحروف العربية والتشكيل — جمال يليق بكِ
        </h1>
        <div className="section-Rule" aria-hidden="true" />
        <p className="page-hero-lead" style={{ marginBlockEnd: "2rem" }}>
          نموذج فحص داخلي للتحقق من سلامة اتصال الحروف العربية مع الحركات
          والتشكيل في خط العناوين (<code>alghraib</code>) وخط النصوص والأزرار (
          <code>--font-body</code>).
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "1.5rem",
          }}
        >
          {FIXTURE_SAMPLES.map((sample) => (
            <article
              key={sample.id}
              data-fixture-id={sample.id}
              style={{
                padding: "1.5rem",
                backgroundColor: "var(--surface-ivory-elevated)",
                border: "1px solid var(--color-border)",
                borderBlockStart: "2px solid var(--brand-red)",
              }}
            >
              <div
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "var(--color-ink-muted)",
                  marginBlockEnd: "0.65rem",
                }}
                dir="ltr"
              >
                {sample.label}
              </div>

              {/* Display font (alghraib Bold 700) */}
              <h2
                className="fixture-display-sample"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(1.75rem, 3vw, 2.4rem)",
                  fontWeight: 700,
                  color: "var(--brand-red)",
                  marginBlockEnd: "0.5rem",
                }}
              >
                {sample.phrase}
              </h2>

              {/* Body font (--font-body Regular/Semibold) */}
              <p
                className="fixture-body-sample"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "1.125rem",
                  lineHeight: 1.8,
                  color: "var(--color-ink)",
                  marginBlockEnd: "0.5rem",
                }}
              >
                <strong>نص العبارة:</strong> {sample.phrase}
              </p>

              <p
                className="fixture-context-sample"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "1.02rem",
                  lineHeight: 1.75,
                  color: "var(--color-ink-muted)",
                  marginBlockEnd: "0.85rem",
                }}
              >
                {sample.context}
              </p>

              {/* Interactive Button Control Sample (verifying button font inheritance) */}
              <button
                type="button"
                className="btn btn-secondary fixture-button-sample"
              >
                <span>زر تفاعلي: {sample.phrase}</span>
              </button>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
