# Frontend Redesign Specification — Bold Arabic Editorial Architecture (`د. ملاك السيف`)

## 1. Visual & Structural Concept
This redesign replaces the previous presentation layer with a **bold Arabic editorial frontend** combining the locked deep brand red (`#A83232`), warm creamy ivory (`#FFFCF0`), oversized `alghraib` (`Elgharib`) Arabic display typography, and art-directed medical-editorial photography.

When viewed as a full-page screenshot, the new design establishes a completely distinct vertical silhouette:
1. **Minimal Header + Vertically Layered Typographic Red Hero** (`#A83232` canvas with centered ivory typography above an inset panoramic photograph that extends visually into the next section).
2. **Asymmetric Warm-Ivory Specialty Gallery** (`#FFFCF0` canvas with 1 dominant tall `3:4` frame and 2 staggered supporting frames at different vertical positions, plus an accessible modal detail sheet).
3. **Three-Part Doctor Editorial Spread** (Personal Introduction — Central Unframed Real Doctor Portrait — Verified Qualifications `01`–`03`).
4. **Contained Interactive Consultation Steps Module** (3 numbered step controls `01`, `02`, `03` updating explanatory copy and supporting still-life imagery inside a warm-alabaster architectural container).
5. **Editorial Journal Monograph** (Large `16:9` cover, localized reading time, and chapter index intentionally crafted for the single published article, with automatic support for a typographic list when additional articles are published).
6. **Compact Accessible FAQ + Spacious Ivory Booking Section + Deep-Red Footer** (Ending with an expansive warm-ivory booking canvas and a concise deep-red footer).

---

## 2. The Seven Structural Changes

### 1. Minimal Navigation (`src/components/editorial/MinimalNav.tsx`)
- Replaced the horizontal link bar with:
  - Doctor's brand identity lockup (`د. ملاك السيف` / `Dr. Malak Alsaif`).
  - Language switcher (`EN` / `عربي`).
  - Primary consultation trigger button.
  - Clearly labeled menu button (`القائمة` / `Menu`).
- Activating the menu button opens a full-screen deep-red panel (`#ed-fullscreen-menu-panel`) containing large numbered page links (`01`–`06`) and a smaller contact coordination column (`+966 58 037 6463`, `@dralsaifma`, and consultation CTA).
- Enforces keyboard navigation, `Escape` dismissal, `Tab`/`Shift+Tab` focus trapping, body scroll locking, and focus restoration to the menu trigger.

### 2. Typographic Red Hero (`src/components/editorial/TypographicRedHero.tsx`)
- Removed the previous model-left/text-right split hero.
- Vertically layered composition on `#A83232`:
  - Specialty label (`جراحة التجميل والترميم · جراحة الحروق`) above a large, deliberately typeset `alghraib` headline (`“جمال يليق بكِ”`).
  - Concise supporting sentence and primary consultation action below the headline.
  - Wide panoramic editorial photograph (`/images/generated/hero-panoramic-editorial.jpg`) inset slightly from the viewport edges and extending visually into the ivory section below.
- Compact vertical spacing ensures meaningful photography is visible in the first desktop viewport (`1440×920`), while mobile uses a dedicated `16:11` crop and balanced type scale.
- Motion: whole-line headline entrance, simple image mask reveal, and subtle scroll-linked image scale (`1` → `1.042`), all respecting `prefers-reduced-motion` with zero intro loader delay.

### 3. Visual Specialty Gallery (`src/components/editorial/SpecialtyGallery.tsx`)
- Replaced the specialty tabs and three identical cards with an asymmetric photographic gallery on `#FFFCF0`:
  - **Dominant Tall Image (`3:4`)**: `01 جراحة التجميل` (`Plastic Surgery`).
  - **Supporting Upper Image (`4:3`)**: `02 جراحة الترميم` (`Reconstructive Surgery`).
  - **Supporting Lower Image (`16:10`)**: `03 جراحة الحروق` (`Burn Surgery`).
- Selecting a specialty opens an accessible modal detail panel (`#ed-specialty-detail-panel`) with a concise introduction, visible close button, keyboard support (`Escape` + focus trap + focus restoration), consultation trigger, and full-page link. Each gallery item also includes a normal navigation link fallback.

### 4. Doctor Profile as an Editorial Spread (`src/components/editorial/DoctorEditorialSpread.tsx`)
- Three-part desktop composition (`3.8fr : 4.4fr : 3.8fr`):
  - **Column 1**: Short personal introduction and official Instagram link (`@dralsaifma`).
  - **Column 2**: Large central unframed real doctor portrait (`public/images/doctor/dr-malak-alsaif.jpg`) preserving her authentic appearance, hijab, and white coat without a gray card frame or decorative fabric backdrop.
  - **Column 3**: Numbered verified qualifications (`01`–`03`) and full-profile link (`/[locale]/about`).
- Sequential vertical layout on mobile.

### 5. Interactive Consultation Steps (`src/components/editorial/InteractiveConsultationSteps.tsx`)
- Replaced the oversized red vertical timeline with a contained warm-alabaster module (`#consultation-steps-section`).
- Features three numbered step controls (`01 التواصل`, `02 التقييم ومناقشة الاحتياج`, `03 توضيح الخيارات والخطوات التالية`).
- Selecting a step updates its explanatory copy and supporting editorial still-life photograph (`article-questions-to-discuss.jpg`, `article-consultation-prep.jpg`, `step-03-options.jpg`) while keeping all steps understandable without animation.

### 6. Editorial Journal (`src/components/editorial/EditorialJournal.tsx`)
- Intentionally designed for the single published article (`preparing-for-consultation`) with a large `16:9` cover, category badge, localized reading time (`دقيقتان للقراءة` / `2 min read`), and a 4-chapter preview index (`01`–`04`).
- Automatically renders a secondary typographic list if additional published articles are added in the future.

### 7. Compact FAQ, Spacious Ivory Booking Section & Deep-Red Footer (`src/components/editorial/FaqAndBooking.tsx`, `src/components/editorial/EditorialFooter.tsx`)
- Compact accessible `<details>`/`<summary>` FAQ (`#questions-and-contact`).
- Spacious warm-ivory booking section (`.ed-ivory-booking-section`) with large `#A83232` display typography, one primary consultation action, and a secondary telephone link (`+966 58 037 6463`).
- Deep-brand-red footer (`.ed-red-footer`) with ivory typography and concise navigation.
