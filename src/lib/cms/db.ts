import crypto from "crypto";
import fs from "fs";
import path from "path";
import { DatabaseSync } from "node:sqlite";
import { hashPassword, verifyPassword } from "./auth";
import {
  inspectAndValidateImageBuffer,
  sanitizeFocalPoint,
  sanitizeLocalizedText,
  sanitizePlainText,
  sanitizeRichTextBlocks,
  sanitizeSlug,
  sanitizeUrl,
} from "./sanitize";
import {
  buildSeedArticles,
  buildSeedContactSettingsDocument,
  buildSeedDoctorProfileDocument,
  buildSeedFaqDocument,
  buildSeedHomepageDocument,
  buildSeedMediaAssets,
  buildSeedSpecialties,
} from "./seed-data";
import type {
  AdminCmsState,
  CmsArticleContent,
  CmsArticleRecord,
  CmsContactSettingsDocument,
  CmsFaqDocument,
  CmsMediaAsset,
  CmsRedirect,
  CmsRevision,
  CmsRevisionAction,
  CmsRole,
  CmsSpecialtyContent,
  CmsSpecialtyRecord,
  CmsUser,
  DoctorProfileDocument,
  HomepageDocument,
  HomepageSectionConfig,
  HomepageSectionId,
  LocalizedText,
  PublicCmsSnapshot,
} from "./types";

export class CmsError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 400, code = "CMS_ERROR") {
    super(message);
    this.name = "CmsError";
    this.status = status;
    this.code = code;
  }
}

export function getStorageMode():
  | "supabase"
  | "sqlite-local"
  | "serverless-readonly" {
  const hasSupabase =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (hasSupabase) return "supabase";
  if (process.env.VERCEL === "1" && !process.env.CMS_SQLITE_PATH) {
    return "serverless-readonly";
  }
  return "sqlite-local";
}

export function assertWritableStorage(): void {
  const mode = getStorageMode();
  if (mode === "serverless-readonly") {
    throw new CmsError(
      "بيئة المعاينة السحابية الحالية تعمل بدون ربط مفاتيح قاعدة بيانات Supabase (NEXT_PUBLIC_SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY). التعديلات تحفظ فعليًا في بيئة التطوير المحلية (SQLite) أو فور ضبط متغيرات Supabase على Vercel؛ لا يقوم النظام بمحاكاة الحفظ الوهمي.",
      503,
      "CLOUD_DB_NOT_CONFIGURED"
    );
  }
}

function getDataDirectory(): string {
  if (process.env.CMS_DATA_DIR) {
    return process.env.CMS_DATA_DIR;
  }
  if (process.env.VERCEL === "1") {
    return path.join("/tmp", "dr-malak-cms-data");
  }
  return path.join(process.cwd(), "content", ".cms-data");
}

function getSqliteDbPath(): string {
  if (process.env.CMS_SQLITE_PATH) {
    return process.env.CMS_SQLITE_PATH;
  }
  return path.join(getDataDirectory(), "cms.sqlite");
}

export function getPrivateMediaDir(): string {
  return path.join(getDataDirectory(), "private-media");
}

export function getPublicUploadsDir(): string {
  if (process.env.CMS_PUBLIC_UPLOADS_DIR) {
    return process.env.CMS_PUBLIC_UPLOADS_DIR;
  }
  if (process.env.VERCEL === "1") {
    return path.join("/tmp", "dr-malak-cms-public-uploads");
  }
  return path.join(process.cwd(), "public", "uploads", "cms");
}

let cachedDb: DatabaseSync | null = null;
let cachedDbPath: string | null = null;

function getDb(): DatabaseSync {
  const dbPath = getSqliteDbPath();
  if (cachedDb && cachedDbPath === dbPath) {
    return cachedDb;
  }

  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  fs.mkdirSync(getPrivateMediaDir(), { recursive: true });
  try {
    fs.mkdirSync(getPublicUploadsDir(), { recursive: true });
  } catch {
    // Ignore on read-only public dir in serverless
  }

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

  cachedDb = db;
  cachedDbPath = dbPath;

  seedDatabaseIfNeeded(db);
  provisionEnvUsersIfNeeded(db);

  return db;
}

export function resetCmsDbCacheForTests(): void {
  if (cachedDb) {
    try {
      cachedDb.close();
    } catch {
      // ignore
    }
  }
  cachedDb = null;
  cachedDbPath = null;
}

function recordRevisionInternal(
  db: DatabaseSync,
  params: {
    entityType: "document" | "specialty" | "article";
    entityId: string;
    entityTitle: string;
    action: CmsRevisionAction;
    snapshot: unknown;
    summary: string;
    actorEmail: string;
    actorRole: CmsRole | "system";
  }
): CmsRevision {
  const id = `rev-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  const createdAt = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO cms_revisions (
      id, entity_type, entity_id, entity_title, action, snapshot, summary, actor_email, actor_role, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    id,
    params.entityType,
    params.entityId,
    params.entityTitle,
    params.action,
    JSON.stringify(params.snapshot),
    params.summary,
    params.actorEmail,
    params.actorRole,
    createdAt
  );
  return {
    id,
    entityType: params.entityType,
    entityId: params.entityId,
    entityTitle: params.entityTitle,
    action: params.action,
    snapshot: params.snapshot,
    summary: params.summary,
    actorEmail: params.actorEmail,
    actorRole: params.actorRole,
    createdAt,
  };
}

/**
 * Repeatable, non-destructive seed of current approved site content.
 */
export function seedDatabaseIfNeeded(dbInstance?: DatabaseSync): {
  seededDocuments: number;
  seededSpecialties: number;
  seededArticles: number;
  seededMedia: number;
} {
  const db = dbInstance ?? getDb();
  const nowIso = "2026-10-15T12:00:00.000Z";

  let seededDocuments = 0;
  let seededSpecialties = 0;
  let seededArticles = 0;
  let seededMedia = 0;

  const insertDoc = db.prepare(`
    INSERT OR IGNORE INTO cms_documents (key, draft_data, published_data, published_at, updated_at, updated_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const docsToSeed: Array<{ key: string; title: string; data: unknown }> = [
    {
      key: "homepage",
      title: "الصفحة الرئيسية",
      data: buildSeedHomepageDocument(),
    },
    {
      key: "doctorProfile",
      title: "الملف المهني للدكتورة",
      data: buildSeedDoctorProfileDocument(),
    },
    {
      key: "faq",
      title: "الأسئلة الشائعة",
      data: buildSeedFaqDocument(),
    },
    {
      key: "contactSettings",
      title: "بيانات التواصل وإعدادات الموقع",
      data: buildSeedContactSettingsDocument(),
    },
  ];

  for (const doc of docsToSeed) {
    const json = JSON.stringify(doc.data);
    const res = insertDoc.run(doc.key, json, json, nowIso, nowIso, "system");
    if (res.changes > 0) {
      seededDocuments++;
      recordRevisionInternal(db, {
        entityType: "document",
        entityId: doc.key,
        entityTitle: doc.title,
        action: "seed",
        snapshot: doc.data,
        summary: `استيراد المحتوى المعتمد الأولي (${doc.title})`,
        actorEmail: "system@local",
        actorRole: "system",
      });
    }
  }

  const insertSpec = db.prepare(`
    INSERT OR IGNORE INTO cms_specialties (
      id, slug, display_order, status, draft_data, published_data, published_at, updated_at, updated_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const spec of buildSeedSpecialties()) {
    const draftJson = JSON.stringify(spec.draft);
    const pubJson = spec.published ? JSON.stringify(spec.published) : null;
    const res = insertSpec.run(
      spec.id,
      spec.slug,
      spec.displayOrder,
      spec.status,
      draftJson,
      pubJson,
      spec.publishedAt,
      spec.updatedAt,
      "system"
    );
    if (res.changes > 0) {
      seededSpecialties++;
      recordRevisionInternal(db, {
        entityType: "specialty",
        entityId: spec.id,
        entityTitle: spec.draft.title.ar,
        action: "seed",
        snapshot: spec.draft,
        summary: `استيراد تخصص معتمد (${spec.draft.title.ar})`,
        actorEmail: "system@local",
        actorRole: "system",
      });
    }
  }

  const insertArticle = db.prepare(`
    INSERT OR IGNORE INTO cms_articles (
      id, slug, translation_key, category, status, draft_data, published_data, published_at, updated_at, updated_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const article of buildSeedArticles()) {
    const draftJson = JSON.stringify(article.draft);
    const pubJson = article.published ? JSON.stringify(article.published) : null;
    const res = insertArticle.run(
      article.id,
      article.slug,
      article.translationKey,
      article.category,
      article.status,
      draftJson,
      pubJson,
      article.publishedAt,
      article.updatedAt,
      "system"
    );
    if (res.changes > 0) {
      seededArticles++;
      recordRevisionInternal(db, {
        entityType: "article",
        entityId: article.id,
        entityTitle: article.draft.locales.ar.title,
        action: "seed",
        snapshot: article.draft,
        summary:
          article.status === "published"
            ? `استيراد مقال منشور (${article.draft.locales.ar.title})`
            : `استيراد مسودة مقال غير منشور (${article.draft.locales.ar.title})`,
        actorEmail: "system@local",
        actorRole: "system",
      });
    }
  }

  const insertMedia = db.prepare(`
    INSERT OR IGNORE INTO cms_media_assets (
      id, filename, original_name, mime_type, size_bytes, width, height,
      alt_text_ar, alt_text_en, focal_x, focal_y, is_public,
      storage_bucket, storage_path, public_url, uploaded_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const asset of buildSeedMediaAssets()) {
    const res = insertMedia.run(
      asset.id,
      asset.filename,
      asset.originalName,
      asset.mimeType,
      asset.sizeBytes,
      asset.width,
      asset.height,
      asset.altText.ar,
      asset.altText.en,
      asset.focalPoint.x,
      asset.focalPoint.y,
      asset.isPublic ? 1 : 0,
      asset.storageBucket,
      asset.storagePath,
      asset.publicUrl,
      asset.uploadedBy,
      asset.createdAt,
      asset.updatedAt
    );
    if (res.changes > 0) {
      seededMedia++;
    }
  }

  return {
    seededDocuments,
    seededSpecialties,
    seededArticles,
    seededMedia,
  };
}

function provisionEnvUsersIfNeeded(db: DatabaseSync): void {
  const ownerEmail = process.env.CMS_INITIAL_OWNER_EMAIL?.trim().toLowerCase();
  const ownerPass = process.env.CMS_INITIAL_OWNER_PASSWORD;
  if (ownerEmail && ownerPass && ownerPass.length >= 8) {
    const existing = db
      .prepare("SELECT id FROM cms_users WHERE email = ?")
      .get(ownerEmail);
    if (!existing) {
      const now = new Date().toISOString();
      db.prepare(
        `INSERT INTO cms_users (id, email, password_hash, display_name, role, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'owner', 1, ?, ?)`
      ).run(
        `user-owner-${crypto.randomBytes(4).toString("hex")}`,
        ownerEmail,
        hashPassword(ownerPass),
        "مالكة الموقع (د. ملاك السيف)",
        now,
        now
      );
    }
  }

  const editorEmail = process.env.CMS_INITIAL_EDITOR_EMAIL?.trim().toLowerCase();
  const editorPass = process.env.CMS_INITIAL_EDITOR_PASSWORD;
  if (editorEmail && editorPass && editorPass.length >= 8) {
    const existing = db
      .prepare("SELECT id FROM cms_users WHERE email = ?")
      .get(editorEmail);
    if (!existing) {
      const now = new Date().toISOString();
      db.prepare(
        `INSERT INTO cms_users (id, email, password_hash, display_name, role, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'editor', 1, ?, ?)`
      ).run(
        `user-editor-${crypto.randomBytes(4).toString("hex")}`,
        editorEmail,
        hashPassword(editorPass),
        "محرر المحتوى",
        now,
        now
      );
    }
  }
}

// ============================================================================
// User & Authentication Repository Functions
// ============================================================================

function mapUserRow(row: Record<string, unknown>): CmsUser {
  return {
    id: String(row.id),
    email: String(row.email),
    displayName: String(row.display_name),
    role: (row.role === "owner" ? "owner" : "editor") as CmsRole,
    isActive: Number(row.is_active) === 1,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function authenticateCmsUser(
  email: string,
  password: string
): CmsUser | null {
  const db = getDb();
  const normalizedEmail = email.trim().toLowerCase();
  const row = db
    .prepare("SELECT * FROM cms_users WHERE email = ?")
    .get(normalizedEmail) as Record<string, unknown> | undefined;

  if (!row) return null;
  if (Number(row.is_active) !== 1) return null;

  const valid = verifyPassword(password, String(row.password_hash));
  if (!valid) return null;

  return mapUserRow(row);
}

export function getCmsUserByEmail(email: string): CmsUser | null {
  const db = getDb();
  const normalizedEmail = email.trim().toLowerCase();
  const row = db
    .prepare("SELECT * FROM cms_users WHERE email = ?")
    .get(normalizedEmail) as Record<string, unknown> | undefined;
  if (!row || Number(row.is_active) !== 1) return null;
  return mapUserRow(row);
}

export function hasAnyProvisionedUsers(): boolean {
  try {
    const db = getDb();
    const row = db
      .prepare("SELECT COUNT(*) as cnt FROM cms_users WHERE is_active = 1")
      .get() as { cnt: number };
    return Number(row?.cnt ?? 0) > 0;
  } catch {
    return false;
  }
}

export function listCmsUsers(): CmsUser[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM cms_users ORDER BY role ASC, created_at ASC")
    .all() as Array<Record<string, unknown>>;
  return rows.map(mapUserRow);
}

export function provisionOrUpdateCmsUser(params: {
  email: string;
  password?: string;
  displayName: string;
  role: CmsRole;
  isActive?: boolean;
  bypassWritableCheckForCli?: boolean;
}): CmsUser {
  if (!params.bypassWritableCheckForCli) {
    assertWritableStorage();
  }
  const db = getDb();
  const normalizedEmail = sanitizePlainText(params.email, 200).toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    throw new CmsError("يُرجى إدخال بريد إلكتروني صحيح.", 400, "INVALID_EMAIL");
  }
  if (params.role !== "owner" && params.role !== "editor") {
    throw new CmsError("الدور الوظيفي غير صالح.", 400, "INVALID_ROLE");
  }

  const displayName =
    sanitizePlainText(params.displayName, 120) || normalizedEmail;
  const isActive = params.isActive === undefined ? true : Boolean(params.isActive);
  const now = new Date().toISOString();

  const existing = db
    .prepare("SELECT * FROM cms_users WHERE email = ?")
    .get(normalizedEmail) as Record<string, unknown> | undefined;

  if (existing) {
    const newHash =
      params.password && params.password.length >= 8
        ? hashPassword(params.password)
        : String(existing.password_hash);
    db.prepare(
      `UPDATE cms_users
       SET password_hash = ?, display_name = ?, role = ?, is_active = ?, updated_at = ?
       WHERE email = ?`
    ).run(
      newHash,
      displayName,
      params.role,
      isActive ? 1 : 0,
      now,
      normalizedEmail
    );
    const updated = db
      .prepare("SELECT * FROM cms_users WHERE email = ?")
      .get(normalizedEmail) as Record<string, unknown>;
    return mapUserRow(updated);
  }

  if (!params.password || params.password.length < 8) {
    throw new CmsError(
      "كلمة المرور للمستخدم الجديد يجب أن تتكون من 8 خانات على الأقل.",
      400,
      "WEAK_PASSWORD"
    );
  }

  const id = `user-${params.role}-${crypto.randomBytes(4).toString("hex")}`;
  db.prepare(
    `INSERT INTO cms_users (id, email, password_hash, display_name, role, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    normalizedEmail,
    hashPassword(params.password),
    displayName,
    params.role,
    isActive ? 1 : 0,
    now,
    now
  );

  const inserted = db
    .prepare("SELECT * FROM cms_users WHERE id = ?")
    .get(id) as Record<string, unknown>;
  return mapUserRow(inserted);
}

// ============================================================================
// Document Validation & Sanitization Helpers
// ============================================================================

const VALID_HOMEPAGE_SECTION_IDS: HomepageSectionId[] = [
  "specialties",
  "doctor",
  "steps",
  "journal",
  "faq",
  "booking",
];

function sanitizeHomepageDocument(input: unknown): HomepageDocument {
  const seed = buildSeedHomepageDocument();
  const obj =
    input && typeof input === "object"
      ? (input as Record<string, unknown>)
      : {};
  const heroObj =
    obj.hero && typeof obj.hero === "object"
      ? (obj.hero as Record<string, unknown>)
      : {};

  const rawSections = Array.isArray(obj.sections) ? obj.sections : seed.sections;
  const seenIds = new Set<HomepageSectionId>();
  const sanitizedSections: HomepageSectionConfig[] = [];

  for (let i = 0; i < rawSections.length; i++) {
    const s = rawSections[i];
    if (!s || typeof s !== "object") continue;
    const sObj = s as Record<string, unknown>;
    const id = String(sObj.id) as HomepageSectionId;
    if (!VALID_HOMEPAGE_SECTION_IDS.includes(id) || seenIds.has(id)) continue;
    seenIds.add(id);

    const fallbackSec = seed.sections.find((sec) => sec.id === id)!;
    sanitizedSections.push({
      id,
      visible: sObj.visible === undefined ? true : Boolean(sObj.visible),
      order: sanitizedSections.length + 1,
      eyebrow: sObj.eyebrow
        ? sanitizeLocalizedText(sObj.eyebrow, 200)
        : fallbackSec.eyebrow,
      title: sObj.title
        ? sanitizeLocalizedText(sObj.title, 300)
        : fallbackSec.title,
      supportingText: sObj.supportingText
        ? sanitizeLocalizedText(sObj.supportingText, 1200)
        : fallbackSec.supportingText,
    });
  }

  for (const fallbackSec of seed.sections) {
    if (!seenIds.has(fallbackSec.id)) {
      sanitizedSections.push({
        ...fallbackSec,
        order: sanitizedSections.length + 1,
      });
    }
  }

  return {
    hero: {
      eyebrow: heroObj.eyebrow
        ? sanitizeLocalizedText(heroObj.eyebrow, 200)
        : seed.hero.eyebrow,
      subtitle: heroObj.subtitle
        ? sanitizeLocalizedText(heroObj.subtitle, 200)
        : seed.hero.subtitle,
      title: heroObj.title
        ? sanitizeLocalizedText(heroObj.title, 300)
        : seed.hero.title,
      description: heroObj.description
        ? sanitizeLocalizedText(heroObj.description, 1000)
        : seed.hero.description,
      image: sanitizeUrl(heroObj.image, seed.hero.image),
      imageAlt: heroObj.imageAlt
        ? sanitizeLocalizedText(heroObj.imageAlt, 400)
        : seed.hero.imageAlt,
      focalPoint: sanitizeFocalPoint(heroObj.focalPoint ?? seed.hero.focalPoint),
      caption: heroObj.caption
        ? sanitizeLocalizedText(heroObj.caption, 300)
        : seed.hero.caption,
      editorialNote: heroObj.editorialNote
        ? sanitizeLocalizedText(heroObj.editorialNote, 300)
        : seed.hero.editorialNote,
      coordinationNote: heroObj.coordinationNote
        ? sanitizeLocalizedText(heroObj.coordinationNote, 300)
        : seed.hero.coordinationNote,
      primaryCtaLabel: heroObj.primaryCtaLabel
        ? sanitizeLocalizedText(heroObj.primaryCtaLabel, 160)
        : seed.hero.primaryCtaLabel,
      primaryCtaDestination: sanitizeUrl(
        heroObj.primaryCtaDestination,
        seed.hero.primaryCtaDestination
      ),
      secondaryCtaLabel: heroObj.secondaryCtaLabel
        ? sanitizeLocalizedText(heroObj.secondaryCtaLabel, 160)
        : seed.hero.secondaryCtaLabel,
      secondaryCtaDestination: sanitizeUrl(
        heroObj.secondaryCtaDestination,
        seed.hero.secondaryCtaDestination
      ),
    },
    sections: sanitizedSections,
  };
}

function sanitizeDoctorProfileDocument(input: unknown): DoctorProfileDocument {
  const seed = buildSeedDoctorProfileDocument();
  const obj =
    input && typeof input === "object"
      ? (input as Record<string, unknown>)
      : {};

  const bioParagraphsObj =
    obj.biographyParagraphs && typeof obj.biographyParagraphs === "object"
      ? (obj.biographyParagraphs as Record<string, unknown>)
      : {};

  const arParas = Array.isArray(bioParagraphsObj.ar)
    ? bioParagraphsObj.ar
        .map((p) => sanitizePlainText(p, 2000))
        .filter(Boolean)
    : seed.biographyParagraphs.ar;

  const enParas = Array.isArray(bioParagraphsObj.en)
    ? bioParagraphsObj.en
        .map((p) => sanitizePlainText(p, 2000))
        .filter(Boolean)
    : seed.biographyParagraphs.en;

  const rawCreds = Array.isArray(obj.credentials)
    ? obj.credentials
    : seed.credentials;
  const credentials = rawCreds
    .map((c, idx) => {
      if (!c || typeof c !== "object") return null;
      const cObj = c as Record<string, unknown>;
      return {
        id: sanitizeSlug(cObj.id, `cred-${idx + 1}`),
        label: sanitizeLocalizedText(cObj.label, 250),
        text: sanitizeLocalizedText(cObj.text, 800),
      };
    })
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  const rawPillars = Array.isArray(obj.approachPillars)
    ? obj.approachPillars
    : seed.approachPillars;
  const approachPillars = rawPillars
    .map((p, idx) => {
      if (!p || typeof p !== "object") return null;
      const pObj = p as Record<string, unknown>;
      return {
        id: sanitizeSlug(pObj.id, `pillar-${idx + 1}`),
        title: sanitizeLocalizedText(pObj.title, 250),
        body: sanitizeLocalizedText(pObj.body, 1000),
      };
    })
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  const seoObj =
    obj.seo && typeof obj.seo === "object"
      ? (obj.seo as Record<string, unknown>)
      : {};

  return {
    fullName: obj.fullName
      ? sanitizeLocalizedText(obj.fullName, 200)
      : seed.fullName,
    specialtyTitle: obj.specialtyTitle
      ? sanitizeLocalizedText(obj.specialtyTitle, 250)
      : seed.specialtyTitle,
    portraitImage: sanitizeUrl(obj.portraitImage, seed.portraitImage),
    portraitAlt: obj.portraitAlt
      ? sanitizeLocalizedText(obj.portraitAlt, 400)
      : seed.portraitAlt,
    portraitCaption: obj.portraitCaption
      ? sanitizeLocalizedText(obj.portraitCaption, 400)
      : seed.portraitCaption,
    portraitFocalPoint: sanitizeFocalPoint(
      obj.portraitFocalPoint ?? seed.portraitFocalPoint
    ),
    shortBio: obj.shortBio
      ? sanitizeLocalizedText(obj.shortBio, 1500)
      : seed.shortBio,
    biographyHeading: obj.biographyHeading
      ? sanitizeLocalizedText(obj.biographyHeading, 300)
      : seed.biographyHeading,
    biographyParagraphs: {
      ar: arParas,
      en: enParas,
    },
    editorialNotice: obj.editorialNotice
      ? sanitizeLocalizedText(obj.editorialNotice, 600)
      : seed.editorialNotice,
    credentialsEyebrow: obj.credentialsEyebrow
      ? sanitizeLocalizedText(obj.credentialsEyebrow, 200)
      : seed.credentialsEyebrow,
    credentialsHeading: obj.credentialsHeading
      ? sanitizeLocalizedText(obj.credentialsHeading, 300)
      : seed.credentialsHeading,
    credentialsNote: obj.credentialsNote
      ? sanitizeLocalizedText(obj.credentialsNote, 500)
      : seed.credentialsNote,
    credentials: credentials.length > 0 ? credentials : seed.credentials,
    approachEyebrow: obj.approachEyebrow
      ? sanitizeLocalizedText(obj.approachEyebrow, 200)
      : seed.approachEyebrow,
    approachTitle: obj.approachTitle
      ? sanitizeLocalizedText(obj.approachTitle, 300)
      : seed.approachTitle,
    approachPillars:
      approachPillars.length > 0 ? approachPillars : seed.approachPillars,
    seo: {
      title: seoObj.title
        ? sanitizeLocalizedText(seoObj.title, 300)
        : seed.seo.title,
      description: seoObj.description
        ? sanitizeLocalizedText(seoObj.description, 600)
        : seed.seo.description,
    },
  };
}

function sanitizeFaqDocument(input: unknown): CmsFaqDocument {
  const seed = buildSeedFaqDocument();
  const obj =
    input && typeof input === "object"
      ? (input as Record<string, unknown>)
      : {};
  const rawItems = Array.isArray(obj.items) ? obj.items : seed.items;
  const items = rawItems
    .map((item, idx) => {
      if (!item || typeof item !== "object") return null;
      const iObj = item as Record<string, unknown>;
      return {
        id: sanitizeSlug(iObj.id, `faq-${idx + 1}`),
        order: idx + 1,
        visible: iObj.visible === undefined ? true : Boolean(iObj.visible),
        question: sanitizeLocalizedText(iObj.question, 500),
        answer: sanitizeLocalizedText(iObj.answer, 2000),
      };
    })
    .filter((i): i is NonNullable<typeof i> => Boolean(i));

  return {
    eyebrow: obj.eyebrow
      ? sanitizeLocalizedText(obj.eyebrow, 200)
      : seed.eyebrow,
    title: obj.title ? sanitizeLocalizedText(obj.title, 300) : seed.title,
    intro: obj.intro ? sanitizeLocalizedText(obj.intro, 800) : seed.intro,
    items,
  };
}

function sanitizeContactSettingsDocument(
  input: unknown
): CmsContactSettingsDocument {
  const seed = buildSeedContactSettingsDocument();
  const obj =
    input && typeof input === "object"
      ? (input as Record<string, unknown>)
      : {};
  const bookingObj =
    obj.bookingCta && typeof obj.bookingCta === "object"
      ? (obj.bookingCta as Record<string, unknown>)
      : {};
  const seoObj =
    obj.globalSeo && typeof obj.globalSeo === "object"
      ? (obj.globalSeo as Record<string, unknown>)
      : {};

  const rawPhone = sanitizePlainText(obj.phone ?? seed.phone, 40);
  const rawWhatsappDigits = sanitizePlainText(
    obj.whatsappDigits ?? seed.whatsappDigits,
    40
  ).replace(/\D/g, "");

  return {
    siteName: obj.siteName
      ? sanitizeLocalizedText(obj.siteName, 200)
      : seed.siteName,
    siteSubtitle: obj.siteSubtitle
      ? sanitizeLocalizedText(obj.siteSubtitle, 250)
      : seed.siteSubtitle,
    phone: rawPhone || seed.phone,
    whatsappDigits: rawWhatsappDigits || seed.whatsappDigits,
    defaultWhatsappMessage: obj.defaultWhatsappMessage
      ? sanitizeLocalizedText(obj.defaultWhatsappMessage, 600)
      : seed.defaultWhatsappMessage,
    instagramUrl: sanitizeUrl(obj.instagramUrl, seed.instagramUrl),
    instagramHandle:
      sanitizePlainText(obj.instagramHandle ?? seed.instagramHandle, 80) ||
      seed.instagramHandle,
    // Optional fields: preserved as empty strings unless explicitly entered by editor
    address: obj.address
      ? sanitizeLocalizedText(obj.address, 500)
      : { ar: "", en: "" },
    workingHours: obj.workingHours
      ? sanitizeLocalizedText(obj.workingHours, 500)
      : { ar: "", en: "" },
    mapUrl: sanitizeUrl(obj.mapUrl, ""),
    bookingCta: {
      eyebrow: bookingObj.eyebrow
        ? sanitizeLocalizedText(bookingObj.eyebrow, 200)
        : seed.bookingCta.eyebrow,
      title: bookingObj.title
        ? sanitizeLocalizedText(bookingObj.title, 300)
        : seed.bookingCta.title,
      body: bookingObj.body
        ? sanitizeLocalizedText(bookingObj.body, 800)
        : seed.bookingCta.body,
      primaryLabel: bookingObj.primaryLabel
        ? sanitizeLocalizedText(bookingObj.primaryLabel, 160)
        : seed.bookingCta.primaryLabel,
      secondaryCallLabel: bookingObj.secondaryCallLabel
        ? sanitizeLocalizedText(bookingObj.secondaryCallLabel, 160)
        : seed.bookingCta.secondaryCallLabel,
    },
    globalSeo: {
      defaultTitle: seoObj.defaultTitle
        ? sanitizeLocalizedText(seoObj.defaultTitle, 300)
        : seed.globalSeo.defaultTitle,
      defaultDescription: seoObj.defaultDescription
        ? sanitizeLocalizedText(seoObj.defaultDescription, 600)
        : seed.globalSeo.defaultDescription,
      socialImage: sanitizeUrl(
        seoObj.socialImage,
        seed.globalSeo.socialImage
      ),
    },
  };
}

function sanitizeSpecialtyContent(
  input: unknown,
  fallbackSlug = "specialty"
): CmsSpecialtyContent {
  const obj =
    input && typeof input === "object"
      ? (input as Record<string, unknown>)
      : {};
  const slug = sanitizeSlug(obj.slug, fallbackSlug);
  return {
    slug,
    numberLabel: sanitizePlainText(obj.numberLabel ?? "01", 10) || "01",
    title: sanitizeLocalizedText(obj.title, 250),
    introduction: sanitizeLocalizedText(obj.introduction, 1200),
    fullContent: sanitizeLocalizedText(obj.fullContent, 5000),
    assessmentNote: sanitizeLocalizedText(obj.assessmentNote, 1000),
    visualCaption: sanitizeLocalizedText(obj.visualCaption, 500),
    coverImage: sanitizeUrl(
      obj.coverImage,
      "/images/generated/specialty-plastic-surgery.jpg"
    ),
    imageAlt: sanitizeLocalizedText(obj.imageAlt, 400),
    focalPoint: sanitizeFocalPoint(obj.focalPoint),
    ctaLabel: sanitizeLocalizedText(obj.ctaLabel, 200),
    whatsappMessage: sanitizeLocalizedText(obj.whatsappMessage, 600),
  };
}

function sanitizeArticleContent(
  input: unknown,
  fallbackSlug = "article"
): CmsArticleContent {
  const obj =
    input && typeof input === "object"
      ? (input as Record<string, unknown>)
      : {};
  const slug = sanitizeSlug(obj.slug, fallbackSlug);
  const category =
    sanitizeSlug(obj.category, "consultation-prep") || "consultation-prep";
  const coverImage = sanitizeUrl(
    obj.coverImage,
    "/images/generated/article-consultation-prep.jpg"
  );
  const socialImage = sanitizeUrl(obj.socialImage, coverImage);

  const localesObj =
    obj.locales && typeof obj.locales === "object"
      ? (obj.locales as Record<string, unknown>)
      : {};
  const arObj =
    localesObj.ar && typeof localesObj.ar === "object"
      ? (localesObj.ar as Record<string, unknown>)
      : {};
  const enObj =
    localesObj.en && typeof localesObj.en === "object"
      ? (localesObj.en as Record<string, unknown>)
      : {};

  // Explicitly sanitize Arabic and English separately — never copy Arabic into English
  return {
    slug,
    category,
    coverImage,
    coverFocalPoint: sanitizeFocalPoint(obj.coverFocalPoint),
    socialImage,
    publishedAt:
      typeof obj.publishedAt === "string" && obj.publishedAt.trim()
        ? sanitizePlainText(obj.publishedAt, 40)
        : null,
    updatedAt:
      typeof obj.updatedAt === "string" && obj.updatedAt.trim()
        ? sanitizePlainText(obj.updatedAt, 40)
        : null,
    locales: {
      ar: {
        title: sanitizePlainText(arObj.title, 300),
        excerpt: sanitizePlainText(arObj.excerpt, 1000),
        coverAlt: sanitizePlainText(arObj.coverAlt, 400),
        authorName: sanitizePlainText(arObj.authorName, 200),
        reviewedBy: sanitizePlainText(arObj.reviewedBy, 200),
        seoTitle: sanitizePlainText(arObj.seoTitle, 300),
        seoDescription: sanitizePlainText(arObj.seoDescription, 600),
        blocks: sanitizeRichTextBlocks(arObj.blocks),
      },
      en: {
        title: sanitizePlainText(enObj.title, 300),
        excerpt: sanitizePlainText(enObj.excerpt, 1000),
        coverAlt: sanitizePlainText(enObj.coverAlt, 400),
        authorName: sanitizePlainText(enObj.authorName, 200),
        reviewedBy: sanitizePlainText(enObj.reviewedBy, 200),
        seoTitle: sanitizePlainText(enObj.seoTitle, 300),
        seoDescription: sanitizePlainText(enObj.seoDescription, 600),
        blocks: sanitizeRichTextBlocks(enObj.blocks),
      },
    },
  };
}

// ============================================================================
// Private-to-Public Media Promotion & Reference Checks
// ============================================================================

function promoteReferencedPrivateMedia(db: DatabaseSync, urls: string[]): void {
  const uniqueUrls = Array.from(new Set(urls.filter(Boolean)));
  for (const url of uniqueUrls) {
    const match = url.match(/^\/api\/cms\/media\/file\/([a-zA-Z0-9_-]+)$/);
    const assetRow = match
      ? (db
          .prepare("SELECT * FROM cms_media_assets WHERE id = ?")
          .get(match[1]) as Record<string, unknown> | undefined)
      : (db
          .prepare("SELECT * FROM cms_media_assets WHERE public_url = ?")
          .get(url) as Record<string, unknown> | undefined);

    if (assetRow && Number(assetRow.is_public) === 0) {
      promoteMediaAssetToPublicInternal(db, String(assetRow.id));
    }
  }
}

function promoteMediaAssetToPublicInternal(
  db: DatabaseSync,
  assetId: string
): string {
  const row = db
    .prepare("SELECT * FROM cms_media_assets WHERE id = ?")
    .get(assetId) as Record<string, unknown> | undefined;
  if (!row) return "";

  const filename = String(row.filename);
  const privatePath = path.join(getPrivateMediaDir(), filename);
  const publicDir = getPublicUploadsDir();
  const publicFilePath = path.join(publicDir, filename);
  const publicUrl = `/uploads/cms/${filename}`;

  try {
    fs.mkdirSync(publicDir, { recursive: true });
    if (fs.existsSync(privatePath) && !fs.existsSync(publicFilePath)) {
      fs.copyFileSync(privatePath, publicFilePath);
    }
  } catch {
    // If public folder copy fails, /api/cms/media/file/[id] also serves assets with is_public = 1
  }

  const now = new Date().toISOString();
  db.prepare(
    `UPDATE cms_media_assets
     SET is_public = 1, storage_bucket = 'public', public_url = ?, updated_at = ?
     WHERE id = ?`
  ).run(
    fs.existsSync(publicFilePath) ? publicUrl : `/api/cms/media/file/${assetId}`,
    now,
    assetId
  );

  return fs.existsSync(publicFilePath)
    ? publicUrl
    : `/api/cms/media/file/${assetId}`;
}

function findPublishedReferencesForMedia(
  db: DatabaseSync,
  asset: CmsMediaAsset
): string[] {
  const references: string[] = [];
  const candidateUrls = new Set<string>([
    asset.publicUrl,
    asset.storagePath,
    `/api/cms/media/file/${asset.id}`,
    `/uploads/cms/${asset.filename}`,
  ]);

  const containsAsset = (jsonStr: string | null | undefined): boolean => {
    if (!jsonStr) return false;
    for (const u of candidateUrls) {
      if (u && jsonStr.includes(u)) return true;
    }
    return false;
  };

  // Check published documents
  const docRows = db
    .prepare("SELECT key, published_data FROM cms_documents")
    .all() as Array<{ key: string; published_data: string }>;
  const docNames: Record<string, string> = {
    homepage: "الصفحة الرئيسية (المنشورة)",
    doctorProfile: "الملف المهني للدكتورة (المنشور)",
    faq: "الأسئلة الشائعة (المنشورة)",
    contactSettings: "إعدادات الموقع وبيانات التواصل (المنشورة)",
  };
  for (const doc of docRows) {
    if (containsAsset(doc.published_data)) {
      references.push(docNames[doc.key] || doc.key);
    }
  }

  // Check published specialties
  const specRows = db
    .prepare(
      "SELECT slug, published_data FROM cms_specialties WHERE status = 'published'"
    )
    .all() as Array<{ slug: string; published_data: string | null }>;
  for (const spec of specRows) {
    if (containsAsset(spec.published_data)) {
      references.push(`تخصص منشور (${spec.slug})`);
    }
  }

  // Check published articles
  const artRows = db
    .prepare(
      "SELECT slug, published_data FROM cms_articles WHERE status = 'published'"
    )
    .all() as Array<{ slug: string; published_data: string | null }>;
  for (const art of artRows) {
    if (containsAsset(art.published_data)) {
      references.push(`مقال منشور (${art.slug})`);
    }
  }

  return references;
}

// ============================================================================
// Redirect Management
// ============================================================================

function recordSlugRedirect(
  db: DatabaseSync,
  entityType: "specialty" | "article",
  fromSlug: string,
  toSlug: string
): void {
  const cleanFrom = sanitizeSlug(fromSlug, "");
  const cleanTo = sanitizeSlug(toSlug, "");
  if (!cleanFrom || !cleanTo || cleanFrom === cleanTo) return;

  const now = new Date().toISOString();

  // Remove any loop where toSlug redirected to fromSlug
  db.prepare(
    "DELETE FROM cms_redirects WHERE entity_type = ? AND from_slug = ?"
  ).run(entityType, cleanTo);

  // Update any older redirects that pointed to cleanFrom so they now point directly to cleanTo
  db.prepare(
    "UPDATE cms_redirects SET to_slug = ? WHERE entity_type = ? AND to_slug = ?"
  ).run(cleanTo, entityType, cleanFrom);

  // Upsert cleanFrom -> cleanTo
  db.prepare(
    `INSERT INTO cms_redirects (id, entity_type, from_slug, to_slug, created_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(entity_type, from_slug) DO UPDATE SET to_slug = excluded.to_slug, created_at = excluded.created_at`
  ).run(
    `redir-${entityType}-${crypto.randomBytes(4).toString("hex")}`,
    entityType,
    cleanFrom,
    cleanTo,
    now
  );
}

export function resolveSlugRedirect(
  entityType: "specialty" | "article",
  requestedSlug: string
): string | null {
  try {
    const db = getDb();
    const row = db
      .prepare(
        "SELECT to_slug FROM cms_redirects WHERE entity_type = ? AND from_slug = ?"
      )
      .get(entityType, requestedSlug) as { to_slug: string } | undefined;
    return row ? String(row.to_slug) : null;
  } catch {
    return null;
  }
}

// ============================================================================
// Document Mutations (Save Draft & Publish)
// ============================================================================

const DOCUMENT_TITLES: Record<string, string> = {
  homepage: "الصفحة الرئيسية",
  doctorProfile: "الملف المهني للدكتورة",
  faq: "الأسئلة الشائعة",
  contactSettings: "بيانات التواصل وإعدادات الموقع",
};

export function saveDocumentDraft(
  key: "homepage" | "doctorProfile" | "faq" | "contactSettings",
  payload: unknown,
  actor: { email: string; role: CmsRole },
  summaryNote?: string
): unknown {
  assertWritableStorage();
  const db = getDb();

  let sanitized: unknown;
  if (key === "homepage") {
    sanitized = sanitizeHomepageDocument(payload);
  } else if (key === "doctorProfile") {
    sanitized = sanitizeDoctorProfileDocument(payload);
  } else if (key === "faq") {
    sanitized = sanitizeFaqDocument(payload);
  } else if (key === "contactSettings") {
    sanitized = sanitizeContactSettingsDocument(payload);
  } else {
    throw new CmsError("مفتاح المستند غير معروف.", 400, "INVALID_DOC_KEY");
  }

  const now = new Date().toISOString();
  db.prepare(
    `UPDATE cms_documents
     SET draft_data = ?, updated_at = ?, updated_by = ?
     WHERE key = ?`
  ).run(JSON.stringify(sanitized), now, actor.email, key);

  recordRevisionInternal(db, {
    entityType: "document",
    entityId: key,
    entityTitle: DOCUMENT_TITLES[key] || key,
    action: "save_draft",
    snapshot: sanitized,
    summary:
      sanitizePlainText(summaryNote, 300) ||
      `حفظ مسودة ${DOCUMENT_TITLES[key] || key}`,
    actorEmail: actor.email,
    actorRole: actor.role,
  });

  return sanitized;
}

export function publishDocument(
  key: "homepage" | "doctorProfile" | "faq" | "contactSettings",
  actor: { email: string; role: CmsRole },
  draftPayload?: unknown,
  summaryNote?: string
): unknown {
  assertWritableStorage();
  if (actor.role !== "owner") {
    throw new CmsError(
      "صلاحية النشر المباشر متاحة لدور المالك (Owner) فقط. يمكن للمحرر حفظ المسودات ومعاينتها.",
      403,
      "FORBIDDEN_ROLE"
    );
  }

  const db = getDb();

  if (draftPayload !== undefined) {
    saveDocumentDraft(key, draftPayload, actor, "تحديث المسودة قبل النشر");
  }

  const row = db
    .prepare("SELECT draft_data FROM cms_documents WHERE key = ?")
    .get(key) as { draft_data: string } | undefined;

  if (!row) {
    throw new CmsError("المستند المطلوب غير موجود.", 404, "NOT_FOUND");
  }

  const draftObj = JSON.parse(row.draft_data);

  // Promote any referenced private media assets to public
  if (key === "homepage") {
    const hp = draftObj as HomepageDocument;
    promoteReferencedPrivateMedia(db, [hp.hero.image]);
  } else if (key === "doctorProfile") {
    const dp = draftObj as DoctorProfileDocument;
    promoteReferencedPrivateMedia(db, [dp.portraitImage]);
  } else if (key === "contactSettings") {
    const cs = draftObj as CmsContactSettingsDocument;
    promoteReferencedPrivateMedia(db, [cs.globalSeo.socialImage]);
  }

  const now = new Date().toISOString();
  db.prepare(
    `UPDATE cms_documents
     SET published_data = draft_data, published_at = ?, updated_at = ?, updated_by = ?
     WHERE key = ?`
  ).run(now, now, actor.email, key);

  recordRevisionInternal(db, {
    entityType: "document",
    entityId: key,
    entityTitle: DOCUMENT_TITLES[key] || key,
    action: "publish",
    snapshot: draftObj,
    summary:
      sanitizePlainText(summaryNote, 300) ||
      `نشر ${DOCUMENT_TITLES[key] || key} على الموقع العام`,
    actorEmail: actor.email,
    actorRole: actor.role,
  });

  return draftObj;
}

// ============================================================================
// Specialties Mutations (Save Draft, Publish, Unpublish)
// ============================================================================

function mapSpecialtyRow(row: Record<string, unknown>): CmsSpecialtyRecord {
  const draft = JSON.parse(String(row.draft_data)) as CmsSpecialtyContent;
  const published = row.published_data
    ? (JSON.parse(String(row.published_data)) as CmsSpecialtyContent)
    : null;
  return {
    id: String(row.id),
    slug: String(row.slug),
    displayOrder: Number(row.display_order),
    status: row.status === "published" ? "published" : "draft",
    draft,
    published,
    publishedAt: row.published_at ? String(row.published_at) : null,
    updatedAt: String(row.updated_at),
  };
}

export function saveSpecialtyDraft(
  id: string,
  payload: unknown,
  displayOrder: number | undefined,
  actor: { email: string; role: CmsRole },
  summaryNote?: string
): CmsSpecialtyRecord {
  assertWritableStorage();
  const db = getDb();

  const cleanId = sanitizeSlug(id, `spec-${Date.now()}`);
  const sanitized = sanitizeSpecialtyContent(payload, cleanId);

  if (!sanitized.title.ar.trim()) {
    throw new CmsError(
      "عنوان التخصص باللغة العربية مطلوب.",
      400,
      "VALIDATION_ERROR"
    );
  }

  // Check slug uniqueness across other specialties
  const slugConflict = db
    .prepare("SELECT id FROM cms_specialties WHERE slug = ? AND id != ?")
    .get(sanitized.slug, cleanId);
  if (slugConflict) {
    throw new CmsError(
      `المعرّف الرابط (Slug: ${sanitized.slug}) مستخدم بالفعل في تخصص آخر.`,
      409,
      "SLUG_CONFLICT"
    );
  }

  const existing = db
    .prepare("SELECT * FROM cms_specialties WHERE id = ?")
    .get(cleanId) as Record<string, unknown> | undefined;

  const now = new Date().toISOString();
  const orderVal =
    typeof displayOrder === "number" && Number.isFinite(displayOrder)
      ? Math.max(1, Math.round(displayOrder))
      : existing
      ? Number(existing.display_order)
      : 4;

  // Keep the public slug column unchanged until publish if already published, or update if still draft
  const rowSlug =
    existing && existing.status === "published" && existing.published_data
      ? (JSON.parse(String(existing.published_data)) as CmsSpecialtyContent).slug
      : sanitized.slug;

  if (existing) {
    db.prepare(
      `UPDATE cms_specialties
       SET slug = ?, display_order = ?, draft_data = ?, updated_at = ?, updated_by = ?
       WHERE id = ?`
    ).run(
      rowSlug,
      orderVal,
      JSON.stringify(sanitized),
      now,
      actor.email,
      cleanId
    );
  } else {
    db.prepare(
      `INSERT INTO cms_specialties (
        id, slug, display_order, status, draft_data, published_data, published_at, updated_at, updated_by
      ) VALUES (?, ?, ?, 'draft', ?, NULL, NULL, ?, ?)`
    ).run(
      cleanId,
      sanitized.slug,
      orderVal,
      JSON.stringify(sanitized),
      now,
      actor.email
    );
  }

  recordRevisionInternal(db, {
    entityType: "specialty",
    entityId: cleanId,
    entityTitle: sanitized.title.ar,
    action: "save_draft",
    snapshot: sanitized,
    summary:
      sanitizePlainText(summaryNote, 300) ||
      `حفظ مسودة تخصص (${sanitized.title.ar})`,
    actorEmail: actor.email,
    actorRole: actor.role,
  });

  const updated = db
    .prepare("SELECT * FROM cms_specialties WHERE id = ?")
    .get(cleanId) as Record<string, unknown>;
  return mapSpecialtyRow(updated);
}

export function publishSpecialty(
  id: string,
  actor: { email: string; role: CmsRole },
  draftPayload?: unknown,
  displayOrder?: number,
  summaryNote?: string
): CmsSpecialtyRecord {
  assertWritableStorage();
  if (actor.role !== "owner") {
    throw new CmsError(
      "صلاحية نشر التخصصات متاحة لدور المالك (Owner) فقط.",
      403,
      "FORBIDDEN_ROLE"
    );
  }

  const db = getDb();
  if (draftPayload !== undefined) {
    saveSpecialtyDraft(id, draftPayload, displayOrder, actor);
  }

  const cleanId = sanitizeSlug(id, id);
  const existing = db
    .prepare("SELECT * FROM cms_specialties WHERE id = ?")
    .get(cleanId) as Record<string, unknown> | undefined;

  if (!existing) {
    throw new CmsError("التخصص المطلوب غير موجود.", 404, "NOT_FOUND");
  }

  const draft = JSON.parse(String(existing.draft_data)) as CmsSpecialtyContent;
  const oldPublished = existing.published_data
    ? (JSON.parse(String(existing.published_data)) as CmsSpecialtyContent)
    : null;

  // Check slug conflict with other specialties
  const slugConflict = db
    .prepare("SELECT id FROM cms_specialties WHERE slug = ? AND id != ?")
    .get(draft.slug, cleanId);
  if (slugConflict) {
    throw new CmsError(
      `المعرّف الرابط (${draft.slug}) مستخدم بالفعل في تخصص آخر.`,
      409,
      "SLUG_CONFLICT"
    );
  }

  // If previously published under a different slug, create an automatic redirect
  if (oldPublished && oldPublished.slug && oldPublished.slug !== draft.slug) {
    recordSlugRedirect(db, "specialty", oldPublished.slug, draft.slug);
  }

  promoteReferencedPrivateMedia(db, [draft.coverImage]);

  const now = new Date().toISOString();
  db.prepare(
    `UPDATE cms_specialties
     SET slug = ?, status = 'published', published_data = draft_data, published_at = ?, updated_at = ?, updated_by = ?
     WHERE id = ?`
  ).run(draft.slug, now, now, actor.email, cleanId);

  recordRevisionInternal(db, {
    entityType: "specialty",
    entityId: cleanId,
    entityTitle: draft.title.ar,
    action: "publish",
    snapshot: draft,
    summary:
      sanitizePlainText(summaryNote, 300) ||
      `نشر تخصص (${draft.title.ar}) على الموقع العام`,
    actorEmail: actor.email,
    actorRole: actor.role,
  });

  const updated = db
    .prepare("SELECT * FROM cms_specialties WHERE id = ?")
    .get(cleanId) as Record<string, unknown>;
  return mapSpecialtyRow(updated);
}

export function unpublishSpecialty(
  id: string,
  actor: { email: string; role: CmsRole }
): CmsSpecialtyRecord {
  assertWritableStorage();
  if (actor.role !== "owner") {
    throw new CmsError(
      "صلاحية إلغاء النشر متاحة لدور المالك (Owner) فقط.",
      403,
      "FORBIDDEN_ROLE"
    );
  }

  const db = getDb();
  const cleanId = sanitizeSlug(id, id);
  const existing = db
    .prepare("SELECT * FROM cms_specialties WHERE id = ?")
    .get(cleanId) as Record<string, unknown> | undefined;

  if (!existing) {
    throw new CmsError("التخصص المطلوب غير موجود.", 404, "NOT_FOUND");
  }

  const draft = JSON.parse(String(existing.draft_data)) as CmsSpecialtyContent;
  const now = new Date().toISOString();

  db.prepare(
    `UPDATE cms_specialties
     SET status = 'draft', published_data = NULL, updated_at = ?, updated_by = ?
     WHERE id = ?`
  ).run(now, actor.email, cleanId);

  recordRevisionInternal(db, {
    entityType: "specialty",
    entityId: cleanId,
    entityTitle: draft.title.ar,
    action: "unpublish",
    snapshot: draft,
    summary: `إلغاء نشر التخصص (${draft.title.ar}) وتحويله إلى مسودة`,
    actorEmail: actor.email,
    actorRole: actor.role,
  });

  const updated = db
    .prepare("SELECT * FROM cms_specialties WHERE id = ?")
    .get(cleanId) as Record<string, unknown>;
  return mapSpecialtyRow(updated);
}

// ============================================================================
// Articles Mutations (Save Draft, Publish, Unpublish)
// ============================================================================

function mapArticleRow(row: Record<string, unknown>): CmsArticleRecord {
  const draft = JSON.parse(String(row.draft_data)) as CmsArticleContent;
  const published = row.published_data
    ? (JSON.parse(String(row.published_data)) as CmsArticleContent)
    : null;
  return {
    id: String(row.id),
    slug: String(row.slug),
    translationKey: String(row.translation_key),
    category: String(row.category),
    status: row.status === "published" ? "published" : "draft",
    draft,
    published,
    publishedAt: row.published_at ? String(row.published_at) : null,
    updatedAt: String(row.updated_at),
  };
}

export function saveArticleDraft(
  id: string,
  payload: unknown,
  actor: { email: string; role: CmsRole },
  summaryNote?: string
): CmsArticleRecord {
  assertWritableStorage();
  const db = getDb();

  const cleanId = sanitizeSlug(id, `article-${Date.now()}`);
  const sanitized = sanitizeArticleContent(payload, cleanId);

  if (!sanitized.locales.ar.title.trim()) {
    throw new CmsError(
      "عنوان المقال باللغة العربية مطلوب لحفظ المسودة.",
      400,
      "VALIDATION_ERROR"
    );
  }

  // Check slug conflict with other articles
  const slugConflict = db
    .prepare("SELECT id FROM cms_articles WHERE slug = ? AND id != ?")
    .get(sanitized.slug, cleanId);
  if (slugConflict) {
    throw new CmsError(
      `المعرّف الرابط (${sanitized.slug}) مستخدم بالفعل في مقال آخر.`,
      409,
      "SLUG_CONFLICT"
    );
  }

  const existing = db
    .prepare("SELECT * FROM cms_articles WHERE id = ?")
    .get(cleanId) as Record<string, unknown> | undefined;

  const now = new Date().toISOString();
  sanitized.updatedAt = now.slice(0, 10);

  const rowSlug =
    existing && existing.status === "published" && existing.published_data
      ? (JSON.parse(String(existing.published_data)) as CmsArticleContent).slug
      : sanitized.slug;

  if (existing) {
    db.prepare(
      `UPDATE cms_articles
       SET slug = ?, category = ?, draft_data = ?, updated_at = ?, updated_by = ?
       WHERE id = ?`
    ).run(
      rowSlug,
      sanitized.category,
      JSON.stringify(sanitized),
      now,
      actor.email,
      cleanId
    );
  } else {
    db.prepare(
      `INSERT INTO cms_articles (
        id, slug, translation_key, category, status, draft_data, published_data, published_at, updated_at, updated_by
      ) VALUES (?, ?, ?, ?, 'draft', ?, NULL, NULL, ?, ?)`
    ).run(
      cleanId,
      sanitized.slug,
      sanitized.slug,
      sanitized.category,
      JSON.stringify(sanitized),
      now,
      actor.email
    );
  }

  recordRevisionInternal(db, {
    entityType: "article",
    entityId: cleanId,
    entityTitle: sanitized.locales.ar.title,
    action: "save_draft",
    snapshot: sanitized,
    summary:
      sanitizePlainText(summaryNote, 300) ||
      `حفظ مسودة مقال (${sanitized.locales.ar.title})`,
    actorEmail: actor.email,
    actorRole: actor.role,
  });

  const updated = db
    .prepare("SELECT * FROM cms_articles WHERE id = ?")
    .get(cleanId) as Record<string, unknown>;
  return mapArticleRow(updated);
}

export function publishArticle(
  id: string,
  actor: { email: string; role: CmsRole },
  draftPayload?: unknown,
  summaryNote?: string
): CmsArticleRecord {
  assertWritableStorage();
  if (actor.role !== "owner") {
    throw new CmsError(
      "صلاحية نشر المقالات متاحة لدور المالك (Owner) فقط.",
      403,
      "FORBIDDEN_ROLE"
    );
  }

  const db = getDb();
  if (draftPayload !== undefined) {
    saveArticleDraft(id, draftPayload, actor);
  }

  const cleanId = sanitizeSlug(id, id);
  const existing = db
    .prepare("SELECT * FROM cms_articles WHERE id = ?")
    .get(cleanId) as Record<string, unknown> | undefined;

  if (!existing) {
    throw new CmsError("المقال المطلوب غير موجود.", 404, "NOT_FOUND");
  }

  const draft = JSON.parse(String(existing.draft_data)) as CmsArticleContent;
  const oldPublished = existing.published_data
    ? (JSON.parse(String(existing.published_data)) as CmsArticleContent)
    : null;

  if (
    !draft.locales.ar.title.trim() ||
    draft.locales.ar.blocks.length === 0
  ) {
    throw new CmsError(
      "لا يمكن نشر المقال بدون عنوان ومحتوى عربي مكتمل.",
      400,
      "INCOMPLETE_ARTICLE"
    );
  }

  // Guard: never publish unreviewed sample draft placeholder authorName
  if (
    draft.locales.ar.authorName.includes("مسودة تحريرية — بانتظار المراجعة") ||
    draft.locales.en.authorName.includes("Pending Medical Review")
  ) {
    throw new CmsError(
      "تنبيه تحريري: هذا المقال يحمل وسم «مسودة تحريرية — بانتظار المراجعة الطبية». يُرجى تحديث اسم المُعِدّ أو المراجع الطبي واعتماد المحتوى قبل النشر العام.",
      400,
      "SAMPLE_DRAFT_GUARD"
    );
  }

  const slugConflict = db
    .prepare("SELECT id FROM cms_articles WHERE slug = ? AND id != ?")
    .get(draft.slug, cleanId);
  if (slugConflict) {
    throw new CmsError(
      `المعرّف الرابط (${draft.slug}) مستخدم بالفعل في مقال آخر.`,
      409,
      "SLUG_CONFLICT"
    );
  }

  if (oldPublished && oldPublished.slug && oldPublished.slug !== draft.slug) {
    recordSlugRedirect(db, "article", oldPublished.slug, draft.slug);
  }

  const now = new Date().toISOString();
  const todayDate = now.slice(0, 10);
  if (!draft.publishedAt) {
    draft.publishedAt = todayDate;
  }
  draft.updatedAt = todayDate;

  // Collect all media URLs used in the article
  const mediaUrls = [draft.coverImage, draft.socialImage];
  for (const loc of ["ar", "en"] as const) {
    for (const block of draft.locales[loc].blocks) {
      if (block.type === "image" && block.imageUrl) {
        mediaUrls.push(block.imageUrl);
      }
    }
  }
  promoteReferencedPrivateMedia(db, mediaUrls);

  const finalJson = JSON.stringify(draft);
  db.prepare(
    `UPDATE cms_articles
     SET slug = ?, translation_key = ?, category = ?, status = 'published',
         draft_data = ?, published_data = ?, published_at = ?, updated_at = ?, updated_by = ?
     WHERE id = ?`
  ).run(
    draft.slug,
    draft.slug,
    draft.category,
    finalJson,
    finalJson,
    now,
    now,
    actor.email,
    cleanId
  );

  recordRevisionInternal(db, {
    entityType: "article",
    entityId: cleanId,
    entityTitle: draft.locales.ar.title,
    action: "publish",
    snapshot: draft,
    summary:
      sanitizePlainText(summaryNote, 300) ||
      `نشر مقال (${draft.locales.ar.title}) على الموقع العام`,
    actorEmail: actor.email,
    actorRole: actor.role,
  });

  const updated = db
    .prepare("SELECT * FROM cms_articles WHERE id = ?")
    .get(cleanId) as Record<string, unknown>;
  return mapArticleRow(updated);
}

export function unpublishArticle(
  id: string,
  actor: { email: string; role: CmsRole }
): CmsArticleRecord {
  assertWritableStorage();
  if (actor.role !== "owner") {
    throw new CmsError(
      "صلاحية إلغاء نشر المقالات متاحة لدور المالك (Owner) فقط.",
      403,
      "FORBIDDEN_ROLE"
    );
  }

  const db = getDb();
  const cleanId = sanitizeSlug(id, id);
  const existing = db
    .prepare("SELECT * FROM cms_articles WHERE id = ?")
    .get(cleanId) as Record<string, unknown> | undefined;

  if (!existing) {
    throw new CmsError("المقال المطلوب غير موجود.", 404, "NOT_FOUND");
  }

  const draft = JSON.parse(String(existing.draft_data)) as CmsArticleContent;
  const now = new Date().toISOString();

  db.prepare(
    `UPDATE cms_articles
     SET status = 'draft', published_data = NULL, updated_at = ?, updated_by = ?
     WHERE id = ?`
  ).run(now, actor.email, cleanId);

  recordRevisionInternal(db, {
    entityType: "article",
    entityId: cleanId,
    entityTitle: draft.locales.ar.title,
    action: "unpublish",
    snapshot: draft,
    summary: `إلغاء نشر المقال (${draft.locales.ar.title}) وتحويله إلى مسودة`,
    actorEmail: actor.email,
    actorRole: actor.role,
  });

  const updated = db
    .prepare("SELECT * FROM cms_articles WHERE id = ?")
    .get(cleanId) as Record<string, unknown>;
  return mapArticleRow(updated);
}

// ============================================================================
// Revision History & Restore-to-Draft
// ============================================================================

function mapRevisionRow(row: Record<string, unknown>): CmsRevision {
  return {
    id: String(row.id),
    entityType: String(row.entity_type) as CmsRevision["entityType"],
    entityId: String(row.entity_id),
    entityTitle: String(row.entity_title),
    action: String(row.action) as CmsRevisionAction,
    snapshot: JSON.parse(String(row.snapshot)),
    summary: String(row.summary),
    actorEmail: String(row.actor_email),
    actorRole: String(row.actor_role) as CmsRole | "system",
    createdAt: String(row.created_at),
  };
}

export function listCmsRevisions(limit = 60): CmsRevision[] {
  const db = getDb();
  const rows = db
    .prepare(
      "SELECT * FROM cms_revisions ORDER BY created_at DESC, rowid DESC LIMIT ?"
    )
    .all(limit) as Array<Record<string, unknown>>;
  return rows.map(mapRevisionRow);
}

export function restoreRevisionToDraft(
  revisionId: string,
  actor: { email: string; role: CmsRole }
): { revision: CmsRevision; restoredDraft: unknown } {
  assertWritableStorage();
  if (actor.role !== "owner") {
    throw new CmsError(
      "صلاحية استعادة الإصدارات السابقة متاحة لدور المالك (Owner) فقط.",
      403,
      "FORBIDDEN_ROLE"
    );
  }

  const db = getDb();
  const row = db
    .prepare("SELECT * FROM cms_revisions WHERE id = ?")
    .get(revisionId) as Record<string, unknown> | undefined;

  if (!row) {
    throw new CmsError("الإصدار المطلوب غير موجود.", 404, "NOT_FOUND");
  }

  const rev = mapRevisionRow(row);
  const now = new Date().toISOString();

  if (rev.entityType === "document") {
    db.prepare(
      `UPDATE cms_documents
       SET draft_data = ?, updated_at = ?, updated_by = ?
       WHERE key = ?`
    ).run(JSON.stringify(rev.snapshot), now, actor.email, rev.entityId);
  } else if (rev.entityType === "specialty") {
    db.prepare(
      `UPDATE cms_specialties
       SET draft_data = ?, updated_at = ?, updated_by = ?
       WHERE id = ?`
    ).run(JSON.stringify(rev.snapshot), now, actor.email, rev.entityId);
  } else if (rev.entityType === "article") {
    db.prepare(
      `UPDATE cms_articles
       SET draft_data = ?, updated_at = ?, updated_by = ?
       WHERE id = ?`
    ).run(JSON.stringify(rev.snapshot), now, actor.email, rev.entityId);
  }

  const newRev = recordRevisionInternal(db, {
    entityType: rev.entityType,
    entityId: rev.entityId,
    entityTitle: rev.entityTitle,
    action: "restore_to_draft",
    snapshot: rev.snapshot,
    summary: `استعادة إصدار سابق (${rev.createdAt.slice(0, 16).replace("T", " ")}) كمسودة جديدة`,
    actorEmail: actor.email,
    actorRole: actor.role,
  });

  return {
    revision: newRev,
    restoredDraft: rev.snapshot,
  };
}

// ============================================================================
// Media Library Operations
// ============================================================================

function mapMediaRow(row: Record<string, unknown>): CmsMediaAsset {
  return {
    id: String(row.id),
    filename: String(row.filename),
    originalName: String(row.original_name),
    mimeType: String(row.mime_type),
    sizeBytes: Number(row.size_bytes),
    width: Number(row.width),
    height: Number(row.height),
    altText: {
      ar: String(row.alt_text_ar ?? ""),
      en: String(row.alt_text_en ?? ""),
    },
    focalPoint: {
      x: Number(row.focal_x ?? 50),
      y: Number(row.focal_y ?? 50),
    },
    isPublic: Number(row.is_public) === 1,
    storageBucket: String(row.storage_bucket),
    storagePath: String(row.storage_path),
    publicUrl: String(row.public_url),
    uploadedBy: row.uploaded_by ? String(row.uploaded_by) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function listMediaAssets(): CmsMediaAsset[] {
  const db = getDb();
  const rows = db
    .prepare(
      "SELECT * FROM cms_media_assets ORDER BY created_at DESC, rowid DESC"
    )
    .all() as Array<Record<string, unknown>>;
  return rows.map(mapMediaRow);
}

export function getMediaAssetById(id: string): CmsMediaAsset | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM cms_media_assets WHERE id = ?")
    .get(id) as Record<string, unknown> | undefined;
  return row ? mapMediaRow(row) : null;
}

export function uploadMediaAsset(params: {
  buffer: Buffer;
  originalFilename: string;
  mimeType: string;
  altText?: LocalizedText;
  focalPoint?: { x: number; y: number };
  actor: { email: string; role: CmsRole };
}): CmsMediaAsset {
  assertWritableStorage();
  const validation = inspectAndValidateImageBuffer(
    params.buffer,
    params.mimeType,
    params.originalFilename
  );

  if (!validation.valid || !validation.detectedMime || !validation.extension) {
    throw new CmsError(
      validation.error || "ملف الصورة غير صالح.",
      400,
      "INVALID_MEDIA_FILE"
    );
  }

  const db = getDb();
  const id = `media-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  const stemRaw = path.basename(
    params.originalFilename,
    path.extname(params.originalFilename)
  );
  const safeStem = sanitizeSlug(stemRaw, "image").slice(0, 48);
  const safeFilename = `${Date.now()}-${crypto
    .randomBytes(3)
    .toString("hex")}-${safeStem}.${validation.extension}`;

  // Store new uploads in private storage by default until published
  const privateDir = getPrivateMediaDir();
  fs.mkdirSync(privateDir, { recursive: true });
  const privateFilePath = path.join(privateDir, safeFilename);
  fs.writeFileSync(privateFilePath, params.buffer);

  const altText = sanitizeLocalizedText(params.altText ?? { ar: "", en: "" }, 400);
  const focalPoint = sanitizeFocalPoint(params.focalPoint ?? { x: 50, y: 50 });
  const now = new Date().toISOString();
  const deliveryUrl = `/api/cms/media/file/${id}`;

  db.prepare(
    `INSERT INTO cms_media_assets (
      id, filename, original_name, mime_type, size_bytes, width, height,
      alt_text_ar, alt_text_en, focal_x, focal_y, is_public,
      storage_bucket, storage_path, public_url, uploaded_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'private', ?, ?, ?, ?, ?)`
  ).run(
    id,
    safeFilename,
    sanitizePlainText(params.originalFilename, 200),
    validation.detectedMime,
    params.buffer.length,
    validation.width || 1200,
    validation.height || 800,
    altText.ar,
    altText.en,
    focalPoint.x,
    focalPoint.y,
    privateFilePath,
    deliveryUrl,
    params.actor.email,
    now,
    now
  );

  const inserted = db
    .prepare("SELECT * FROM cms_media_assets WHERE id = ?")
    .get(id) as Record<string, unknown>;
  return mapMediaRow(inserted);
}

export function updateMediaAsset(
  id: string,
  params: {
    altText?: LocalizedText;
    focalPoint?: { x: number; y: number };
    isPublic?: boolean;
    replaceBuffer?: Buffer;
    replaceOriginalFilename?: string;
    replaceMimeType?: string;
    actor: { email: string; role: CmsRole };
  }
): CmsMediaAsset {
  assertWritableStorage();
  const db = getDb();
  const existingRow = db
    .prepare("SELECT * FROM cms_media_assets WHERE id = ?")
    .get(id) as Record<string, unknown> | undefined;

  if (!existingRow) {
    throw new CmsError("ملف الوسائط غير موجود.", 404, "NOT_FOUND");
  }

  const existing = mapMediaRow(existingRow);
  let filename = existing.filename;
  let originalName = existing.originalName;
  let mimeType = existing.mimeType;
  let sizeBytes = existing.sizeBytes;
  let width = existing.width;
  let height = existing.height;
  let storagePath = existing.storagePath;

  // Non-destructive replacement: write a new timestamped file without overwriting original files
  if (params.replaceBuffer && params.replaceOriginalFilename) {
    const validation = inspectAndValidateImageBuffer(
      params.replaceBuffer,
      params.replaceMimeType || "image/jpeg",
      params.replaceOriginalFilename
    );
    if (!validation.valid || !validation.detectedMime || !validation.extension) {
      throw new CmsError(
        validation.error || "ملف الصورة البديل غير صالح.",
        400,
        "INVALID_MEDIA_FILE"
      );
    }

    const stemRaw = path.basename(
      params.replaceOriginalFilename,
      path.extname(params.replaceOriginalFilename)
    );
    const safeStem = sanitizeSlug(stemRaw, "image").slice(0, 48);
    filename = `${Date.now()}-${crypto
      .randomBytes(3)
      .toString("hex")}-${safeStem}.${validation.extension}`;
    originalName = sanitizePlainText(params.replaceOriginalFilename, 200);
    mimeType = validation.detectedMime;
    sizeBytes = params.replaceBuffer.length;
    width = validation.width || 1200;
    height = validation.height || 800;

    const privateDir = getPrivateMediaDir();
    fs.mkdirSync(privateDir, { recursive: true });
    storagePath = path.join(privateDir, filename);
    fs.writeFileSync(storagePath, params.replaceBuffer);

    if (existing.isPublic || params.isPublic) {
      try {
        const publicDir = getPublicUploadsDir();
        fs.mkdirSync(publicDir, { recursive: true });
        fs.copyFileSync(storagePath, path.join(publicDir, filename));
      } catch {
        // ignore
      }
    }
  }

  const altText = params.altText
    ? sanitizeLocalizedText(params.altText, 400)
    : existing.altText;
  const focalPoint = params.focalPoint
    ? sanitizeFocalPoint(params.focalPoint)
    : existing.focalPoint;
  const isPublic =
    params.isPublic !== undefined ? Boolean(params.isPublic) : existing.isPublic;

  if (isPublic && !existing.isPublic) {
    promoteMediaAssetToPublicInternal(db, id);
  }

  const now = new Date().toISOString();
  db.prepare(
    `UPDATE cms_media_assets
     SET filename = ?, original_name = ?, mime_type = ?, size_bytes = ?, width = ?, height = ?,
         alt_text_ar = ?, alt_text_en = ?, focal_x = ?, focal_y = ?, is_public = ?, storage_path = ?, updated_at = ?
     WHERE id = ?`
  ).run(
    filename,
    originalName,
    mimeType,
    sizeBytes,
    width,
    height,
    altText.ar,
    altText.en,
    focalPoint.x,
    focalPoint.y,
    isPublic ? 1 : 0,
    storagePath,
    now,
    id
  );

  const updated = db
    .prepare("SELECT * FROM cms_media_assets WHERE id = ?")
    .get(id) as Record<string, unknown>;
  return mapMediaRow(updated);
}

export function deleteMediaAsset(
  id: string,
  actor: { email: string; role: CmsRole }
): { deletedId: string } {
  assertWritableStorage();
  if (actor.role !== "owner") {
    throw new CmsError(
      "صلاحية حذف الوسائط متاحة لدور المالك (Owner) فقط.",
      403,
      "FORBIDDEN_ROLE"
    );
  }

  const db = getDb();
  const asset = getMediaAssetById(id);
  if (!asset) {
    throw new CmsError("ملف الوسائط غير موجود.", 404, "NOT_FOUND");
  }

  // Block deletion if referenced by any published content
  const publishedRefs = findPublishedReferencesForMedia(db, asset);
  if (publishedRefs.length > 0) {
    throw new CmsError(
      `لا يمكن حذف هذه الصورة لأنها ما تزال مستخدمة في محتوى منشور: ${publishedRefs.join(
        "، "
      )}. يُرجى استبدال الصورة في المحتوى المنشور أولًا.`,
      409,
      "MEDIA_REFERENCED_IN_PUBLISHED_CONTENT"
    );
  }

  db.prepare("DELETE FROM cms_media_assets WHERE id = ?").run(id);
  return { deletedId: id };
}

// ============================================================================
// State & Snapshot Readers (Admin State + Public Snapshot)
// ============================================================================

export function getAdminCmsState(currentUser: CmsUser): AdminCmsState {
  const db = getDb();
  const mode = getStorageMode();

  const getDocRow = (key: string) => {
    const row = db
      .prepare("SELECT * FROM cms_documents WHERE key = ?")
      .get(key) as Record<string, unknown>;
    const draftStr = String(row.draft_data);
    const pubStr = String(row.published_data);
    return {
      draft: JSON.parse(draftStr),
      published: JSON.parse(pubStr),
      updatedAt: String(row.updated_at),
      publishedAt: row.published_at ? String(row.published_at) : null,
      hasUnpublishedChanges: draftStr !== pubStr,
    };
  };

  const specRows = db
    .prepare("SELECT * FROM cms_specialties ORDER BY display_order ASC, id ASC")
    .all() as Array<Record<string, unknown>>;

  const articleRows = db
    .prepare("SELECT * FROM cms_articles ORDER BY updated_at DESC, id ASC")
    .all() as Array<Record<string, unknown>>;

  const redirectRows = db
    .prepare("SELECT * FROM cms_redirects ORDER BY created_at DESC")
    .all() as Array<Record<string, unknown>>;

  return {
    storageMode: mode,
    canPersist: mode !== "serverless-readonly",
    persistenceNotice:
      mode === "serverless-readonly"
        ? "وضع المعاينة السحابية بدون مفاتيح Supabase: يمكنك استعراض لوحة التحكم بالكامل، ولتفعيل الحفظ الدائم في السحابة يُرجى إضافة NEXT_PUBLIC_SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY في إعدادات البيئة."
        : null,
    currentUser,
    documents: {
      homepage: getDocRow("homepage"),
      doctorProfile: getDocRow("doctorProfile"),
      faq: getDocRow("faq"),
      contactSettings: getDocRow("contactSettings"),
    },
    specialties: specRows.map(mapSpecialtyRow),
    articles: articleRows.map(mapArticleRow),
    mediaAssets: listMediaAssets(),
    revisions: listCmsRevisions(60),
    redirects: redirectRows.map((r) => ({
      id: String(r.id),
      entityType:
        r.entity_type === "specialty" ? "specialty" : "article",
      fromSlug: String(r.from_slug),
      toSlug: String(r.to_slug),
      createdAt: String(r.created_at),
    })),
    users: currentUser.role === "owner" ? listCmsUsers() : [currentUser],
  };
}

/**
 * Returns the CMS snapshot for rendering the public website.
 * - When `previewDrafts` is false (default for all public visitors):
 *   Returns ONLY published documents, published specialties, and published articles.
 * - When `previewDrafts` is true (verified authenticated admin/editor session):
 *   Returns draft documents, all specialties using draft content, and all articles (including drafts) using draft content.
 */
export function getPublicCmsSnapshot(options?: {
  previewDrafts?: boolean;
}): PublicCmsSnapshot {
  const previewDrafts = Boolean(options?.previewDrafts);
  try {
    const db = getDb();

    const readDoc = <T>(key: string): T => {
      const row = db
        .prepare(
          "SELECT draft_data, published_data FROM cms_documents WHERE key = ?"
        )
        .get(key) as { draft_data: string; published_data: string } | undefined;
      if (!row) {
        throw new Error(`Missing seeded CMS document: ${key}`);
      }
      return JSON.parse(
        previewDrafts ? row.draft_data : row.published_data
      ) as T;
    };

    const specRows = db
      .prepare("SELECT * FROM cms_specialties ORDER BY display_order ASC, id ASC")
      .all() as Array<Record<string, unknown>>;

    const specialties = specRows
      .map(mapSpecialtyRow)
      .filter((spec) =>
        previewDrafts ? true : spec.status === "published" && spec.published !== null
      )
      .map((spec) => ({
        id: spec.id,
        slug: previewDrafts ? spec.draft.slug : spec.published!.slug,
        displayOrder: spec.displayOrder,
        status: spec.status,
        content: previewDrafts ? spec.draft : spec.published!,
        updatedAt: spec.updatedAt,
      }));

    const articleRows = db
      .prepare(
        "SELECT * FROM cms_articles ORDER BY published_at DESC, updated_at DESC"
      )
      .all() as Array<Record<string, unknown>>;

    const articles = articleRows
      .map(mapArticleRow)
      .filter((art) =>
        previewDrafts ? true : art.status === "published" && art.published !== null
      )
      .map((art) => {
        const content = previewDrafts ? art.draft : art.published!;
        return {
          id: art.id,
          slug: content.slug,
          translationKey: art.translationKey,
          category: content.category,
          status: art.status,
          content,
          publishedAt: content.publishedAt ?? art.publishedAt,
          updatedAt: content.updatedAt ?? art.updatedAt,
        };
      });

    const redirectRows = db
      .prepare("SELECT * FROM cms_redirects ORDER BY created_at DESC")
      .all() as Array<Record<string, unknown>>;

    return {
      isDraftPreview: previewDrafts,
      homepage: readDoc<HomepageDocument>("homepage"),
      doctorProfile: readDoc<DoctorProfileDocument>("doctorProfile"),
      faq: readDoc<CmsFaqDocument>("faq"),
      contactSettings: readDoc<CmsContactSettingsDocument>("contactSettings"),
      specialties,
      articles,
      redirects: redirectRows.map((r) => ({
        id: String(r.id),
        entityType: r.entity_type === "specialty" ? "specialty" : "article",
        fromSlug: String(r.from_slug),
        toSlug: String(r.to_slug),
        createdAt: String(r.created_at),
      })),
    };
  } catch {
    const seedSpecs = buildSeedSpecialties();
    const seedArts = buildSeedArticles();
    return {
      isDraftPreview: previewDrafts,
      homepage: buildSeedHomepageDocument(),
      doctorProfile: buildSeedDoctorProfileDocument(),
      faq: buildSeedFaqDocument(),
      contactSettings: buildSeedContactSettingsDocument(),
      specialties: seedSpecs
        .filter((s) => (previewDrafts ? true : s.status === "published"))
        .map((s) => ({
          id: s.id,
          slug: s.slug,
          displayOrder: s.displayOrder,
          status: s.status,
          content: previewDrafts ? s.draft : s.published!,
          updatedAt: s.updatedAt,
        })),
      articles: seedArts
        .filter((a) => (previewDrafts ? true : a.status === "published"))
        .map((a) => ({
          id: a.id,
          slug: a.slug,
          translationKey: a.translationKey,
          category: a.category,
          status: a.status,
          content: previewDrafts ? a.draft : a.published!,
          publishedAt: a.publishedAt,
          updatedAt: a.updatedAt,
        })),
      redirects: [],
    };
  }
}
