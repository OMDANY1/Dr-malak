# Technical & Editorial Handoff — Dr. Malak Alsaif Website (`د. ملاك السيف`)

## 1. Executive Summary
This repository contains the production-ready Arabic-first bilingual (`/ar` RTL default, `/en` LTR) personal medical website for **Dr. Malak Alsaif** (`د. ملاك السيف`), Plastic and Reconstructive Surgery (`جراحة التجميل والترميم`).

In the **New Arabic Editorial Frontend** (`docs/REDESIGN-SPEC.md`), the presentation layer was rebuilt from the ground up with new page-composition components (`src/components/editorial/*`) and scoped styles (`--ed-*` tokens and `.ed-*` classes) while preserving all approved factual copy, routes, localization, 2-step consultation dialog logic, and technical fixes:

1. **Minimal Navigation (`src/components/editorial/MinimalNav.tsx`)**:
   - Replaced the horizontal navigation bar with a minimal editorial header featuring the brand identity lockup (`د. ملاك السيف`), language switcher (`EN` / `عربي`), consultation trigger button, and a clearly labeled menu button (`القائمة` / `Menu`).
   - Clicking the menu button opens a full-screen deep-red overlay (`#ed-fullscreen-menu-panel`) with large numbered page links (`01`–`06`) and a dedicated contact coordination column, supporting keyboard navigation, `Escape`, focus trapping, scroll lock, and focus restoration.
2. **Typographic Red Hero (`src/components/editorial/TypographicRedHero.tsx`)**:
   - Removed the old model-left/text-right two-column hero.
   - Built a vertically layered deep-brand-red (`#A83232`) opening canvas with ivory typography: specialty label (`جراحة التجميل والترميم · جراحة الحروق`) → large deliberately typeset `Elgharib` headline (`“جمال يليق بكِ”`) → concise supporting sentence & consultation action → wide panoramic editorial photograph (`/images/generated/hero-panoramic-editorial.jpg`) inset slightly from the viewport edges and extending visually into the warm ivory section below.
   - Includes whole-line headline entrance, simple image mask reveal, and subtle scroll-linked image scale (`1` → `1.042`) with full `prefers-reduced-motion` support and zero intro loader delay.
3. **Visual Specialty Gallery (`src/components/editorial/SpecialtyGallery.tsx`)**:
   - Replaced the old specialty tabs and three identical cards with a warm ivory (`#FFFCF0`) asymmetric photographic gallery: 1 dominant tall `3:4` frame (`01 جراحة التجميل`) paired with 2 staggered supporting frames at different sizes and vertical positions (`02 جراحة الترميم` `4:3` and `03 جراحة الحروق` `16:10`), with integrated specialty names, short descriptions, and normal navigation fallback links.
   - Selecting any specialty opens an accessible modal detail sheet (`#ed-specialty-detail-panel`) with a concise introduction, visible close button, keyboard focus trap + `Escape` support, consultation trigger, and full-page link.
4. **Doctor Profile as an Editorial Spread (`src/components/editorial/DoctorEditorialSpread.tsx`)**:
   - Three-part desktop composition (`3.8fr : 4.4fr : 3.8fr`): short personal introduction → large central unframed real doctor portrait (`public/images/doctor/dr-malak-alsaif.jpg`) → numbered verified qualifications (`01`–`03`) and full-profile link, with a clean sequential mobile layout and no gray portrait card or decorative fabric backdrop.
5. **Interactive Consultation Steps (`src/components/editorial/InteractiveConsultationSteps.tsx`)**:
   - Replaced the oversized red vertical timeline with a contained warm-alabaster visual module (`#consultation-steps-section`) featuring 3 numbered step controls (`01 التواصل`, `02 التقييم ومناقشة الاحتياج`, `03 توضيح الخيارات والخطوات التالية`).
   - Selecting a step updates the active explanatory copy and supporting still-life photograph (`article-questions-to-discuss.jpg`, `article-consultation-prep.jpg`, `step-03-options.jpg`) while keeping all three steps readable without animation.
6. **Editorial Journal (`src/components/editorial/EditorialJournal.tsx`)**:
   - Intentionally designed around the published featured monograph (`preparing-for-consultation`) with a large `16:9` cover, category badge, localized Arabic reading time, chapter preview index (`01`–`04`), and automatic support for a typographic list when additional published articles become available.
7. **Compact FAQ, Spacious Ivory Booking Section & Deep-Red Footer (`src/components/editorial/FaqAndBooking.tsx`, `src/components/editorial/EditorialFooter.tsx`)**:
   - Compact accessible `<details>`/`<summary>` FAQ (`#questions-and-contact`), followed by a spacious warm-ivory booking section (`.ed-ivory-booking-section`) with large `#A83232` `Elgharib` typography, one primary consultation action, and a secondary telephone link (`+966 58 037 6463`), finishing with a redesigned deep-red footer (`.ed-red-footer`).
8. **Cohesive Inner Pages**:
   - Carried the same visual language (deep-red editorial masthead, asymmetric editorial layouts, contained consultation steps, spacious ivory booking section, and deep-red footer) across `/[locale]/about`, `/[locale]/specialties`, `/[locale]/articles`, `/[locale]/articles/[slug]`, `/[locale]/contact`, and `/[locale]/privacy`.

---

## 2. Locked Brand Identity & Typography Status

| Element | Locked Specification | Implementation Status |
| :--- | :--- | :--- |
| **Primary Brand Red** | `#A83232` (`--brand-red`, `--ed-red`) | Enforced on the Typographic Red Hero, Full-Screen Menu, inner page mastheads, primary actions, and Deep-Red Footer. |
| **Creamy Ivory** | `#FFFCF0` (`--brand-cream`, `--ed-ivory`) | Enforced across the Visual Specialty Gallery, Doctor Spread, Editorial Journal, Spacious Ivory Booking Section, and inner page canvases. |
| **Warm Dark Ink** | `#332725` (`--color-ink`, `--ed-ink`) | Enforced for body copy and high-contrast reading legibility. |
| **Display Font (`alghraib`)** | `public/fonts/alghraib/alghraib-*.otf` (weights `100`, `300`, `400`, `500`, `700`) | Wired via `@font-face` in `styles/fonts.css` to `--font-display`. Used on display headings with `letter-spacing: 0`, `word-spacing: 0`, and `font-feature-settings: "dlig" 0, "calt" 0, "liga" 0` so Arabic letters remain continuously connected around diacritics. |
| **Body & UI Font (`STC`)** | Pending owner font binaries (`public/fonts/stc/` is empty) | Honest Arabic-capable fallback (`"Segoe UI", Tahoma, "Geeza Pro", "Noto Naskh Arabic", system-ui, -apple-system, BlinkMacSystemFont, sans-serif`) wired to `--font-body` and inherited by `button, input, select, textarea, optgroup`. **No fake or renamed font files were introduced, and final `STC` typography fidelity is not claimed until licensed `STC` webfont binaries are supplied.** |
| **Logo Treatment** | Typographic lockup (`د. ملاك السيف` / `Dr. Malak Alsaif`) | The reference logo (`brand/logo-reference/logo-reference-with-typo.png`) contains the spelling error `SURGION` and is **never** deployed in production UI or metadata. |

---

## 3. Verification Commands & Automated Test Suites

```bash
# 1. Production build & TypeScript/Next.js route verification
npm run build

# 2. Automated unit regression suite (Arabic search normalization, reading-time grammar, SEO absolute URLs)
npm test

# 3. Automated headless browser verification + multi-viewport screenshot capture (390px, 768px, 1440px in AR and EN)
npm run test:browser
```

---

## 4. Remaining Owner-Supplied Assets & Launch Checklist
1. **Licensed `STC` Webfont Binaries (`.woff2`)**: Place in `public/fonts/stc/`, add `@font-face` declarations in `styles/fonts.css`, and prepend `"STC"` to `--font-body` in `styles/tokens.css`.
2. **Corrected Vector Logo (`.svg`)**: Supply vector artwork with corrected English spelling (`SURGEON`) to replace the interim typographic lockup if desired.
3. **Production Domain & Indexing**: When ready for public launch, set `NEXT_PUBLIC_SITE_URL` (or `siteUrl` in `content/site-config.json`) to the final production domain and set `"previewNoIndex": false` in `content/site-config.json`.
