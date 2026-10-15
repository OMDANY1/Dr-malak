# Complete implementation prompt — Dr. Malak Alsaif

You are the creative director, Arabic UX designer, and full-stack implementer for this project. Build a refined, functioning Arabic-first bilingual personal website for Dr. Malak Alsaif, a plastic and reconstructive surgeon. Work in the extracted project folder. Implement the website, not just a plan or a screenshot.

FIRST: read AGENTS.md and every required document in its prescribed order. Inspect brand/references/art-direction.png and brand/references/social-preview.png visually. Read brand/ASSET-REGISTER.md before using any asset. Then read agents/01-creative-director.md, agents/02-implementation.md, and agents/03-review.md as your workflow checklists.

This folder is a briefing and assets kit, not a prebuilt application. Files named ROUTE.md are specifications, not executable pages. Create the actual Next.js application and page components.

BRAND LOCK
Use the existing MALAK identity: primary red #A83232 and creamy ivory #FFFCF0. The identity font families are alghraib and STC, explicitly confirmed by the owner. Proposed usage: alghraib for display headings, STC for paragraphs/navigation/buttons. Check the real fonts and their weights before wiring them. Elgharib binaries are now included; only STC is missing. Inspect styles/fonts.css and brand/TYPOGRAPHY.md. Do not invent font files, point CSS to absent URLs, download an unrelated font and rename it, or claim a system fallback is the approved font. Use supplied Elgharib for headings and a documented system-font fallback for STC body/UI until STC is supplied.

ART DIRECTION
Create a light, warm, highly considered editorial website. Ivory dominates; red carries headings, selected fields, buttons, and fine geometric lines. Translate the thin angular line language visible in the reference boards into subtle framing details without inventing a new logo. Soft ivory fabric and gentle light may support selected compositions. Keep faces natural, imagery modest, spacing generous, and sections visually varied. Avoid excessive petals, gradients, glass panels, generic card grids, fake statistical counters, purple themes, or stock hospital clichés.

LOGO AND PHOTOGRAPHY
The included logo is reference-only and contains a spelling error: SURGION. Do not deploy it or silently redraw/correct it. Use a clean text treatment of the doctor's name until a correct original logo is supplied. The women shown in the brand boards are brand imagery, not the doctor and not patients. Never label them as either. A high-resolution doctor portrait is missing: design a finished text-led hero with restrained abstract graphics until an approved portrait is added. Do not upscale the small Instagram avatar into a fabricated portrait. Do not place a whole moodboard as a website hero.

PURPOSE
Help visitors understand the doctor's field, read factual credentials, understand how to request a consultation, and contact the coordination number through WhatsApp. The site's primary conversion is a conversation to arrange a consultation, not a falsely confirmed appointment.

HOME PAGE
1. Elegant sticky header with name/logo fallback, navigation, language switch, and consultation CTA.
2. Ivory editorial hero: Arabic text right, approved portrait left when supplied. Eyebrow د. ملاك السيف; headline قرارك يبدأ بفهم احتياجك; field جراحة التجميل والترميم. Supporting text and bilingual alternatives are in content/site-copy.json. Buttons: تواصلي لحجز استشارة and تعرّفي على الدكتورة.
3. Restrained verified credentials strip, with no numerical claims.
4. Short personal profile with link to the about page.
5. Broad confirmed areas of practice: plastic surgery, reconstruction, and burns. No invented procedure catalog.
6. A brand-red consultation-journey section with ivory text and three clear steps: contact, assessment, discussion of options. Treat this as a proposed journey pending clinic approval.
7. Educational content only when real approved content and working URLs exist. Otherwise omit the feed and provide a simple link to Instagram; do not invent posts or engagement.
8. Administrative FAQs and a clear final consultation CTA.
9. Minimal footer with contact, navigation, and privacy link.

ROUTES
Implement /ar and /en, with / redirecting to /ar. Each language has home, about, specialties, contact, and privacy pages. Implement shared accessible components and translated metadata. Preserve the equivalent route when switching language. Invalid locales and unknown routes must produce an appropriate 404. Read docs/03-ROUTES.md and every route's ROUTE.md.

CONTACT
Use the coordination details transcribed from the owner's Instagram screenshot:
Phone: +966580376463
WhatsApp: https://wa.me/966580376463
Instagram: https://www.instagram.com/dralsaifma/
Use encodeURIComponent for localized prefilled messages. Clicking opens WhatsApp; never sends a message automatically. Use tel:+966580376463 for calling. Make phone/email direction LTR within RTL pages. These links initiate contact and do not confirm an appointment. Do not add a lead form, database, payments, patient accounts, or invented clinic address in this version.

FACTS
Use only the verified content in docs/02-SOURCES-AND-FACTS.md and content/site-config.json. Use the neutral public subtitle جراحة التجميل والترميم because the exact professional grade differs across public sources. Do not invent years of experience, success rates, awards, reviews, service availability, prices, consultation fees, addresses, or affiliations beyond the cited source. Do not promise natural results, painless surgery, or guaranteed outcomes. Medical copy is general informational draft copy and must be recorded for review before publication.

IMPLEMENTATION
Inspect the workspace before scaffolding. Reuse an existing application if present; otherwise create Next.js App Router + TypeScript with minimal dependencies. Install compatible supported versions using the package manager available and preserve a lockfile. Use normal CSS or Tailwind consistently. Centralize content and tokens. Prefer server-rendered content and client components only for real interaction. Use native CSS transitions; avoid a heavy animation dependency. Work in this folder while preserving docs, brand, content, and source references. Do not overwrite user assets.

RTL AND ACCESSIBILITY
Arabic is default, with proper lang=ar and dir=rtl; English is LTR. Use logical CSS properties, semantic headings, real links, labeled controls, visible keyboard focus, a skip link, and an accessible mobile menu that closes on Escape and restores focus. Respect reduced motion. Keep body text readable, verify contrast, avoid Arabic letter spacing, and do not let fixed contact actions cover page content.

MOTION
Subtle 150–250 ms control transitions and optional gentle section reveals. All content must remain visible when JavaScript fails or reduced motion is enabled. No scroll hijacking, autoplay sound, excessive parallax, or constant moving text.

SEO AND PRIVACY
Use truthful localized titles, descriptions, and structured data containing only verified facts. Do not fabricate ratings. Keep the preview noindex until deployment is explicitly authorized. Do not invent a canonical domain; configure it only when supplied. No analytics or tracking pixels by default. Privacy copy must describe the actual no-form architecture and explain that WhatsApp is a third-party destination; do not falsely claim the hosting platform keeps no logs.

WORKFLOW
After reading, give a short implementation plan and begin work immediately. Do not stop for routine design choices. Build the homepage, shared components, remaining pages, and contact behavior. Visually review at 390, 768, and 1440 px, inspect Arabic and English, and fix material layout issues. Run the available build/type/lint checks and honestly report which checks were executed. Test actual route navigation, language switching, contact links, mobile menu, missing-asset fallbacks, and browser console.

DELIVERY
Provide a working local preview, runnable application source, lockfile, setup commands, and docs/HANDOFF.md reporting implemented features, checks, and remaining assets. Include screenshots if the environment supports them. Do not claim success for tests you did not run. Missing fonts/portrait/approved logo must be visible in the handoff, not as internal TODOs throughout the public UI. Do not deploy or connect paid production services. Finish the authorized local implementation rather than ending after planning.

FONT INTEGRATION UPDATE: Import styles/fonts.css for the five supplied Elgharib OTF weights. Use the alghraib CSS family alias. STC remains a documented system-font fallback; do not leave Elgharib on a system fallback now that its files exist.
