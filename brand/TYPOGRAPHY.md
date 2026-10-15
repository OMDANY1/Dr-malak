# Font update — authoritative 2026-10-14

The owner supplied ELGHARIB FONT.rar. Five genuine OTF files are now included in public/fonts/alghraib: Elgharib Tajarib Taweel Light 300, Regular 400, Medium 500, Bold 700, Black 900. The CSS alias is alghraib. Internal font family/subfamily metadata is recorded in brand/font-manifest.json.

STC remains missing. Use an explicit Arabic-capable system fallback stack (`"Segoe UI", Tahoma, "Geeza Pro", "Noto Naskh Arabic", system-ui, sans-serif`) temporarily for body/UI and report the fallback honestly. Do not rename another font to STC or claim complete brand typography. Do not include an unbundled `"STC"` family name in `--font-body` while `@font-face` binaries are absent, because local OS installations of `STC Regular` have broken Arabic mark/diacritic metrics that split Arabic words around harakat.

Import styles/fonts.css and styles/tokens.css into the actual application stylesheet. All active @font-face paths point to supplied OTF files. Do not load the same fonts twice with next/font/local. On `alghraib` display elements, disable discretionary/contextual swash ligatures (`font-feature-settings: "dlig" 0, "calt" 0, "liga" 0`) while keeping standard Arabic joining (`ccmp`, `init`, `medi`, `fina`, `rlig`, `mark`, `mkmk`). Ensure `<button>`, `<input>`, `<select>`, and `<textarea>` explicitly inherit `var(--font-body)` rather than browser default `Arial`.

The archive contained no separate license document; do not claim a bundled web license. The supplied OTF files are preserved unchanged.

Proposed assignment: alghraib for headings; STC for paragraphs, navigation and buttons when supplied. Exact role distribution remains a design recommendation. Arabic body text: approximately 18px/1.8 line-height; no Arabic letter-spacing. Check layout after real fonts load.

