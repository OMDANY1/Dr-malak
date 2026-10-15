# Image Assets Register & Generation Log

This document records the real doctor portrait and all generated supporting medical-editorial visuals integrated into the website.

---

## 1. Real Doctor Portrait (Owner-Supplied)

- **Source File**: `brand/dr photo/683864358_18047112479587885_6122941244655145706_n.jpg` (`1080×1080` JPEG, preserved untouched)
- **Public Production Path**: `public/images/doctor/dr-malak-alsaif.jpg`
- **Placement**:
  1. **Homepage — Section 2 (`src/components/sections/AboutPreview.tsx`)**: Used **once** prominently on the homepage in the "Meet Dr. Malak" editorial section alongside her biography and open verified credentials list.
  2. **About Page (`src/app/[locale]/about/page.tsx`)**: Leads the dedicated About page in a generous portrait-first opening layout (`aspect-ratio: 4 / 4.6`, `object-position: center 8%`, `transform: scale(1.1)`).
- **Integrity Notes**: Original facial features, skin tone, expression, black hijab with silver floral embroidery, and white coat are 100% preserved without AI modification. Never labeled as a patient or replaced by an AI-generated doctor.

---

## 2. Generated Medical-Editorial Images

### Tool & Model Verification
- **Requested Capability Check**: Checked environment for `Nano Banana 2.1`. An exact tool/model named `Nano Banana 2.1` is **not** exposed under that identifier in this workspace; the environment provides the `image-generator` subagent backed by `default_api:generate_image` (**Google Imagen 3**).
- **Actual Tool / Model Used**: `image-generator` subagent → `default_api:generate_image` (Google Imagen 3).
- **Editorial & Ethical Policy**: All generated visuals represent broad areas of practice and consultation atmosphere conceptually. None are labeled as Dr. Malak, real patients, or clinical before/after results. Every asset was visually inspected before integration; Asset 1 (`hero-aesthetic-editorial.jpg`) was regenerated once (`v2`) to eliminate a vertical backdrop seam and achieve a continuous warm ivory studio surface.

---

### Asset 1 — Hero Aesthetic Editorial Image
- **Output File Path**: `public/images/generated/hero-aesthetic-editorial.jpg`
- **Dimensions & Aspect Ratio**: `1344×768` (`16:9` landscape)
- **Where Used**: Homepage Section 1 (`src/components/sections/Hero.tsx`) as the full-bleed desktop / intentional top-crop mobile editorial hero image.
- **Alt Text (AR)**: `صورة تعبيرية هادئة تعكس العناية الطبية والجمال الطبيعي المتوازن`
- **Alt Text (EN)**: `Calm editorial portrait reflecting balanced natural beauty and attentive medical care`
- **Exact Prompt Used (Regenerated Seamless v2)**:
  > "Wide 16:9 horizontal studio editorial photograph. A single continuous, completely seamless, uniform warm creamy ivory plaster wall (#FFFCF0) across the entire frame with NO vertical lines, NO wall corners, NO split screen, NO color transitions, and NO dividers. Positioned in the left third of the frame is a refined Middle Eastern adult woman in her late 20s or 30s with natural skin texture and calm confident expression, wearing a modest opaque ivory high-neck garment, softly lit by gentle natural window light. The right two-thirds of the frame is empty, continuous, smooth warm ivory negative space (#FFFCF0) with soft natural light falloff, ready for Arabic headline typography. Natural photography, authentic skin pores, no heavy makeup, no jewelry, no text, no watermark."

---

### Asset 2 — Plastic Surgery Editorial Image
- **Output File Path**: `public/images/generated/specialty-plastic-surgery.jpg`
- **Dimensions & Aspect Ratio**: `896×1152` (`4:5` portrait)
- **Where Used**: Homepage Section 3 (`src/components/sections/Specialties.tsx` — Panel 01 & Expanded Stage) and Specialties Page Chapter 01 (`src/app/[locale]/specialties/page.tsx`).
- **Alt Text (AR)**: `صورة تعبيرية لمجال جراحة التجميل والملامح الطبيعية المتوازنة`
- **Alt Text (EN)**: `Editorial visual representing plastic surgery and natural facial harmony`
- **Exact Prompt Used**:
  > "4:5 vertical portrait editorial photograph representing aesthetic facial harmony and refined natural beauty. Close side-profile study of an adult Middle Eastern woman with natural, healthy skin texture, calm composed expression, soft warm studio daylight, wearing a modest warm cream drape covering shoulders and neck, set against a warm ivory (#FFFCF0) background with a subtle deep crimson-red (#A83232) architectural shadow line in the background. Natural authentic photography, no surgical marks, no dotted lines on face, no syringes, no instruments, no text, no logos."

---

### Asset 3 — Reconstructive Care Editorial Image
- **Output File Path**: `public/images/generated/specialty-reconstructive-care.jpg`
- **Dimensions & Aspect Ratio**: `896×1152` (`4:5` portrait)
- **Where Used**: Homepage Section 3 (`src/components/sections/Specialties.tsx` — Panel 02 & Expanded Stage) and Specialties Page Chapter 02 (`src/app/[locale]/specialties/page.tsx`).
- **Alt Text (AR)**: `صورة تعبيرية لمجال جراحة الترميم واستعادة الوظيفة والشكل`
- **Alt Text (EN)**: `Editorial visual representing reconstructive surgery and functional care`
- **Exact Prompt Used**:
  > "4:5 vertical portrait medical editorial photograph representing reconstructive care, functional recovery, and clinical precision. Close-up of a female surgeon's hands in clean medical gloves gently and respectfully examining or supporting a patient's healthy hand and wrist during a calm clinical assessment in a warm, sunlit ivory consultation room (#FFFCF0). A subtle deep red (#A83232) clinical folder edge or cuff detail is visible on the desk. Dignified, reassuring, human-centered medical photography, natural anatomy, exactly five fingers per hand, no open wounds, no blood, no operating room machinery, no faces shown, no text, no logos."

---

### Asset 4 — Burn Care & Post-Burn Reconstruction Editorial Image
- **Output File Path**: `public/images/generated/specialty-burn-care.jpg`
- **Dimensions & Aspect Ratio**: `896×1152` (`4:5` portrait)
- **Where Used**: Homepage Section 3 (`src/components/sections/Specialties.tsx` — Panel 03 & Expanded Stage) and Specialties Page Chapter 03 (`src/app/[locale]/specialties/page.tsx`).
- **Alt Text (AR)**: `صورة تعبيرية لمجال جراحة الحروق والمتابعة العلاجية والترميمية`
- **Alt Text (EN)**: `Editorial visual representing burn surgery and supportive rehabilitative care`
- **Exact Prompt Used**:
  > "4:5 vertical portrait medical editorial photograph representing gentle skin care, healing, and rehabilitative follow-up. Close-up of a female clinician in a crisp white coat gently holding a clean, soft sterile gauze dressing roll beside a patient's forearm wrapped in a neat, clean ivory medical bandage, in a warm daylight-filled clinic room (#FFFCF0) with a subtle deep crimson-red (#A83232) accent line on the tray. Calm, dignified, supportive atmosphere, natural hand anatomy, no graphic burns, no raw skin, no distress, no faces shown, no text, no logos."

---

### Asset 5 — Consultation Journey Image
- **Output File Path**: `public/images/generated/consultation-editorial.jpg`
- **Dimensions & Aspect Ratio**: `1216×832` (`3:2` landscape)
- **Where Used**: Homepage Section 4 (`src/components/sections/ConsultationJourney.tsx`) and Specialties Page Consultation Journey section.
- **Alt Text (AR)**: `مشهد تعبيري لجلسة استشارة طبية هادئة ومناقشة الخيارات العلاجية`
- **Alt Text (EN)**: `Conceptual editorial scene of a calm medical consultation and treatment discussion`
- **Exact Prompt Used**:
  > "3:2 horizontal editorial photograph of a calm, private medical consultation setting. Over-the-shoulder view of a female physician in a white coat sitting across a warm ivory consultation desk from a modestly dressed Middle Eastern female patient (only the physician's shoulder/hand and the patient's attentive posture in three-quarter view are visible, clearly distinct from any specific doctor portrait). Warm daylight filtering through sheer ivory curtains (#FFFCF0), a clean desk with an unbranded deep crimson-red (#A83232) pen and blank cream card. Reassuring, private, high-trust medical editorial mood, natural photography, no readable text, no logos, no screens."

---

### Assets 6 & 7 — Article Cover Images (Drafts in `content/articles/{ar,en}/`)
- **`public/images/generated/article-consultation-prep.jpg`** (`16:9` landscape): Cover visual for *"كيف تستعدين لاستشارة جراحة التجميل؟"* / *"How to Prepare for a Plastic Surgery Consultation"*.
- **`public/images/generated/article-questions-to-discuss.jpg`** (`16:9` landscape): Cover visual for *"أسئلة تساعدك على مناقشة توقعاتك خلال الاستشارة"* / *"Questions to Help You Discuss Your Expectations During a Consultation"*.
