import React from "react";
import { headers } from "next/headers";
import { getCopy } from "@/lib/content";
import { Locale } from "@/lib/locales";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

export default async function LocaleNotFound() {
  const headersList = await headers();
  const headerLocale = headersList.get("x-locale");
  const locale: Locale = headerLocale === "en" ? "en" : "ar";
  const copy = getCopy(locale);

  return (
    <section className="page-section" aria-labelledby="not-found-heading">
      <Container>
        <div style={{ maxWidth: "42rem", paddingBlock: "2rem" }}>
          <div className="eyebrow-row">
            <span className="eyebrow-line" aria-hidden="true" />
            <span className="eyebrow-text">{copy.notFound.eyebrow}</span>
          </div>
          <h1 id="not-found-heading" className="page-hero-title">
            {copy.notFound.title}
          </h1>
          <p className="page-hero-lead" style={{ marginBlockEnd: "2rem" }}>
            {copy.notFound.body}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
            <Button
              href={locale === "ar" ? "/ar" : "/en"}
              variant="primary"
            >
              {locale === "ar"
                ? copy.notFound.backHomeAr
                : copy.notFound.backHomeEn}
            </Button>
            <Button
              href={locale === "ar" ? "/en" : "/ar"}
              variant="secondary"
            >
              {locale === "ar"
                ? copy.notFound.backHomeEn
                : copy.notFound.backHomeAr}
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
