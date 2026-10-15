# Complete Frontend Redesign Specification — Dr. Malak Alsaif

## 1. Visual Direction & Architectural Philosophy

This redesign replaces conservative box-and-card patterns with an **art-directed, photographic, modern medical-editorial experience** inspired by luxury architectural and clinical monographs and aligned with the approved brand boards (`brand/references/art-direction.png` and `brand/references/social-preview.png`):

- **Locked Color Identity**:
  - Primary Crimson (`#A83232`): Used with architectural intention—fine editorial index lines, active state indicators, primary consultation actions, the Consultation Journey backdrop, and the distinctive full-bleed Deep-Red Closing Section.
  - Creamy Ivory (`#FFFCF0`) & Warm Alabaster (`#F6F0E2` / `#EFE7D6`): Layered editorial paper surfaces separated by hairline architectural rules (`#E2D4C8`) rather than heavy rounded cards or drop-shadow boxes.
  - Warm Dark Ink (`#332725`): High-contrast editorial typography.
- **Typography & Bilingual Rhythm**:
  - Display Headings (`alghraib` / `Elgharib`, weights 300–700): Oversized, confident editorial scale with tight, balanced line-height (`1.06–1.18`), discretionary ligatures disabled (`"dlig" 0, "calt" 0, "liga" 0`) to preserve clean Arabic letter connections.
  - Body & UI Copy: Clean Arabic-capable fallback (`"Segoe UI", Tahoma, "Geeza Pro", "Noto Naskh Arabic", system-ui, sans-serif`) until official `STC` webfont binaries are supplied. Unbundled `"STC"` is excluded from `--font-body` so local OS `STC Regular` fonts never split Arabic words around diacritics (`تعرّفي`, `يُؤكَّد`, `تُحدَّد`, `بُعد`).
- **Editorial Grid & Spatial Rhythm**:
  - 12-column asymmetric architectural grid (`max-width: 1320px`) alternating between:
    1. Full-viewport photographic immersion (`Hero`)
    2. Spacious warm-ivory asymmetric portrait spread (`Doctor Editorial Introduction`)
    3. Interactive split-stage visual exploration (`Specialty Explorer`)
    4. Deep-crimson scroll-responsive progression (`Consultation Journey`)
    5. Medical journal editorial layout (`Articles Preview`)
    6. Spacious typographic accordion (`FAQ`)
    7. Full-bleed deep-crimson statement (`Consultation Closing Section`)

---

## 2. Section-by-Section Homepage Layout (`/[locale]`)

1. **Navigation (`src/components/layout/Header.tsx`, `MobileMenu.tsx`)**:
   - Compact architectural top bar (`76px`) overlaying the hero with a translucent warm-ivory glaze at scroll top (`is-at-top`), transitioning smoothly to a solid ivory surface (`#FFFCF0`) with a hairline bottom border on scroll (`is-scrolled`).
   - Brand lockup (`د. ملاك السيف` / `Dr. Malak Alsaif` + specialty subtitle) with a fine vertical crimson bar, numbered editorial nav links (`01`–`05`), equivalent-page language switcher, and prioritized consultation CTA.
   - Mobile drawer locks `document.body.style.overflow = "hidden"` while open, supports `Escape` close, restores focus to trigger, and presents staggered numbered navigation links.

2. **Immersive Photographic Hero (`src/components/sections/Hero.tsx`)**:
   - **Desktop (`>= 960px`)**: Full-bleed first-viewport editorial stage (`min-height: calc(100svh - 76px)`) featuring `public/images/generated/hero-aesthetic-editorial.jpg`. The subject occupies the left/end visual field while the right/start warm-ivory negative space hosts an architectural editorial column with:
     - Edition index & specialty eyebrow (`جراحة التجميل والترميم`)
     - Oversized `Elgharib` headline: `“جمال يليق بكِ”` / `"Care & beauty tailored to you"`
     - Concise lead paragraph & coordination note
     - Primary consultation CTA (`ConsultationTriggerButton`) + restrained secondary specialty exploration link (`#specialties-section`)
     - Subtle architectural scroll cue (`#doctor-section`) at the lower edge
   - **Mobile (`< 960px`)**: Separate art-directed image-and-copy composition so the subject's face is 100% unobstructed at the top (`object-position: 24% 18%`), followed immediately by a warm-ivory editorial stage with the headline and CTAs clearly readable without scrolling.
   - **Prohibitions Enforced**: No rectangular gray-background doctor card in the hero, no beige fabric background, and no qualifications strip inside the hero.

3. **Doctor Editorial Introduction (`src/components/sections/AboutPreview.tsx`)**:
   - Asymmetric 12-column editorial spread (`#doctor-section`) establishing Dr. Malak Alsaif's identity immediately below the hero.
   - **Portrait Column (5 cols)**: Displays the real owner-supplied portrait (`public/images/doctor/dr-malak-alsaif.jpg`) inside an architectural editorial frame with an offset `#A83232` geometric corner rule, warm-alabaster studio mat, and caption bar (`01 / الملف التعريفي`).
   - **Biography & Credentials Column (7 cols)**: Displays Dr. Malak's name in `Elgharib`, specialty subtitle, approved introduction, open numbered credentials list (`01` Board certification & residency, `02` Medical degree, `03` ASPS membership), link to `/[locale]/about`, and `@dralsaifma` Instagram link.

4. **Interactive Specialty Explorer (`src/components/sections/Specialties.tsx`)**:
   - Replaces the previous 3-card row + bottom panel with a **single unified Interactive Split Explorer** (no repeated images on screen):
   - **Desktop (`>= 960px`)**:
     - **Interactive Specialty Index (5 cols, `role="tablist"`)**: Vertical architectural list of the three approved areas (`01 جراحة التجميل`, `02 جراحة الترميم`, `03 جراحة الحروق`). Each tab button displays its index numeral, specialty title, concise summary preview, and an animated crimson active bar.
     - **Photographic & Clinical Stage (7 cols, `role="tabpanel"`)**: Large 4:5 editorial photograph (`specialty-plastic-surgery.jpg`, `specialty-reconstructive-care.jpg`, or `specialty-burn-care.jpg`) alongside the clinical scope explanation, individual assessment note, contextual consultation CTA (`topicId={item.id}`), and direct WhatsApp link.
   - **Mobile (`< 960px`)**: Deliberate stacked chapter selector paired directly with the active photographic stage so users can switch specialties cleanly without horizontal scrolling or hover dependency.
   - **Accessibility**: Inactive `role="tabpanel"` elements have `hidden`, `inert`, and `display: none !important` so controls inside inactive panels are never keyboard-focusable.

5. **Consultation Journey (`src/components/sections/ConsultationJourney.tsx`)**:
   - Deep-crimson (`#A83232`) asymmetric editorial section with warm ivory (`#FFFCF0`) typography.
   - Pairs a sticky editorial column (section title, 3:2 consultation photograph `consultation-editorial.jpg` with live step counter `01 / 03`, and ivory consultation CTA) with a scroll-activated 3-step vertical sequence (`01 التواصل`, `02 التقييم ومناقشة الاحتياج`, `03 توضيح الخيارات والخطوات التالية`).

6. **Editorial Articles Preview (`src/components/sections/ArticlesPreview.tsx`)**:
   - Designed like a medical journal: asymmetric split featuring one dominant **Featured Monograph** (large 16:9 cover image, category badge, localized reading time, `Elgharib` title, excerpt, and read link) alongside a structured editorial column for supporting published articles.

7. **Spacious Typographic FAQ (`src/components/sections/ContactCTA.tsx` — Part 1)**:
   - Dedicated warm-ivory asymmetric editorial section (`#questions-and-contact`): 4-column sticky editorial header paired with an 8-column spacious typographic `<details>`/`<summary>` accordion (`01`–`03`) using crisp hairline dividers and smooth plus/minus icon rotation.

8. **Distinctive Deep-Red Consultation Closing Section (`src/components/sections/ContactCTA.tsx` — Part 2)**:
   - Dramatic full-bleed `#A83232` closing statement with architectural hairline framing, oversized ivory `Elgharib` display typography (`تواصلي لتنسيق موعد استشارتك`), clear coordination disclaimer (`يُؤكَّد الموعد بعد التنسيق`), primary ivory consultation dialog trigger, direct phone link (`+966 58 037 6463` in explicit LTR), and Instagram (`@dralsaifma`).

9. **Editorial Footer (`src/components/layout/Footer.tsx`)**:
   - Clean 4-column architectural footer on warm alabaster with brand lockup, informational disclaimer, primary route index, verified coordination channels, equivalent-page language switch, and privacy link.

---

## 3. Inner-Page Layout Redesign

- **About (`/[locale]/about`)**: Asymmetric portrait-and-monograph opening using `dr-malak-alsaif.jpg` with architectural crimson framing, followed by a 2-column open editorial spread of verified academic credentials (`01`–`03`) and consultation methodology pillars (`01`–`03`), concluding with the Deep-Red Consultation Closing Section.
- **Specialties (`/[locale]/specialties`)**: Architectural index header with quick-jump chapter pills (`01`–`03`), followed by three alternating full-width photographic monograph chapters (Plastic Surgery, Reconstructive Surgery, Burn Surgery), a clinical assessment context spread, the Consultation Journey, and the Deep-Red Closing Section.
- **Articles Hub (`/[locale]/articles`) & Article Detail (`/[locale]/articles/[slug]`)**: Medical journal masthead, search/category filter bar with Arabic diacritic/letter normalization, prominent Featured Article spread + supporting grid, and redesigned Article Detail page with balanced title hierarchy, wide 16:9 cover frame, sticky Table of Contents + top reading progress bar, verified byline metadata, comfortable Arabic reading measure (`62ch`, `line-height: 1.95`), and related articles.
- **Contact (`/[locale]/contact`)**: Asymmetric 12-column coordination desk pairing direct consultation actions and an open 3-row channel directory (WhatsApp, Phone `+966 58 037 6463`, Instagram `@dralsaifma`) with essential pre-contact guidelines and the administrative FAQ accordion.
- **Privacy (`/[locale]/privacy`)**: Clean editorial legal monograph with numbered policy sections (`01`–`04`).

---

## 4. Image Plan & Asset Manifest

1. `public/images/doctor/dr-malak-alsaif.jpg` (`1080×1080` real portrait from `brand/dr photo/`): Used exclusively for Dr. Malak in `AboutPreview.tsx` and `/[locale]/about`.
2. `public/images/generated/hero-aesthetic-editorial.jpg` (`1344×768`): Homepage Hero editorial photograph with warm ivory negative space.
3. `public/images/generated/specialty-plastic-surgery.jpg` (`896×1152`): Specialty Explorer & Chapter 01 (Plastic Surgery).
4. `public/images/generated/specialty-reconstructive-care.jpg` (`896×1152`): Specialty Explorer & Chapter 02 (Reconstructive Surgery).
5. `public/images/generated/specialty-burn-care.jpg` (`896×1152`): Specialty Explorer & Chapter 03 (Burn Surgery).
6. `public/images/generated/consultation-editorial.jpg` (`1216×832`): Consultation Journey editorial scene.
7. `public/images/generated/article-consultation-prep.jpg` & `article-questions-to-discuss.jpg` (`16:9`): Published article cover images.

---

## 5. Motion & Interaction Rules

- **GPU-Safe Properties**: All transitions animate `transform`, `opacity`, and `clip-path` using `cubic-bezier(0.22, 1, 0.36, 1)`.
- **Reduced Motion**: `@media (prefers-reduced-motion: reduce)` disables all scroll translations, stagger delays, and mask animations immediately.
- **No Scroll Hijacking**: Native browser scrolling is preserved at all times.
