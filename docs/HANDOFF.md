# Technical & Editorial Handoff — Dr. Malak Alsaif Website (`د. ملاك السيف`)

## 1. Executive Summary
This repository contains the production-ready Arabic-first bilingual (`/ar` RTL default, `/en` LTR) personal medical website for **Dr. Malak Alsaif** (`د. ملاك السيف`), Plastic and Reconstructive Surgery (`جراحة التجميل والترميم`).

In the **Complete Frontend Redesign** (`docs/REDESIGN-SPEC.md`):
1. **Immersive Photographic Hero (`src/components/sections/Hero.tsx`)**:
   - Full-viewport editorial photography (`/images/generated/hero-aesthetic-editorial.jpg`) with warm ivory negative space, architectural crimson linework (`#A83232`), oversized `Elgharib` headline (`“جمال يليق بكِ”`), concise supporting lead, primary consultation dialog trigger, restrained specialty exploration link, and animated scroll cue (`#doctor-section`).
   - Art-directed mobile composition (`< 960px`) with an unobstructed top image frame and a dedicated warm-ivory copy stage below.
2. **Doctor Editorial Introduction (`src/components/sections/AboutPreview.tsx`)**:
   - Asymmetric 12-column editorial spread (`#doctor-section`) establishing Dr. Malak Alsaif's identity immediately below the hero using her real owner-supplied portrait (`public/images/doctor/dr-malak-alsaif.jpg`) in an architectural crimson-accented mat alongside her biography and open numbered credentials ledger (`01`–`03`).
3. **Interactive Split Specialty Explorer (`src/components/sections/Specialties.tsx`)**:
   - Replaced the previous 3-card row with a unified **Interactive Split Visual Explorer** pairing a vertical architectural specialty index (`role="tablist"`: `01 جراحة التجميل`, `02 جراحة الترميم`, `03 جراحة الحروق`) with a large 4:5 photographic & clinical dossier stage (`role="tabpanel"`).
   - Inactive panels enforce `hidden`, `inert`, and `display: none !important` so controls inside inactive panels are never keyboard-focusable.
4. **Scroll-Responsive Consultation Journey (`src/components/sections/ConsultationJourney.tsx`)**:
   - Deep-crimson (`#A83232`) asymmetric section pairing a sticky 3:2 consultation photograph (`consultation-editorial.jpg`) and live step counter (`01 / 03`) with a 3-step vertical sequence (`01 التواصل`, `02 التقييم ومناقشة الاحتياج`, `03 توضيح الخيارات والخطوات التالية`).
5. **Medical Journal Articles Hub & Detail (`src/components/sections/ArticlesPreview.tsx`, `/[locale]/articles`, `/[locale]/articles/[slug]`)**:
   - Editorial journal layout with prominent featured monograph, category filter pills, diacritic-insensitive Arabic search (`src/lib/arabic-search.ts`), localized Arabic reading-time grammar, sticky Table of Contents, and top reading progress bar.
6. **Spacious Typographic FAQ + Distinctive Deep-Red Consultation Closing Section (`src/components/sections/ContactCTA.tsx`)**:
   - Spacious typographic `<details>`/`<summary>` FAQ accordion (`#questions-and-contact`) on warm ivory, followed by a full-bleed deep-crimson (`#A83232`) closing statement (`.closing-red-statement-section`) with large ivory `Elgharib` typography, one clear consultation action (`ConsultationTriggerButton variant="ivory"`), and verified direct channels (`+966 58 037 6463` in explicit LTR and `@dralsaifma`).
7. **All Functional & Accessibility Fixes Preserved**:
   - Synchronous `lang`/`dir` lifecycle updates across client links, direct entry, refresh, and Back/Forward (`src/components/layout/LocaleDocumentSync.tsx`).
   - Continuous Arabic diacritic shaping across `alghraib` display headings and `--font-body` copy/controls.
   - Mobile menu and 2-step Consultation Dialog scroll locking (`document.body.style.overflow = "hidden"`), focus trapping, `Escape` handling, and focus restoration.

---

## 2. Locked Brand Identity & Typography Status

| Element | Locked Specification | Implementation Status |
| :--- | :--- | :--- |
| **Primary Brand Red** | `#A83232` (`--brand-red`) | Enforced across display headings, architectural rules, interactive indicators, primary buttons, the Consultation Journey, and the Deep-Red Closing Section. |
| **Creamy Ivory** | `#FFFCF0` (`--brand-cream`) | Enforced as the dominant editorial canvas (`#FAF5E6` / `#F3ECE0` layered warm ivory surfaces). |
| **Warm Dark Ink** | `#332725` (`--color-ink`) | Enforced for body copy and high-contrast reading legibility. |
| **Display Font (`alghraib`)** | `public/fonts/alghraib/alghraib-*.otf` (weights `100`, `300`, `400`, `500`, `700`) | Wired via `@font-face` in `styles/fonts.css` to `--font-display`. Used on display headings with `letter-spacing: 0`, `word-spacing: 0`, and `font-feature-settings: "dlig" 0, "calt" 0, "liga" 0` so Arabic letters remain continuously connected around diacritics. |
| **Body & UI Font (`STC`)** | Pending owner font binaries (`public/fonts/stc/` is empty) | Honest Arabic-capable fallback (`"Segoe UI", Tahoma, "Geeza Pro", "Noto Naskh Arabic", system-ui, -apple-system, BlinkMacSystemFont, sans-serif`) wired to `--font-body` and inherited by `button, input, select, textarea, optgroup`. **No fake or renamed font files were introduced, and `STC` is not claimed to be installed until licensed `STC` webfont binaries are supplied.** |
| **Logo Treatment** | Typographic lockup (`د. ملاك السيف` / `Dr. Malak Alsaif`) | The reference logo (`brand/logo-reference/logo-reference-with-typo.png`) contains the spelling error `SURGION` and is **never** deployed in production UI or metadata. |

---

## 3. Verification Commands & Automated Test Suites

```bash
# 1. Production build & TypeScript/Next.js route verification
npm run build

# 2. Automated unit regression suite (Arabic search normalization, reading-time grammar, SEO absolute URLs)
npm test

# 3. Automated headless browser verification + multi-viewport screenshot capture (390px, 768px, 1440px)
npm run test:browser
```

---

## 4. Remaining Owner-Supplied Assets & Launch Checklist
1. **Licensed `STC` Webfont Binaries (`.woff2`)**: Place in `public/fonts/stc/`, add `@font-face` declarations in `styles/fonts.css`, and prepend `"STC"` to `--font-body` in `styles/tokens.css`.
2. **Corrected Vector Logo (`.svg`)**: Supply vector artwork with corrected English spelling (`SURGEON`) to replace the interim typographic lockup if desired.
3. **Production Domain & Indexing**: When ready for public launch, set `NEXT_PUBLIC_SITE_URL` (or `siteUrl` in `content/site-config.json`) to the final production domain and set `"previewNoIndex": false` in `content/site-config.json`.
