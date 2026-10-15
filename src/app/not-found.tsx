import React from "react";
import { headers } from "next/headers";
import { getCopy } from "@/lib/content";
import { Locale } from "@/lib/locales";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

export default async function GlobalNotFound() {
  const headersList = await headers();
  const headerLocale = headersList.get("x-locale");
  const locale: Locale = headerLocale === "en" ? "en" : "ar";
  const copy = getCopy(locale);

  return (
    <>
      <Header locale={locale} />
      <main id="main-content" className="page-section">
        <Container>
          <div style={{ maxWidth: "42rem", paddingBlock: "2rem" }}>
            <div className="eyebrow-row">
              <span className="eyebrow-line" aria-hidden="true" />
              <span className="eyebrow-text">{copy.notFound.eyebrow}</span>
            </div>
            <h1 className="page-hero-title">{copy.notFound.title}</h1>
            <p className="page-hero-lead" style={{ marginBlockEnd: "2rem" }}>
              {copy.notFound.body}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
              <Button href="/ar" variant="primary">
                {copy.notFound.backHomeAr}
              </Button>
              <Button href="/en" variant="secondary">
                {copy.notFound.backHomeEn}
              </Button>
            </div>
          </div>
        </Container>
      </main>
      <Footer locale={locale} />
    </>
  );
}
