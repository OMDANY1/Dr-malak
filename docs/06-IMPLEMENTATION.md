# Implementation architecture
Inspect first. Create Next.js App Router + TypeScript only if no application exists. This kit intentionally has no package.json or installable app yet.
Suggested reusable code paths:
- src/components/layout/{Header,Footer,MobileMenu,LanguageSwitcher}.tsx
- src/components/sections/{Hero,Credentials,AboutPreview,Specialties,ConsultationJourney,FAQ,ContactCTA}.tsx
- src/components/ui/{Button,Container,SectionHeading}.tsx
- src/lib/{content,links,locales}.ts
- src/app/[locale]/layout.tsx and route page.tsx files
- src/app/globals.css or equivalent single global CSS entry

Adapt the exact root layout strategy to the installed Next version; do not create conflicting root layouts. Implement / redirect and invalid-locale handling explicitly.
Keep public asset paths stable. Import styles/tokens.css into the actual global stylesheet or translate its values into the chosen styling system without duplication.
Font declarations must reference existing files only. Preview fallback is allowed and must be documented. After adding fonts, inspect Network and document.fonts to confirm loading.
Avoid unnecessary dependencies. Preserve package-manager lockfile. No hardcoded secrets, forms, APIs or analytics required for this release.
Construct WhatsApp links from digits-only phone + encodeURIComponent(message). Never auto-send. All public CTAs must resolve to real destinations.
Use local optimized imagery only after asset approval. Keep moodboards out of public production bundles.
Preview noindex. Set canonical URL and sitemap origin only when real deployment host is supplied. No fabricated ratings or business address in JSON-LD.
