import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import sharp from "sharp";

const ROOT = process.cwd();
const PDF_PATH =
  "C:/Users/elwady/.gemini/antigravity/brain/13985f7c-3def-417d-9868-54f5e7702ac6/.user_uploaded/media_1793610999318_143d7487.pdf";
const PNG_ASSET_PATH =
  "C:/Users/elwady/.gemini/antigravity/brain/13985f7c-3def-417d-9868-54f5e7702ac6/.user_uploaded/media_1793611010389_64cd5f8b.png";

const PUBLIC_DIR = path.join(ROOT, "public");
const BRAND_DIR = path.join(PUBLIC_DIR, "brand");
fs.mkdirSync(BRAND_DIR, { recursive: true });

// 1. Extract Streams 3-10 from the official Brand PDF
const pdfBuf = fs.readFileSync(PDF_PATH);
let pos = 0;
let idx = 0;
const streamParts = [];
while ((pos = pdfBuf.indexOf("stream", pos)) !== -1) {
  const end = pdfBuf.indexOf("endstream", pos);
  if (end === -1) break;
  let start = pos + 6;
  if (pdfBuf[start] === 13 && pdfBuf[start + 1] === 10) start += 2;
  else if (pdfBuf[start] === 10) start += 1;
  const chunk = pdfBuf.subarray(start, end);
  try {
    const dec = zlib.inflateSync(chunk).toString("latin1");
    if ([3, 4, 5, 6, 7, 8, 9, 10].includes(idx)) {
      streamParts.push(dec);
    }
  } catch {
    // ignore non-deflate streams
  }
  pos = end + 9;
  idx++;
}

const fullStream = streamParts.join("");
const startLogo = fullStream.indexOf("q 0 770 1000 -770 re W n");
if (startLogo === -1) {
  throw new Error("Could not locate logo vector stream in PDF");
}
const rawLogoStream = fullStream.slice(startLogo);

// 2. Parse PDF path commands into exact geometric shapes
const tokens = rawLogoStream.replace(/[\r\n]+/g, " ").trim().split(/\s+/);
let i = 0;
let curColor = "#FFFFFF";
let tx = 0;
let ty = 0;
const stack = [];
const shapes = [];
let curPts = [];
let curCmds = [];
let shapeIdx = 0;

while (i < tokens.length) {
  const t = tokens[i];
  if (t === "q") {
    stack.push({ tx, ty });
    i++;
  } else if (t === "Q") {
    const s = stack.pop() || { tx: 0, ty: 0 };
    tx = s.tx;
    ty = s.ty;
    i++;
  } else if (t === "cm") {
    const f = parseFloat(tokens[i - 1]);
    const e = parseFloat(tokens[i - 2]);
    tx = e;
    ty = f;
    i++;
  } else if (t === "rg") {
    const b = Math.round(parseFloat(tokens[i - 1]) * 255);
    const g = Math.round(parseFloat(tokens[i - 2]) * 255);
    const r = Math.round(parseFloat(tokens[i - 3]) * 255);
    curColor =
      "#" +
      [r, g, b]
        .map((x) => x.toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase();
    i++;
  } else if (t === "m") {
    const y = parseFloat(tokens[i - 1]) + ty;
    const x = parseFloat(tokens[i - 2]) + tx;
    curCmds.push({ op: "M", args: [x, y] });
    curPts.push([x, y]);
    i++;
  } else if (t === "l") {
    const y = parseFloat(tokens[i - 1]) + ty;
    const x = parseFloat(tokens[i - 2]) + tx;
    curCmds.push({ op: "L", args: [x, y] });
    curPts.push([x, y]);
    i++;
  } else if (t === "c") {
    const y3 = parseFloat(tokens[i - 1]) + ty;
    const x3 = parseFloat(tokens[i - 2]) + tx;
    const y2 = parseFloat(tokens[i - 3]) + ty;
    const x2 = parseFloat(tokens[i - 4]) + tx;
    const y1 = parseFloat(tokens[i - 5]) + ty;
    const x1 = parseFloat(tokens[i - 6]) + tx;
    curCmds.push({ op: "C", args: [x1, y1, x2, y2, x3, y3] });
    curPts.push([x1, y1], [x2, y2], [x3, y3]);
    i++;
  } else if (t === "h") {
    curCmds.push({ op: "Z", args: [] });
    i++;
  } else if (t === "re") {
    const h = parseFloat(tokens[i - 1]);
    const w = parseFloat(tokens[i - 2]);
    const y = parseFloat(tokens[i - 3]) + ty;
    const x = parseFloat(tokens[i - 4]) + tx;
    if (Math.abs(w) < 500) {
      curCmds.push(
        { op: "M", args: [x, y] },
        { op: "L", args: [x + w, y] },
        { op: "L", args: [x + w, y + h] },
        { op: "L", args: [x, y + h] },
        { op: "Z", args: [] }
      );
      curPts.push([x, y], [x + w, y + h]);
    }
    i++;
  } else if (t === "f") {
    if (curCmds.length > 0) {
      shapes.push({
        idx: shapeIdx++,
        color: curColor,
        cmds: curCmds,
        pts: curPts,
      });
      curCmds = [];
      curPts = [];
    }
    i++;
  } else if (t === "W" || t === "W*" || t === "n") {
    curCmds = [];
    curPts = [];
    i++;
  } else {
    i++;
  }
}

let minX = Infinity;
let maxX = -Infinity;
let minY = Infinity;
let maxY = -Infinity;
for (const s of shapes) {
  for (const [x, y] of s.pts) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
}

// Offset so it fits cleanly inside 237x104 matching Asset 1.png
const padX = (237 - (maxX - minX)) / 2;
const padY = (104 - (maxY - minY)) / 2;

function cmdsToSvgPath(cmds, ox = minX - padX, oy = maxY + padY) {
  const fmt = (n) => Number(n.toFixed(3));
  return cmds
    .map((c) => {
      if (c.op === "M") {
        return `M${fmt(c.args[0] - ox)} ${fmt(oy - c.args[1])}`;
      }
      if (c.op === "L") {
        return `L${fmt(c.args[0] - ox)} ${fmt(oy - c.args[1])}`;
      }
      if (c.op === "C") {
        return `C${fmt(c.args[0] - ox)} ${fmt(oy - c.args[1])} ${fmt(
          c.args[2] - ox
        )} ${fmt(oy - c.args[3])} ${fmt(c.args[4] - ox)} ${fmt(
          oy - c.args[5]
        )}`;
      }
      if (c.op === "Z") return "Z";
      return "";
    })
    .join("");
}

// Group paths:
// Shapes 0..6: MALAK geometric mark
// Shapes 7..20: PLASTIC SURGEON
// Shape 21: Sparkle accent (#FF4FA3)
// Shapes 22..35: DR. MALAK ALSAIF
const malakMarkPaths = shapes.slice(0, 7).map((s) => cmdsToSvgPath(s.cmds));
const subtitlePaths = shapes.slice(7, 21).map((s) => cmdsToSvgPath(s.cmds));
const sparklePath = cmdsToSvgPath(shapes[21].cmds);
const doctorNamePaths = shapes.slice(22, 36).map((s) => cmdsToSvgPath(s.cmds));

function buildLogoSvg({
  markColor,
  textColor,
  sparkleColor = "#FF4FA3",
  title = "Dr. Malak Alsaif — Plastic Surgeon | د. ملاك السيف — استشارية جراحة التجميل والترميم",
}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 237 104" fill="none" role="img" aria-label="${title}">
  <title>${title}</title>
  <g id="malak-geometric-mark" fill="${markColor}">
    ${malakMarkPaths.map((d) => `<path d="${d}"/>`).join("\n    ")}
  </g>
  <g id="dr-malak-alsaif-wordmark" fill="${textColor}">
    ${doctorNamePaths.map((d) => `<path d="${d}"/>`).join("\n    ")}
  </g>
  <g id="plastic-surgeon-descriptor" fill="${textColor}">
    ${subtitlePaths.map((d) => `<path d="${d}"/>`).join("\n    ")}
  </g>
  <path id="brand-sparkle-accent" d="${sparklePath}" fill="${sparkleColor}"/>
</svg>
`;
}

// Dark background logo (matches supplied Asset 1.svg / Asset 1.png: white artwork + #FF4FA3 pink accent)
const darkBgSvg = buildLogoSvg({
  markColor: "#FFFFFF",
  textColor: "#FFFFFF",
  sparkleColor: "#FF4FA3",
});

// Light background logo (extracted from Brand PDF Page 2 & Page 4: Burgundy #A83232 mark + Dark Brown #3A1F1B text + #FF4FA3 accent)
const lightBgSvg = buildLogoSvg({
  markColor: "#A83232",
  textColor: "#3A1F1B",
  sparkleColor: "#FF4FA3",
});

fs.writeFileSync(path.join(BRAND_DIR, "Asset-1.svg"), darkBgSvg, "utf8");
fs.writeFileSync(path.join(BRAND_DIR, "malak-logo-dark-bg.svg"), darkBgSvg, "utf8");
fs.writeFileSync(path.join(BRAND_DIR, "malak-logo-light-bg.svg"), lightBgSvg, "utf8");
fs.copyFileSync(PNG_ASSET_PATH, path.join(BRAND_DIR, "Asset-1.png"));

// Also write a JSON data module with the exact vector paths so React components can inline the SVG cleanly
const logoVectorModule = `// Auto-generated from official brand identity PDF & Asset 1 vector paths
// Preserves exact geometry, proportions, clear space, and #FF4FA3 accent.
export const LOGO_VIEWBOX = "0 0 237 104";
export const MALAK_MARK_PATHS = ${JSON.stringify(malakMarkPaths, null, 2)} as const;
export const DOCTOR_NAME_PATHS = ${JSON.stringify(doctorNamePaths, null, 2)} as const;
export const SUBTITLE_PATHS = ${JSON.stringify(subtitlePaths, null, 2)} as const;
export const SPARKLE_ACCENT_PATH = ${JSON.stringify(sparklePath)} as const;
`;
const brandComponentDir = path.join(ROOT, "src", "components", "brand");
fs.mkdirSync(brandComponentDir, { recursive: true });
fs.writeFileSync(
  path.join(brandComponentDir, "logo-vectors.ts"),
  logoVectorModule,
  "utf8"
);

// 3. Build Favicon & App Icons derived from the authentic M-shaped logo path (Shape 0)
// Shape 0 is the exact M-shaped geometric mark from MALAK.
const mShape = shapes[0];
let mMinX = Infinity,
  mMaxX = -Infinity,
  mMinY = Infinity,
  mMaxY = -Infinity;
for (const [x, y] of mShape.pts) {
  if (x < mMinX) mMinX = x;
  if (x > mMaxX) mMaxX = x;
  if (y < mMinY) mMinY = y;
  if (y > mMaxY) mMaxY = y;
}
const mWidth = mMaxX - mMinX; // ~52.16
const mHeight = mMaxY - mMinY; // ~55.45

// Center M mark in a 100x100 coordinate space with generous breathing room
const iconBox = 100;
const scaleM = 58 / Math.max(mWidth, mHeight);
const mOffsetX = (iconBox - mWidth * scaleM) / 2;
const mOffsetY = (iconBox - mHeight * scaleM) / 2 + 2;

function cmdsToScaledMPath(cmds) {
  const fmt = (n) => Number(n.toFixed(2));
  return cmds
    .map((c) => {
      if (c.op === "M") {
        return `M${fmt((c.args[0] - mMinX) * scaleM + mOffsetX)} ${fmt(
          (mMaxY - c.args[1]) * scaleM + mOffsetY
        )}`;
      }
      if (c.op === "L") {
        return `L${fmt((c.args[0] - mMinX) * scaleM + mOffsetX)} ${fmt(
          (mMaxY - c.args[1]) * scaleM + mOffsetY
        )}`;
      }
      if (c.op === "C") {
        return `C${fmt((c.args[0] - mMinX) * scaleM + mOffsetX)} ${fmt(
          (mMaxY - c.args[1]) * scaleM + mOffsetY
        )} ${fmt((c.args[2] - mMinX) * scaleM + mOffsetX)} ${fmt(
          (mMaxY - c.args[3]) * scaleM + mOffsetY
        )} ${fmt((c.args[4] - mMinX) * scaleM + mOffsetX)} ${fmt(
          (mMaxY - c.args[5]) * scaleM + mOffsetY
        )}`;
      }
      if (c.op === "Z") return "Z";
      return "";
    })
    .join("");
}

const mFaviconPath = cmdsToScaledMPath(mShape.cmds);

// Also transform the authentic 4-point sparkle accent to sit cleanly near top-right/bottom-right of the M mark
const spShape = shapes[21];
let spMinX = Infinity,
  spMaxX = -Infinity,
  spMinY = Infinity,
  spMaxY = -Infinity;
for (const [x, y] of spShape.pts) {
  if (x < spMinX) spMinX = x;
  if (x > spMaxX) spMaxX = x;
  if (y < spMinY) spMinY = y;
  if (y > spMaxY) spMaxY = y;
}
const spScale = 1.35;
const spTargetX = 43.5;
const spTargetY = 17.5;
const spFaviconPath = spShape.cmds
  .map((c) => {
    const fmt = (n) => Number(n.toFixed(2));
    if (c.op === "M") {
      return `M${fmt((c.args[0] - spMinX) * spScale + spTargetX)} ${fmt(
        (spMaxY - c.args[1]) * spScale + spTargetY
      )}`;
    }
    if (c.op === "L") {
      return `L${fmt((c.args[0] - spMinX) * spScale + spTargetX)} ${fmt(
        (spMaxY - c.args[1]) * spScale + spTargetY
      )}`;
    }
    if (c.op === "C") {
      return `C${fmt((c.args[0] - spMinX) * spScale + spTargetX)} ${fmt(
        (spMaxY - c.args[1]) * spScale + spTargetY
      )} ${fmt((c.args[2] - spMinX) * spScale + spTargetX)} ${fmt(
        (spMaxY - c.args[3]) * spScale + spTargetY
      )} ${fmt((c.args[4] - spMinX) * spScale + spTargetX)} ${fmt(
        (spMaxY - c.args[5]) * spScale + spTargetY
      )}`;
    }
    if (c.op === "Z") return "Z";
    return "";
  })
  .join("");

function createFaviconSvg({ strokeBoost = 2.6, radius = 22 } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
  <rect width="100" height="100" rx="${radius}" fill="#A83232"/>
  <rect x="3" y="3" width="94" height="94" rx="${Math.max(0, radius - 2)}" stroke="#F2D6B3" stroke-opacity="0.28" stroke-width="1.5"/>
  <path d="${mFaviconPath}" fill="#FFFCF0" stroke="#FFFCF0" stroke-width="${strokeBoost}" stroke-linejoin="round" stroke-linecap="round"/>
  <path d="${spFaviconPath}" fill="#F2D6B3"/>
</svg>
`;
}

const iconSvgContent = createFaviconSvg({ strokeBoost: 2.8, radius: 22 });
const smallIconSvgContent = createFaviconSvg({ strokeBoost: 4.5, radius: 20 });
const appleTouchSvgContent = createFaviconSvg({ strokeBoost: 2.4, radius: 0 });

fs.writeFileSync(path.join(PUBLIC_DIR, "icon.svg"), iconSvgContent, "utf8");
fs.writeFileSync(path.join(BRAND_DIR, "favicon.svg"), iconSvgContent, "utf8");

// Helper to pack multiple PNG buffers into a standard ICO binary (16x16, 32x32, 48x48)
function createIcoFromPngBuffers(entries) {
  const count = entries.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  let offset = headerSize + count * dirEntrySize;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type 1 = ICO
  header.writeUInt16LE(count, 4);

  const dirEntries = [];
  for (const item of entries) {
    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(item.size >= 256 ? 0 : item.size, 0);
    entry.writeUInt8(item.size >= 256 ? 0 : item.size, 1);
    entry.writeUInt8(0, 2); // palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(item.buffer.length, 8);
    entry.writeUInt32LE(offset, 12);
    dirEntries.push(entry);
    offset += item.buffer.length;
  }

  return Buffer.concat([
    header,
    ...dirEntries,
    ...entries.map((e) => e.buffer),
  ]);
}

async function generateAllIconsAndOg() {
  const png16 = await sharp(Buffer.from(smallIconSvgContent))
    .resize(16, 16)
    .png()
    .toBuffer();
  const png32 = await sharp(Buffer.from(smallIconSvgContent))
    .resize(32, 32)
    .png()
    .toBuffer();
  const png48 = await sharp(Buffer.from(iconSvgContent))
    .resize(48, 48)
    .png()
    .toBuffer();
  const png180 = await sharp(Buffer.from(appleTouchSvgContent))
    .resize(180, 180)
    .png()
    .toBuffer();
  const png192 = await sharp(Buffer.from(iconSvgContent))
    .resize(192, 192)
    .png()
    .toBuffer();
  const png512 = await sharp(Buffer.from(iconSvgContent))
    .resize(512, 512)
    .png()
    .toBuffer();

  const icoBuffer = createIcoFromPngBuffers([
    { size: 16, buffer: png16 },
    { size: 32, buffer: png32 },
    { size: 48, buffer: png48 },
  ]);

  fs.writeFileSync(path.join(PUBLIC_DIR, "favicon.ico"), icoBuffer);
  fs.writeFileSync(path.join(PUBLIC_DIR, "favicon-16x16.png"), png16);
  fs.writeFileSync(path.join(PUBLIC_DIR, "favicon-32x32.png"), png32);
  fs.writeFileSync(path.join(PUBLIC_DIR, "favicon-48x48.png"), png48);
  fs.writeFileSync(path.join(PUBLIC_DIR, "apple-touch-icon.png"), png180);
  fs.writeFileSync(path.join(PUBLIC_DIR, "icon-192.png"), png192);
  fs.writeFileSync(path.join(PUBLIC_DIR, "icon-512.png"), png512);

  // Web App Manifest
  const manifest = {
    name: "د. ملاك السيف — استشارية جراحة التجميل والترميم | Dr. Malak Alsaif",
    short_name: "د. ملاك السيف",
    description:
      "عيادة الدكتورة ملاك السيف لاستشارات جراحة التجميل والترميم في الرياض",
    start_url: "/ar",
    display: "standalone",
    background_color: "#FFFCF0",
    theme_color: "#A83232",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
  fs.writeFileSync(
    path.join(PUBLIC_DIR, "site.webmanifest"),
    JSON.stringify(manifest, null, 2) + "\n",
    "utf8"
  );

  // 4. Generate 1200x630 Open Graph / Social Link Preview Image
  // Composition:
  // - Approved Burgundy (#A83232) canvas with Dark Brown (#3A1F1B) architectural framing
  // - Restrained Peach (#F2D6B3) and Warm Orange (#D96B2B) geometric details inspired by Brand PDF Page 7
  // - Authentic vector logo as the central focal point with generous safe margins
  const logoWidth = 540;
  const logoScale = logoWidth / 237;
  const logoHeight = 104 * logoScale; // ~236.96
  const logoX = (1200 - logoWidth) / 2; // 330
  const logoY = (630 - logoHeight) / 2 - 8; // ~188

  const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" fill="none">
  <!-- Base Dark Brown outer architectural border -->
  <rect width="1200" height="630" fill="#3A1F1B"/>
  
  <!-- Primary Burgundy main canvas -->
  <rect x="36" y="36" width="1128" height="558" rx="4" fill="#A83232"/>

  <!-- Subtle architectural brand pattern lines (from PDF Page 7) in restrained Peach (#F2D6B3) and Warm Orange (#D96B2B) -->
  <g opacity="0.22" stroke="#F2D6B3" stroke-width="1.5">
    <path d="M 36 150 L 180 150 L 260 36" />
    <path d="M 1164 480 L 1020 480 L 940 594" />
  </g>
  <g opacity="0.45" stroke="#D96B2B" stroke-width="2">
    <line x1="96" y1="96" x2="216" y2="96" />
    <line x1="96" y1="96" x2="96" y2="216" />
    <line x1="1104" y1="534" x2="984" y2="534" />
    <line x1="1104" y1="534" x2="1104" y2="414" />
  </g>

  <!-- Inner safe-margin hairline frame in Peach -->
  <rect x="76" y="76" width="1048" height="478" stroke="#F2D6B3" stroke-opacity="0.24" stroke-width="1"/>

  <!-- Small Warm Orange & Peach accent nodes -->
  <circle cx="96" cy="96" r="4" fill="#D96B2B"/>
  <circle cx="1104" cy="534" r="4" fill="#D96B2B"/>
  <rect x="560" y="458" width="80" height="2" fill="#F2D6B3" fill-opacity="0.55"/>

  <!-- Authentic Supplied Logo as Central Focal Point -->
  <g transform="translate(${logoX.toFixed(2)}, ${logoY.toFixed(2)}) scale(${logoScale.toFixed(4)})">
    <g fill="#FFFFFF">
      ${malakMarkPaths.map((d) => `<path d="${d}"/>`).join("\n      ")}
      ${doctorNamePaths.map((d) => `<path d="${d}"/>`).join("\n      ")}
      ${subtitlePaths.map((d) => `<path d="${d}"/>`).join("\n      ")}
    </g>
    <path d="${sparklePath}" fill="#FF4FA3"/>
  </g>
</svg>`;

  const ogPngPath = path.join(BRAND_DIR, "og-default-1200x630.png");
  await sharp(Buffer.from(ogSvg)).resize(1200, 630).png({ quality: 100 }).toFile(ogPngPath);

  const artifactDir = "C:/Users/elwady/.gemini/antigravity/brain/13985f7c-3def-417d-9868-54f5e7702ac6";
  fs.copyFileSync(ogPngPath, path.join(artifactDir, "og-default-1200x630.png"));

  const darkLogo = await sharp(path.join(BRAND_DIR, "malak-logo-dark-bg.svg")).resize(360).png().toBuffer();
  const lightLogo = await sharp(path.join(BRAND_DIR, "malak-logo-light-bg.svg")).resize(360).png().toBuffer();
  const apple96 = await sharp(png180).resize(96, 96).png().toBuffer();
  const sheetBg = `<svg width="960" height="420" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="480" height="240" fill="#A83232"/>
    <rect x="480" y="0" width="480" height="240" fill="#FFFCF0"/>
    <rect x="0" y="240" width="480" height="180" fill="#3A1F1B"/>
    <rect x="480" y="240" width="480" height="180" fill="#F2D6B3"/>
  </svg>`;
  await sharp(Buffer.from(sheetBg)).composite([
    { input: darkLogo, left: 60, top: 45 },
    { input: lightLogo, left: 540, top: 45 },
    { input: png16, left: 40, top: 320 },
    { input: png32, left: 90, top: 312 },
    { input: png48, left: 155, top: 304 },
    { input: apple96, left: 240, top: 280 },
    { input: png16, left: 520, top: 320 },
    { input: png32, left: 570, top: 312 },
    { input: png48, left: 635, top: 304 },
    { input: apple96, left: 720, top: 280 },
  ]).png().toFile(path.join(artifactDir, "brand-assets-inspection.png"));

  console.log("Generated all brand assets successfully:");
  console.log(" - public/brand/Asset-1.svg & public/brand/malak-logo-dark-bg.svg");
  console.log(" - public/brand/malak-logo-light-bg.svg");
  console.log(" - public/brand/Asset-1.png");
  console.log(" - public/icon.svg & public/favicon.ico (16, 32, 48)");
  console.log(" - public/apple-touch-icon.png (180x180)");
  console.log(" - public/icon-192.png & public/icon-512.png & public/site.webmanifest");
  console.log(" - public/brand/og-default-1200x630.png (1200x630)");
}

generateAllIconsAndOg().catch((err) => {
  console.error(err);
  process.exit(1);
});
