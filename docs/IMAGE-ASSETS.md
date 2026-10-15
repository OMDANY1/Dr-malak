# Image Assets Register & Generation Log

This document records the real owner-supplied doctor portrait and all generated supporting medical-editorial visuals integrated into the website.

---

## 1. Real Doctor Portrait (Owner-Supplied)

- **Source File**: `brand/dr photo/683864358_18047112479587885_6122941244655145706_n.jpg` (`1080×1080` JPEG, preserved untouched)
- **Public Production Path**: `public/images/doctor/dr-malak-alsaif.jpg`
- **Placement**:
  1. **Homepage — Section 3 (`src/components/editorial/DoctorEditorialSpread.tsx`)**: Featured as the central unframed portrait (`aspect-ratio: 4 / 5`, `object-position: center 10%`) in the three-part editorial spread alongside her personal introduction and numbered verified qualifications (`01`–`03`). No gray portrait card frame or decorative fabric background is used.
  2. **About Page (`src/app/[locale]/about/page.tsx`)**: Leads the dedicated About page in a 12-column editorial spread.
- **Integrity Notes**: Original facial features, skin tone, expression, black hijab with silver floral embroidery, and white coat are 100% preserved without AI modification. Never labeled as a patient or replaced by an AI-generated doctor.

---

## 2. Generated Medical-Editorial Images

### Tool & Model Verification
- **Requested Capability Check**: Checked environment for `Nano Banana 2.1`. An exact tool/model named `Nano Banana 2.1` is **not** exposed under that identifier in this workspace; the environment provides the `image-generator` subagent backed by `default_api:generate_image` (**Google Imagen 3**).
- **Actual Tool / Model Used**: `image-generator` subagent → `default_api:generate_image` (Google Imagen 3).
- **Editorial & Ethical Policy**: All generated visuals represent broad areas of practice and consultation steps conceptually. None are labeled as Dr. Malak, real patients, clinic interiors presented as real, or clinical before/after results. Contains no text or logos inside imagery.

---

### Asset 1 — Panoramic Editorial Hero Photograph
- **Output File Path**: `public/images/generated/hero-panoramic-editorial.jpg`
- **Dimensions & Aspect Ratio**: `1408×768` (`16:9` wide panoramic landscape; styled at `21:9` on desktop and `16:11` on mobile)
- **Where Used**: Homepage Section 1 (`src/components/editorial/TypographicRedHero.tsx`) as the inset wide panoramic editorial photograph extending from the deep-brand-red (`#A83232`) opening canvas into the warm ivory (`#FFFCF0`) specialty gallery below.
- **Alt Text (AR)**: `صورة بانورامية تعبيرية هادئة تعكس الجمال الطبيعي المتوازن والعناية الطبية الراقية`
- **Alt Text (EN)**: `Calm panoramic editorial photograph reflecting balanced natural beauty and refined medical care`
- **Exact Prompt Used**:
  > "Wide panoramic 16:9 luxury editorial studio photograph. In a serene architectural setting of warm creamy ivory Venetian plaster (#FFFCF0) and smooth travertine stone bathed in golden morning window light, an adult Middle Eastern woman in her early 30s with authentic natural skin texture, calm dignified expression, wearing a modest opaque warm-ivory draped high-neck garment, is framed in a balanced wide horizontal composition looking gently toward the light. A subtle deep crimson-red (#A83232) architectural shadow-gap line accents the warm plaster wall behind her. High-craft editorial photography, natural skin pores, soft shadows, generous breathing room, no heavy makeup, no clinic equipment, no text, no logos, no watermark."

---

### Asset 2 — Plastic Surgery Dominant Tall Gallery Image
- **Output File Path**: `public/images/generated/specialty-plastic-surgery.jpg`
- **Dimensions & Aspect Ratio**: `896×1152` (`4:5` portrait, presented as the dominant `3:4` tall editorial frame on desktop)
- **Where Used**: Homepage Section 2 (`src/components/editorial/SpecialtyGallery.tsx` — Dominant Gallery Item `01` & Detail Panel) and Specialties Page (`src/app/[locale]/specialties/page.tsx`).
- **Alt Text (AR)**: `صورة تعبيرية لمجال جراحة التجميل والملامح الطبيعية المتوازنة`
- **Alt Text (EN)**: `Editorial visual representing plastic surgery and natural facial harmony`

---

### Asset 3 — Reconstructive Surgery Sculptural Editorial Image
- **Output File Path**: `public/images/generated/specialty-reconstructive-editorial.jpg`
- **Dimensions & Aspect Ratio**: `1280×896` (`4:3` landscape)
- **Where Used**: Homepage Section 2 (`src/components/editorial/SpecialtyGallery.tsx` — Supporting Gallery Item `02` & Detail Panel) and Specialties Page (`src/app/[locale]/specialties/page.tsx`).
- **Alt Text (AR)**: `تكوين معماري تعبيري من الحجر الدافئ والسيراميك يعكس استعادة التوازن والوظيفة في جراحة الترميم`
- **Alt Text (EN)**: `Sculptural travertine and ceramic editorial study representing structural balance and reconstructive care`
- **Exact Prompt Used**:
  > "4:3 horizontal editorial still-life photograph representing structural restoration, form, and harmony. Two interlocking sculptural forms crafted from warm ivory travertine stone and smooth matte cream ceramic (#FFFCF0) resting on a sunlit warm plaster plinth, joined along a refined, precise deep crimson-red (#A83232) architectural seam. Soft natural window light casting gentle directional shadows. Calm museum-grade medical-editorial aesthetic, no people, no clinic room, no surgical instruments, no text, no logos."

---

### Asset 4 — Burn Surgery Editorial Still-Life Image
- **Output File Path**: `public/images/generated/specialty-burn-editorial.jpg`
- **Dimensions & Aspect Ratio**: `1280×896` (`4:3` landscape, styled as an asymmetric `16:10` horizontal gallery frame on desktop)
- **Where Used**: Homepage Section 2 (`src/components/editorial/SpecialtyGallery.tsx` — Supporting Gallery Item `03` & Detail Panel) and Specialties Page (`src/app/[locale]/specialties/page.tsx`).
- **Alt Text (AR)**: `تكوين تعبيري هادئ من نسيج الكتان العاجي والسيراميك يعكس العناية اللطيفة والمتابعة في جراحة الحروق`
- **Alt Text (EN)**: `Calm editorial still life of ivory linen and ceramic reflecting gentle care and burn follow-up`
- **Exact Prompt Used**:
  > "4:3 horizontal editorial still-life photograph representing gentle skin care, soothing renewal, and rehabilitative support. Softly folded layers of pure unbleached ivory silk-linen gauze (#FFFCF0) and a smooth matte cream ceramic vessel resting on a warm travertine stone surface, accented by a single fine deep crimson-red (#A83232) architectural thread line. Bathed in diffused morning sunlight with serene shadows. Restrained luxury editorial photography, no people, no clinic interior, no text, no logos."

---

### Assets 5, 6 & 7 — Interactive Consultation Steps Still-Life Series (`01`, `02`, `03`)
- **Step 01 (`public/images/generated/article-questions-to-discuss.jpg`)**: Editorial still-life of an ivory notebook and crimson pen on travertine stone, representing initial contact and inquiry preparation.
- **Step 02 (`public/images/generated/article-consultation-prep.jpg`)**: Sunlit travertine desk composition with sheer ivory drapery, representing calm clinical evaluation and discussion of expectations.
- **Step 03 (`public/images/generated/step-03-options.jpg`, `1280×896` `4:3` landscape)**: Three ascending travertine stone blocks alongside a closed deep crimson-red (`#A83232`) linen portfolio, representing structured treatment options and clear next steps.
  - **Exact Prompt Used for `step-03-options.jpg`**:
    > "4:3 horizontal editorial still-life photograph representing clarity of options and structured next steps. Three ascending architectural blocks of warm ivory travertine stone (#FFFCF0) arranged in a calm stepped progression on a sunlit cream desk surface, alongside a closed deep crimson-red (#A83232) linen-bound portfolio folder. Soft directional daylight, clean minimalist geometry, reassuring editorial atmosphere, no readable text, no logos, no people."
