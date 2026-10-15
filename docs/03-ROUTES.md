# URL and file mapping
The folders provided contain route specifications alongside executable Next.js App Router `page.tsx` files.

| Arabic | English | App Router target |
|---|---|---|
| `/ar` | `/en` | `src/app/[locale]/page.tsx` |
| `/ar/about` | `/en/about` | `src/app/[locale]/about/page.tsx` |
| `/ar/specialties` | `/en/specialties` | `src/app/[locale]/specialties/page.tsx` |
| `/ar/articles` | `/en/articles` | `src/app/[locale]/articles/page.tsx` |
| `/ar/articles/[slug]` | `/en/articles/[slug]` | `src/app/[locale]/articles/[slug]/page.tsx` |
| `/ar/contact` | `/en/contact` | `src/app/[locale]/contact/page.tsx` |
| `/ar/privacy` | `/en/privacy` | `src/app/[locale]/privacy/page.tsx` |

## Routing & SEO Rules
- `/` redirects to `/ar`.
- Unknown locales (e.g., `/fr`) and unknown routes return HTTP 404, not silently rendered English.
- Language switching preserves the equivalent route suffix. On article detail pages (`/[locale]/articles/[slug]`), language switching links to the published translated counterpart (`translationKey`), or falls back to the localized articles hub (`/[targetLocale]/articles`) if no published translation exists.
- Draft articles (`status: "draft"`) in `content/articles/{ar,en}/` are excluded from public listings, homepage previews, search results, related articles, and `sitemap.xml`, and return HTTP 404 on public URLs.
- Use one valid `html`/`body` root layout (`src/app/layout.tsx`) and set document `lang` and `dir` (`rtl` for `ar`, `ltr` for `en`) per route; do not nest duplicate `html` elements.
- `src/app/robots.ts` and `src/app/sitemap.ts` respect `siteConfig.previewNoIndex` and do not publish a fabricated canonical domain.
