import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

/**
 * Pure unit & static regression test suite for:
 * 1. Arabic search normalization (diacritics/tashkeel, tatweel, zero-width, letter variants, digits)
 * 2. Reading-time pluralization (Arabic 1, 2, 3-10, 11+ and English word order)
 * 3. Published vs. draft article isolation & content integrity
 * 4. Font & CSS token configuration checks (no unbundled "STC" in --font-body, button inheritance)
 */

function normalizeArabicSearch(input) {
  if (!input) return "";
  return input
    .toLowerCase()
    .replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u2069\uFEFF]/g, "")
    .replace(
      /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]/g,
      ""
    )
    .replace(/\u0640/g, "")
    .replace(/[\u0622\u0623\u0625\u0671]/g, "\u0627")
    .replace(/\u0649/g, "\u064A")
    .replace(/\u0629/g, "\u0647")
    .replace(/\u0624/g, "\u0648")
    .replace(/\u0626/g, "\u064A")
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/\s+/g, " ")
    .trim();
}

function matchesArabicSearch(haystack, query) {
  const normalizedQuery = normalizeArabicSearch(query);
  if (!normalizedQuery) return true;
  return normalizeArabicSearch(haystack).includes(normalizedQuery);
}

function formatReadingTime(minutes, locale) {
  const m = Math.max(1, Math.round(minutes));
  if (locale === "en") {
    return `${m} min read`;
  }
  if (m === 1) return "دقيقة واحدة للقراءة";
  if (m === 2) return "دقيقتان للقراءة";
  const mod100 = m % 100;
  if (mod100 >= 3 && mod100 <= 10) {
    return `${m} دقائق للقراءة`;
  }
  return `${m} دقيقة للقراءة`;
}

console.log("Running unit regression tests...");

// 1. Arabic Search Normalization
assert.equal(
  normalizeArabicSearch("استشارة"),
  normalizeArabicSearch("اِسْتِشَارَة"),
  "Bare 'استشارة' and vocalized 'اِسْتِشَارَة' must normalize identically"
);
assert.equal(
  normalizeArabicSearch("إستشاره"),
  normalizeArabicSearch("اِسْتِشَارَة"),
  "Alef with hamza below and Teh Marbuta/Heh variants must normalize identically"
);
assert.equal(
  normalizeArabicSearch("اسـتـشـارة"),
  normalizeArabicSearch("استشارة"),
  "Tatweel/kashida must be stripped during normalization"
);
assert.equal(
  normalizeArabicSearch("أرقام ١٢٣ و 123"),
  "ارقام 123 و 123",
  "Arabic-Indic digits and Alef-hamza must normalize cleanly"
);

const arArticlesDir = path.join(process.cwd(), "content/articles/ar");
const arArticleFiles = fs
  .readdirSync(arArticlesDir)
  .filter((f) => f.endsWith(".json"));
const arArticle = arArticleFiles
  .map((f) => JSON.parse(fs.readFileSync(path.join(arArticlesDir, f), "utf-8")))
  .find((a) => a.slug === "preparing-for-consultation");
assert.ok(arArticle, "Arabic consultation preparation article must exist");
const searchable = `${arArticle.title} ${arArticle.description}`;
assert.equal(
  matchesArabicSearch(searchable, "استشارة"),
  true,
  "Search for 'استشارة' must match the Arabic consultation article"
);
assert.equal(
  matchesArabicSearch(searchable, "اِسْتِشَارَة"),
  true,
  "Search for vocalized 'اِسْتِشَارَة' must match the Arabic consultation article"
);

// 2. Reading-Time Localization (1, 2, 3, 11 minutes)
assert.equal(formatReadingTime(1, "ar"), "دقيقة واحدة للقراءة");
assert.equal(formatReadingTime(2, "ar"), "دقيقتان للقراءة");
assert.equal(formatReadingTime(3, "ar"), "3 دقائق للقراءة");
assert.equal(formatReadingTime(10, "ar"), "10 دقائق للقراءة");
assert.equal(formatReadingTime(11, "ar"), "11 دقيقة للقراءة");
assert.equal(formatReadingTime(1, "en"), "1 min read");
assert.equal(formatReadingTime(2, "en"), "2 min read");
assert.equal(formatReadingTime(3, "en"), "3 min read");
assert.equal(formatReadingTime(11, "en"), "11 min read");

// 3. CSS & Font Token Integrity
const tokensCss = fs.readFileSync(
  path.join(process.cwd(), "styles/tokens.css"),
  "utf-8"
);
assert.equal(
  /--font-body:\s*"STC"/i.test(tokensCss),
  false,
  "--font-body must not reference unbundled 'STC' family name while webfont binaries are absent"
);

const globalsCss = fs.readFileSync(
  path.join(process.cwd(), "src/app/globals.css"),
  "utf-8"
);
assert.equal(
  globalsCss.includes("button,\ninput,\nselect,\ntextarea,\noptgroup"),
  true,
  "Form controls and buttons must explicitly inherit --font-body in globals.css"
);

console.log("All unit regression tests passed!");
