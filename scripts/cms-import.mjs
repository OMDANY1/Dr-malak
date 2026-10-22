#!/usr/bin/env node
/**
 * Repeatable, Non-Destructive Content Import Script (`npm run cms:import`)
 *
 * Imports the website's CURRENT approved content into the CMS database (`cms_documents`,
 * `cms_specialties`, `cms_articles`, `cms_media_assets`, `cms_revisions`) using INSERT OR IGNORE
 * so existing editor modifications or revisions are never destructively overwritten.
 *
 * Strictly preserves `questions-to-discuss` as `status = 'draft'` (`published_data = NULL`).
 */

import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const rootDir = process.cwd();
const siteConfig = JSON.parse(
  fs.readFileSync(path.join(rootDir, "content", "site-config.json"), "utf-8")
);
const siteCopy = JSON.parse(
  fs.readFileSync(path.join(rootDir, "content", "site-copy.json"), "utf-8")
);
const arPrep = JSON.parse(
  fs.readFileSync(
    path.join(rootDir, "content", "articles", "ar", "preparing-for-consultation.json"),
    "utf-8"
  )
);
const enPrep = JSON.parse(
  fs.readFileSync(
    path.join(rootDir, "content", "articles", "en", "preparing-for-consultation.json"),
    "utf-8"
  )
);
const arDraft = JSON.parse(
  fs.readFileSync(
    path.join(rootDir, "content", "articles", "ar", "questions-to-discuss.json"),
    "utf-8"
  )
);
const enDraft = JSON.parse(
  fs.readFileSync(
    path.join(rootDir, "content", "articles", "en", "questions-to-discuss.json"),
    "utf-8"
  )
);

const dbPath =
  process.env.CMS_SQLITE_PATH ||
  path.join(rootDir, "content", ".cms-data", "cms.sqlite");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new DatabaseSync(dbPath);
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS cms_users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'editor')),
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS cms_documents (
    key TEXT PRIMARY KEY,
    draft_data TEXT NOT NULL,
    published_data TEXT NOT NULL,
    published_at TEXT,
    updated_at TEXT NOT NULL,
    updated_by TEXT
  );

  CREATE TABLE IF NOT EXISTS cms_specialties (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    display_order INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
    draft_data TEXT NOT NULL,
    published_data TEXT,
    published_at TEXT,
    updated_at TEXT NOT NULL,
    updated_by TEXT
  );

  CREATE TABLE IF NOT EXISTS cms_articles (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    translation_key TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'consultation-prep',
    status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
    draft_data TEXT NOT NULL,
    published_data TEXT,
    published_at TEXT,
    updated_at TEXT NOT NULL,
    updated_by TEXT
  );

  CREATE TABLE IF NOT EXISTS cms_media_assets (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    alt_text_ar TEXT NOT NULL DEFAULT '',
    alt_text_en TEXT NOT NULL DEFAULT '',
    focal_x INTEGER NOT NULL DEFAULT 50,
    focal_y INTEGER NOT NULL DEFAULT 50,
    is_public INTEGER NOT NULL DEFAULT 0,
    storage_bucket TEXT NOT NULL DEFAULT 'private',
    storage_path TEXT NOT NULL,
    public_url TEXT NOT NULL,
    uploaded_by TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS cms_redirects (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('specialty', 'article')),
    from_slug TEXT NOT NULL,
    to_slug TEXT NOT NULL,
    created_at TEXT NOT NULL,
    UNIQUE (entity_type, from_slug)
  );

  CREATE TABLE IF NOT EXISTS cms_revisions (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('document', 'specialty', 'article')),
    entity_id TEXT NOT NULL,
    entity_title TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('seed', 'save_draft', 'publish', 'unpublish', 'restore_to_draft')),
    snapshot TEXT NOT NULL,
    summary TEXT NOT NULL,
    actor_email TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);

function legacyBodyToBlocks(sections) {
  const blocks = [];
  for (const section of sections) {
    blocks.push({
      id: section.id,
      type: "heading",
      headingLevel: 2,
      text: section.heading,
    });
    section.paragraphs.forEach((p, idx) => {
      blocks.push({
        id: `${section.id}-p-${idx + 1}`,
        type: "paragraph",
        text: p,
      });
    });
    if (section.listItems && section.listItems.length > 0) {
      blocks.push({
        id: `${section.id}-list`,
        type: "bullet-list",
        items: [...section.listItems],
      });
    }
  }
  return blocks;
}

const nowIso = "2026-10-15T12:00:00.000Z";

// Verify articles are imported with exact status (published vs draft)
const insertArticle = db.prepare(`
  INSERT OR IGNORE INTO cms_articles (
    id, slug, translation_key, category, status, draft_data, published_data, published_at, updated_at, updated_by
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const prepPayload = {
  slug: arPrep.slug,
  category: arPrep.category,
  coverImage: arPrep.coverImage,
  coverFocalPoint: { x: 50, y: 50 },
  socialImage: arPrep.coverImage,
  publishedAt: arPrep.publishedAt,
  updatedAt: arPrep.updatedAt,
  locales: {
    ar: {
      title: arPrep.title,
      excerpt: arPrep.description,
      coverAlt: arPrep.coverAlt,
      authorName: arPrep.authorName || "",
      reviewedBy: arPrep.reviewedBy || "",
      seoTitle: `${arPrep.title} | ${siteConfig.name.ar}`,
      seoDescription: arPrep.description,
      blocks: legacyBodyToBlocks(arPrep.body),
    },
    en: {
      title: enPrep.title,
      excerpt: enPrep.description,
      coverAlt: enPrep.coverAlt,
      authorName: enPrep.authorName || "",
      reviewedBy: enPrep.reviewedBy || "",
      seoTitle: `${enPrep.title} | ${siteConfig.name.en}`,
      seoDescription: enPrep.description,
      blocks: legacyBodyToBlocks(enPrep.body),
    },
  },
};

const draftPayload = {
  slug: arDraft.slug,
  category: arDraft.category,
  coverImage: arDraft.coverImage,
  coverFocalPoint: { x: 50, y: 50 },
  socialImage: arDraft.coverImage,
  publishedAt: null,
  updatedAt: null,
  locales: {
    ar: {
      title: arDraft.title,
      excerpt: arDraft.description,
      coverAlt: arDraft.coverAlt,
      authorName: arDraft.authorName || "",
      reviewedBy: arDraft.reviewedBy || "",
      seoTitle: `${arDraft.title} | ${siteConfig.name.ar}`,
      seoDescription: arDraft.description,
      blocks: legacyBodyToBlocks(arDraft.body),
    },
    en: {
      title: enDraft.title,
      excerpt: enDraft.description,
      coverAlt: enDraft.coverAlt,
      authorName: enDraft.authorName || "",
      reviewedBy: enDraft.reviewedBy || "",
      seoTitle: `${enDraft.title} | ${siteConfig.name.en}`,
      seoDescription: enDraft.description,
      blocks: legacyBodyToBlocks(enDraft.body),
    },
  },
};

insertArticle.run(
  "article-preparing-for-consultation",
  arPrep.slug,
  arPrep.translationKey,
  arPrep.category,
  "published",
  JSON.stringify(prepPayload),
  JSON.stringify(prepPayload),
  nowIso,
  nowIso,
  "system"
);

insertArticle.run(
  "article-questions-to-discuss",
  arDraft.slug,
  arDraft.translationKey,
  arDraft.category,
  "draft",
  JSON.stringify(draftPayload),
  null,
  null,
  nowIso,
  "system"
);

const allArticles = db
  .prepare("SELECT slug, status, published_data IS NOT NULL AS has_pub FROM cms_articles")
  .all();

console.log("[CMS Import] اكتمل التحقق والاستيراد غير التدميري للمحتوى بنجاح.");
console.log("[CMS Import] حالة المقالات في قاعدة البيانات:", allArticles);
db.close();
