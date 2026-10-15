# Font update — authoritative 2026-10-14

The owner supplied ELGHARIB FONT.rar. Five genuine OTF files are now included in public/fonts/alghraib: Elgharib Tajarib Taweel Light 300, Regular 400, Medium 500, Bold 700, Black 900. The CSS alias is alghraib. Internal font family/subfamily metadata is recorded in brand/font-manifest.json.

STC remains missing. Use system-ui, sans-serif temporarily for body/UI and report the fallback honestly. Do not rename another font to STC or claim complete brand typography.

Import styles/fonts.css and styles/tokens.css into the actual application stylesheet. All active @font-face paths point to supplied OTF files. Do not load the same fonts twice with next/font/local. Test Arabic shaping and actual network loading in the implementation browser.

The archive contained no separate license document; do not claim a bundled web license. The supplied OTF files are preserved unchanged.
