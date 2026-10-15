# Required project instructions

Read these files in order before editing application code:

1. `docs/01-BRIEF.md`
2. `brand/BRAND.md`
3. `brand/TYPOGRAPHY.md`
4. `brand/ASSET-REGISTER.md`
5. `docs/02-SOURCES-AND-FACTS.md`
6. `docs/03-ROUTES.md`
7. `docs/04-CONTENT.md`
8. `docs/05-UX-AND-COMPONENTS.md`
9. `docs/06-IMPLEMENTATION.md`
10. `docs/07-QA.md`
11. `docs/08-HANDOFF.md`
12. `docs/IMAGE-ASSETS.md`

Then inspect both images in `brand/references`, the approved doctor portrait in `brand/dr photo/`, and read the appropriate `src/app/[locale]/**/ROUTE.md` before building or modifying each route.
User instructions take precedence. Locked identity: `#A83232` + `#FFFCF0`; fonts `alghraib` + `STC`.
Do not replace identity with plum, mauve, or IBM Plex. Elgharib binaries are included; missing STC binaries are explicitly documented.
The approved doctor portrait is supplied in `brand/dr photo/` and served from `public/images/doctor/dr-malak-alsaif.jpg`. Preserve her real facial features, hijab, and white coat; never substitute an AI-generated doctor or treat reference-board models as the doctor.
Do not use the flawed reference logo (`SURGION`) as an approved production logo.
Supporting non-portrait conceptual visuals are stored in `public/images/generated/` and documented in `docs/IMAGE-ASSETS.md`.
Interactive scope includes the WAI-ARIA tabbed Specialty Explorer, the two-step Consultation Request Dialog (which opens WhatsApp without storing personal health data), and the localized Articles Hub (`/[locale]/articles` and `/[locale]/articles/[slug]`) backed by `content/articles/{ar,en}/`.
Do not claim final brand typography fidelity while STC font binaries or an approved vector logo are missing.
No deployment, account creation, purchases, or automatic sending of messages is requested.
Read `agents/*.md` as sequential role checklists. These do not require separate agents or assumed Antigravity integrations.
