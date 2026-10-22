import { formatReadingTime } from "@/lib/arabic-search";
import type { Locale } from "@/lib/locales";
import type {
  FocalPoint,
  LocalizedText,
  RichTextBlock,
  RichTextBlockType,
  TranslationCompletenessReport,
} from "./types";

/**
 * Strips all HTML tags, scripts, styles, and control characters from plain text fields.
 * Prevents arbitrary HTML, CSS, or JavaScript injection.
 */
export function sanitizePlainText(input: unknown, maxLength = 5000): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<\/?[a-z][^>]*>/gi, "")
    .replace(/javascript\s*:/gi, "")
    .replace(/vbscript\s*:/gi, "")
    .replace(/data\s*:\s*text\/html/gi, "")
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, maxLength);
}

/**
 * Sanitizes a localized text pair explicitly without copying Arabic into English.
 */
export function sanitizeLocalizedText(
  input: unknown,
  maxLength = 5000
): LocalizedText {
  const obj =
    input && typeof input === "object"
      ? (input as Record<string, unknown>)
      : {};
  return {
    ar: sanitizePlainText(obj.ar, maxLength),
    en: sanitizePlainText(obj.en, maxLength),
  };
}

/**
 * Sanitizes URLs and CTA destinations. Blocks javascript:, vbscript:, and data: URLs.
 */
export function sanitizeUrl(input: unknown, fallback = ""): string {
  if (typeof input !== "string") return fallback;
  const trimmed = input.trim();
  if (!trimmed) return fallback;

  const lower = trimmed.toLowerCase().replace(/\s+/g, "");
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("vbscript:") ||
    lower.startsWith("data:")
  ) {
    return fallback;
  }

  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:")
  ) {
    return trimmed.slice(0, 1024);
  }

  return fallback;
}

/**
 * Sanitizes a URL-safe slug (lowercase ASCII letters, digits, and hyphens).
 */
export function sanitizeSlug(input: unknown, fallback = "item"): string {
  if (typeof input !== "string") return fallback;
  const cleaned = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return cleaned || fallback;
}

/**
 * Clamps focal point coordinates to [0, 100].
 */
export function sanitizeFocalPoint(input: unknown): FocalPoint {
  const obj =
    input && typeof input === "object"
      ? (input as Record<string, unknown>)
      : {};
  const rawX = typeof obj.x === "number" ? obj.x : Number(obj.x ?? 50);
  const rawY = typeof obj.y === "number" ? obj.y : Number(obj.y ?? 50);
  return {
    x: Number.isFinite(rawX)
      ? Math.min(100, Math.max(0, Math.round(rawX)))
      : 50,
    y: Number.isFinite(rawY)
      ? Math.min(100, Math.max(0, Math.round(rawY)))
      : 50,
  };
}

/**
 * Sanitizes inline rich text, allowing only safe <strong>, <em>, <b>, <i>, and <a href="..."> tags.
 * Strips all event handlers (on*), style attributes, script/iframe/object tags, and unsafe protocols.
 */
export function sanitizeRichTextInline(input: unknown, maxLength = 8000): string {
  if (typeof input !== "string") return "";

  // First remove dangerous block tags with their contents
  let text = input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object[\s\S]*?>[\s\S]*?<\/object>/gi, "")
    .replace(/<embed[\s\S]*?>/gi, "")
    .replace(/\u0000/g, "");

  // Tokenize allowed tags so we can escape everything else safely
  const tokens: string[] = [];
  const putToken = (replacement: string) => {
    const idx = tokens.length;
    tokens.push(replacement);
    return `__CMS_TAG_${idx}__`;
  };

  text = text.replace(/<\s*(\/?)\s*(strong|b|em|i)\s*>/gi, (_m, slash, tag) => {
    const normalized =
      tag.toLowerCase() === "b"
        ? "strong"
        : tag.toLowerCase() === "i"
        ? "em"
        : tag.toLowerCase();
    return putToken(`<${slash ? "/" : ""}${normalized}>`);
  });

  text = text.replace(
    /<\s*a\s+[^>]*href\s*=\s*["']([^"']+)["'][^>]*>/gi,
    (_m, href) => {
      const safeHref = sanitizeUrl(href, "");
      if (!safeHref) return "";
      const isExternal =
        safeHref.startsWith("http://") || safeHref.startsWith("https://");
      const relAttr = isExternal
        ? ' target="_blank" rel="noopener noreferrer"'
        : "";
      return putToken(`<a href="${safeHref}"${relAttr}>`);
    }
  );

  text = text.replace(/<\s*\/\s*a\s*>/gi, () => putToken("</a>"));

  // Strip any remaining HTML tags
  text = text.replace(/<\/?[a-z][^>]*>/gi, "");

  // Restore safe tokens
  text = text.replace(/__CMS_TAG_(\d+)__/g, (_m, idxStr) => {
    return tokens[Number(idxStr)] ?? "";
  });

  return text.trim().slice(0, maxLength);
}

const VALID_BLOCK_TYPES: Set<RichTextBlockType> = new Set([
  "heading",
  "paragraph",
  "bullet-list",
  "ordered-list",
  "image",
  "callout",
]);

/**
 * Sanitizes an array of structured rich-text blocks for articles.
 */
export function sanitizeRichTextBlocks(input: unknown): RichTextBlock[] {
  if (!Array.isArray(input)) return [];

  const sanitized: RichTextBlock[] = [];

  for (let i = 0; i < input.length; i++) {
    const raw = input[i];
    if (!raw || typeof raw !== "object") continue;
    const obj = raw as Record<string, unknown>;
    const rawType = String(obj.type || "paragraph") as RichTextBlockType;
    const type: RichTextBlockType = VALID_BLOCK_TYPES.has(rawType)
      ? rawType
      : "paragraph";
    const id =
      sanitizeSlug(obj.id, `block-${i + 1}`) || `block-${i + 1}`;

    if (type === "heading") {
      const text = sanitizePlainText(obj.text, 400);
      if (!text) continue;
      const level = obj.headingLevel === 3 ? 3 : 2;
      sanitized.push({
        id,
        type: "heading",
        headingLevel: level,
        text,
      });
    } else if (type === "paragraph" || type === "callout") {
      const text = sanitizeRichTextInline(obj.text, 6000);
      if (!text) continue;
      const linkHref = sanitizeUrl(obj.linkHref, "");
      const linkLabel = sanitizePlainText(obj.linkLabel, 200);
      sanitized.push({
        id,
        type,
        text,
        ...(linkHref ? { linkHref } : {}),
        ...(linkLabel ? { linkLabel } : {}),
      });
    } else if (type === "bullet-list" || type === "ordered-list") {
      const rawItems = Array.isArray(obj.items) ? obj.items : [];
      const items = rawItems
        .map((item) => sanitizeRichTextInline(item, 1000))
        .filter(Boolean);
      if (items.length === 0) continue;
      sanitized.push({
        id,
        type,
        items,
      });
    } else if (type === "image") {
      const imageUrl = sanitizeUrl(obj.imageUrl, "");
      if (!imageUrl) continue;
      sanitized.push({
        id,
        type: "image",
        imageUrl,
        imageAlt: sanitizePlainText(obj.imageAlt, 400),
        imageCaption: sanitizePlainText(obj.imageCaption, 400),
      });
    }
  }

  return sanitized;
}

/**
 * Automatically calculates reading time in minutes from structured rich-text blocks,
 * and formats it grammatically in Arabic or English.
 */
export function calculateBlocksReadingTime(blocks: RichTextBlock[]): {
  minutes: number;
  labelAr: string;
  labelEn: string;
} {
  const textFragments: string[] = [];

  for (const block of blocks) {
    if (block.text) {
      textFragments.push(block.text.replace(/<\/?[a-z][^>]*>/gi, " "));
    }
    if (block.items && block.items.length > 0) {
      textFragments.push(
        block.items.map((item) => item.replace(/<\/?[a-z][^>]*>/gi, " ")).join(" ")
      );
    }
    if (block.imageCaption) {
      textFragments.push(block.imageCaption);
    }
  }

  const words = textFragments
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  const minutes = Math.max(1, Math.ceil(words / 180));
  return {
    minutes,
    labelAr: formatReadingTime(minutes, "ar"),
    labelEn: formatReadingTime(minutes, "en"),
  };
}

/**
 * Evaluates Arabic and English translation completeness across a list of named localized fields.
 * Never copies Arabic into English.
 */
export function evaluateTranslationCompleteness(
  fields: Array<{ label: string; value: LocalizedText }>
): TranslationCompletenessReport {
  if (fields.length === 0) {
    return {
      arPercent: 100,
      enPercent: 100,
      missingArFields: [],
      missingEnFields: [],
      isArComplete: true,
      isEnComplete: true,
    };
  }

  const missingArFields: string[] = [];
  const missingEnFields: string[] = [];

  for (const field of fields) {
    if (!field.value?.ar || field.value.ar.trim().length === 0) {
      missingArFields.push(field.label);
    }
    if (!field.value?.en || field.value.en.trim().length === 0) {
      missingEnFields.push(field.label);
    }
  }

  const total = fields.length;
  const arFilled = total - missingArFields.length;
  const enFilled = total - missingEnFields.length;

  return {
    arPercent: Math.round((arFilled / total) * 100),
    enPercent: Math.round((enFilled / total) * 100),
    missingArFields,
    missingEnFields,
    isArComplete: missingArFields.length === 0,
    isEnComplete: missingEnFields.length === 0,
  };
}

/**
 * Safely resolves localized text for public display.
 * If the requested locale is missing/empty, falls back cleanly to the provided fallback or opposite locale
 * at render time without mutating stored data.
 */
export function resolveLocalizedText(
  text: LocalizedText | undefined | null,
  locale: Locale,
  fallback = ""
): string {
  if (!text) return fallback;
  const primary = text[locale]?.trim();
  if (primary) return primary;
  const fallbackVal = fallback.trim();
  if (fallbackVal) return fallbackVal;
  const opposite = locale === "ar" ? text.en?.trim() : text.ar?.trim();
  return opposite || "";
}

export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Validates binary image magic bytes and extracts actual pixel dimensions (width, height).
 * Strictly blocks SVG, HTML, executables (.exe, .sh, .bat, .php, .js), and spoofed files.
 */
export function inspectAndValidateImageBuffer(
  buffer: Buffer,
  declaredMimeType: string,
  originalFilename: string
): {
  valid: boolean;
  error?: string;
  detectedMime?: "image/jpeg" | "image/png" | "image/webp";
  extension?: "jpg" | "png" | "webp";
  width?: number;
  height?: number;
} {
  const lowerName = originalFilename.toLowerCase().trim();

  // Explicitly block SVG, scripts, and executables by filename
  if (
    lowerName.endsWith(".svg") ||
    lowerName.endsWith(".svgz") ||
    lowerName.endsWith(".html") ||
    lowerName.endsWith(".htm") ||
    lowerName.endsWith(".js") ||
    lowerName.endsWith(".mjs") ||
    lowerName.endsWith(".exe") ||
    lowerName.endsWith(".bat") ||
    lowerName.endsWith(".cmd") ||
    lowerName.endsWith(".sh") ||
    lowerName.endsWith(".php") ||
    declaredMimeType.toLowerCase().includes("svg") ||
    declaredMimeType.toLowerCase().includes("xml") ||
    declaredMimeType.toLowerCase().includes("html") ||
    declaredMimeType.toLowerCase().includes("javascript")
  ) {
    return {
      valid: false,
      error:
        "نوع الملف غير مسموح به أمنيًا. يُمنع رفع ملفات SVG أو الملفات التنفيذية أو البرمجية. الصيغ المسموحة: JPG و PNG و WebP فقط.",
    };
  }

  if (buffer.length === 0) {
    return {
      valid: false,
      error: "الملف المرفوع فارغ.",
    };
  }

  if (buffer.length > MAX_UPLOAD_SIZE_BYTES) {
    return {
      valid: false,
      error: "حجم الصورة يتجاوز الحد الأقصى المسموح به (5 ميجابايت).",
    };
  }

  // Check magic bytes for PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 24 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    return {
      valid: true,
      detectedMime: "image/png",
      extension: "png",
      width: width || 1200,
      height: height || 800,
    };
  }

  // Check magic bytes for JPEG: FF D8 FF
  if (
    buffer.length >= 4 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    let offset = 2;
    let width = 1200;
    let height = 800;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset++;
        continue;
      }
      const marker = buffer[offset + 1];
      if (marker === 0xff) {
        offset++;
        continue;
      }
      // SOF0..SOF3, SOF5..SOF7, SOF9..SOF11, SOF13..SOF15
      if (
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf)
      ) {
        height = buffer.readUInt16BE(offset + 5);
        width = buffer.readUInt16BE(offset + 7);
        break;
      }
      if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) {
        offset += 2;
      } else {
        const segLen = buffer.readUInt16BE(offset + 2);
        if (segLen < 2) break;
        offset += 2 + segLen;
      }
    }

    return {
      valid: true,
      detectedMime: "image/jpeg",
      extension: "jpg",
      width,
      height,
    };
  }

  // Check magic bytes for WebP: "RIFF" .... "WEBP"
  if (
    buffer.length >= 30 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    const chunkType = buffer.toString("ascii", 12, 16);
    let width = 1200;
    let height = 800;
    if (chunkType === "VP8 " && buffer.length >= 30) {
      width = buffer.readUInt16LE(26) & 0x3fff;
      height = buffer.readUInt16LE(28) & 0x3fff;
    } else if (chunkType === "VP8L" && buffer.length >= 25) {
      const b0 = buffer[21];
      const b1 = buffer[22];
      const b2 = buffer[23];
      const b3 = buffer[24];
      width = 1 + (((b1 & 0x3f) << 8) | b0);
      height = 1 + (((b3 & 0xf) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
    } else if (chunkType === "VP8X" && buffer.length >= 30) {
      width = 1 + buffer.readUIntLE(24, 3);
      height = 1 + buffer.readUIntLE(27, 3);
    }

    return {
      valid: true,
      detectedMime: "image/webp",
      extension: "webp",
      width,
      height,
    };
  }

  return {
    valid: false,
    error:
      "تعذر التحقق من صيغة الصورة. يُسمح فقط بملفات الصور القياسية (JPG, PNG, WebP) السليمة.",
  };
}
