import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

// Register Node 24 module resolution hook so @/* and extensionless TypeScript imports resolve cleanly
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      const targetPath = path.join(process.cwd(), "src", specifier.slice(2));
      for (const candidate of [
        targetPath,
        `${targetPath}.ts`,
        `${targetPath}.tsx`,
        path.join(targetPath, "index.ts"),
      ]) {
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
          return nextResolve(pathToFileURL(candidate).href, context);
        }
      }
    }
    if (
      (specifier.startsWith("./") || specifier.startsWith("../")) &&
      context.parentURL &&
      context.parentURL.startsWith("file:")
    ) {
      const parentDir = path.dirname(fileURLToPath(context.parentURL));
      const rawTarget = path.resolve(parentDir, specifier);
      for (const candidate of [
        rawTarget,
        `${rawTarget}.ts`,
        `${rawTarget}.tsx`,
      ]) {
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
          return nextResolve(pathToFileURL(candidate).href, context);
        }
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.endsWith(".json")) {
      return {
        format: "json",
        shortCircuit: true,
        source: fs.readFileSync(fileURLToPath(url), "utf-8"),
      };
    }
    return nextLoad(url, context);
  },
});

/**
 * Pure unit, static regression, and CMS integration test suite:
 * 1. Arabic search normalization (diacritics/tashkeel, tatweel, zero-width, letter variants, digits)
 * 2. Reading-time pluralization (Arabic 1, 2, 3-10, 11+ and English word order)
 * 3. CSS & Font token configuration checks
 * 4. CMS Authentication, Session Signing, & Role-Based Authorization (Owner vs Editor)
 * 5. CMS Non-Destructive Seed & Draft vs Published Isolation (questions-to-discuss remains draft)
 * 6. CMS Editorial Workflow: Save Draft, Preview, Publish, Unpublish, Slug Redirects, Revision History & Restore-to-Draft
 * 7. CMS Localization Separation & Translation Completeness
 * 8. CMS Media Library Validation (PNG/JPEG/WebP magic bytes, SVG/executable rejection, Private-to-Public promotion, In-Use Deletion Block)
 * 9. CMS Rich-Text Sanitization & Automatic Bilingual Reading-Time Calculation
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

console.log("Running unit regression & CMS integration tests...");

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

// ============================================================================
// 4–9. CMS Database, Security, Localization, Media & Editorial Workflow Tests
// ============================================================================

const tempCmsDir = fs.mkdtempSync(path.join(os.tmpdir(), "dr-malak-cms-test-"));
process.env.CMS_DATA_DIR = tempCmsDir;
process.env.CMS_SQLITE_PATH = path.join(tempCmsDir, "test-cms.sqlite");
process.env.CMS_PUBLIC_UPLOADS_DIR = path.join(tempCmsDir, "public-uploads");
process.env.CMS_SESSION_SECRET = "test-only-ephemeral-secret-key-32bytes-minimum";

try {
  const authMod = await import("../src/lib/cms/auth.ts");
  const sanitizeMod = await import("../src/lib/cms/sanitize.ts");
  const dbMod = await import("../src/lib/cms/db.ts");

  // 4. Non-destructive seed & public vs draft isolation
  console.log("  Checking CMS non-destructive seed & draft isolation...");
  const initialPublic = dbMod.getPublicCmsSnapshot({ previewDrafts: false });
  assert.equal(
    initialPublic.homepage.hero.title.ar,
    "جمال يليق بكِ",
    "Seeded homepage Arabic hero title must match approved site content"
  );
  assert.equal(
    initialPublic.specialties.length,
    3,
    "All 3 approved specialties must be seeded and published"
  );
  assert.equal(
    initialPublic.articles.length,
    1,
    "Only 1 approved published article ('preparing-for-consultation') may be exposed publicly"
  );
  assert.equal(
    initialPublic.articles[0].slug,
    "preparing-for-consultation"
  );

  // Verify draft sample article ('questions-to-discuss') is imported as draft, NOT published
  const ownerActor = { email: "owner@drmalak.test", role: "owner" };
  const editorActor = { email: "editor@drmalak.test", role: "editor" };

  const adminState = dbMod.getAdminCmsState({
    id: "u-owner",
    email: ownerActor.email,
    displayName: "د. ملاك السيف",
    role: "owner",
    isActive: true,
    createdAt: new Date().toISOString(),
  });
  const draftSampleArticle = adminState.articles.find(
    (a) => a.id === "article-questions-to-discuss"
  );
  assert.ok(
    draftSampleArticle,
    "Sample article 'questions-to-discuss' must exist in CMS admin state"
  );
  assert.equal(
    draftSampleArticle.status,
    "draft",
    "Sample article 'questions-to-discuss' must remain in 'draft' status"
  );
  assert.equal(
    draftSampleArticle.published,
    null,
    "Sample article 'questions-to-discuss' must never have published_data populated on import"
  );

  // 5. Authentication & Role-Based Authorization (Owner vs Editor)
  console.log("  Checking CMS authentication & role-based authorization...");
  const provisionedOwner = dbMod.provisionOrUpdateCmsUser({
    email: ownerActor.email,
    password: "StrongOwnerPassword!2026",
    displayName: "د. ملاك السيف",
    role: "owner",
  });
  assert.equal(provisionedOwner.role, "owner");

  const provisionedEditor = dbMod.provisionOrUpdateCmsUser({
    email: editorActor.email,
    password: "StrongEditorPassword!2026",
    displayName: "محرر المحتوى",
    role: "editor",
  });
  assert.equal(provisionedEditor.role, "editor");

  // Verify login credentials
  const authSuccess = dbMod.authenticateCmsUser(
    ownerActor.email,
    "StrongOwnerPassword!2026"
  );
  assert.ok(authSuccess, "Valid password must authenticate user");
  const authFail = dbMod.authenticateCmsUser(
    ownerActor.email,
    "WrongPassword123"
  );
  assert.equal(authFail, null, "Invalid password must return null");

  // Verify signed session & preview tokens
  const sessionToken = authMod.signSessionToken(authSuccess);
  const verifiedSession = authMod.verifySessionToken(sessionToken);
  assert.ok(verifiedSession);
  assert.equal(verifiedSession.email, ownerActor.email);
  assert.equal(verifiedSession.role, "owner");
  assert.equal(
    authMod.verifySessionToken(`${sessionToken}tampered`),
    null,
    "Tampered session token must be rejected"
  );

  const previewToken = authMod.signDraftPreviewToken(
    authSuccess.email,
    authSuccess.role
  );
  assert.equal(authMod.verifyDraftPreviewToken(previewToken), true);
  assert.equal(authMod.verifyDraftPreviewToken("invalid.token"), false);

  // 6. Save Draft vs Publish Isolation & Role Enforcement
  console.log("  Checking Save Draft vs Publish isolation & Editor restrictions...");
  const modifiedHomepage = structuredClone(adminState.documents.homepage.draft);
  modifiedHomepage.hero.title.ar = "عنوان مسودة تجريبي غير منشور";

  // Editor CAN save draft
  const savedHomepageDraft = dbMod.saveDocumentDraft(
    "homepage",
    modifiedHomepage,
    editorActor,
    "تحديث عنوان المسودة من قِبل المحرر"
  );
  assert.equal(
    savedHomepageDraft.hero.title.ar,
    "عنوان مسودة تجريبي غير منشور"
  );

  // Public site (previewDrafts: false) MUST NOT change when draft is saved
  const publicAfterDraft = dbMod.getPublicCmsSnapshot({ previewDrafts: false });
  assert.equal(
    publicAfterDraft.homepage.hero.title.ar,
    "جمال يليق بكِ",
    "Saving a draft must never mutate live published content"
  );

  // Authenticated draft preview (previewDrafts: true) MUST reflect the draft
  const previewSnapshot = dbMod.getPublicCmsSnapshot({ previewDrafts: true });
  assert.equal(
    previewSnapshot.homepage.hero.title.ar,
    "عنوان مسودة تجريبي غير منشور",
    "Authenticated draft preview must show saved draft changes"
  );

  // Editor CANNOT publish documents, specialties, or articles (403 FORBIDDEN_ROLE)
  assert.throws(
    () => dbMod.publishDocument("homepage", editorActor),
    (err) => err.status === 403 && err.code === "FORBIDDEN_ROLE",
    "Editor role must be blocked from publishing documents"
  );
  assert.throws(
    () => dbMod.publishSpecialty("reconstructive-surgery", editorActor),
    (err) => err.status === 403 && err.code === "FORBIDDEN_ROLE",
    "Editor role must be blocked from publishing specialties"
  );
  assert.throws(
    () => dbMod.publishArticle("article-preparing-for-consultation", editorActor),
    (err) => err.status === 403 && err.code === "FORBIDDEN_ROLE",
    "Editor role must be blocked from publishing articles"
  );

  // Owner CAN publish document
  dbMod.publishDocument("homepage", ownerActor, undefined, "نشر التحديث");
  const publicAfterPublish = dbMod.getPublicCmsSnapshot({
    previewDrafts: false,
  });
  assert.equal(
    publicAfterPublish.homepage.hero.title.ar,
    "عنوان مسودة تجريبي غير منشور",
    "Publishing by Owner must update public content immediately"
  );

  // 7. Revision History & Restore-to-Draft
  console.log("  Checking Revision History & Restore-to-Draft...");
  const stateWithRevisions = dbMod.getAdminCmsState(provisionedOwner);
  const homepageRevisions = stateWithRevisions.revisions.filter(
    (r) => r.entityType === "document" && r.entityId === "homepage"
  );
  assert.ok(
    homepageRevisions.length >= 3,
    "Homepage must have seed, save_draft, and publish revisions recorded"
  );

  const seedRevision = homepageRevisions.find((r) => r.action === "seed");
  assert.ok(seedRevision, "Initial seed revision must be preserved");

  // Editor cannot restore revision
  assert.throws(
    () => dbMod.restoreRevisionToDraft(seedRevision.id, editorActor),
    (err) => err.status === 403 && err.code === "FORBIDDEN_ROLE",
    "Editor must not be allowed to restore revisions"
  );

  // Owner restores seed revision to draft
  const restoreRes = dbMod.restoreRevisionToDraft(seedRevision.id, ownerActor);
  assert.equal(restoreRes.revision.entityType, "document");
  assert.equal(restoreRes.revision.entityId, "homepage");

  // Verify live site still has the published version until re-published, while draft has restored version
  const publicDuringRestore = dbMod.getPublicCmsSnapshot({
    previewDrafts: false,
  });
  const previewDuringRestore = dbMod.getPublicCmsSnapshot({
    previewDrafts: true,
  });
  assert.equal(
    publicDuringRestore.homepage.hero.title.ar,
    "عنوان مسودة تجريبي غير منشور",
    "Restoring a revision to draft must not overwrite live published content until published"
  );
  assert.equal(
    previewDuringRestore.homepage.hero.title.ar,
    "جمال يليق بكِ",
    "Restored draft must match the historical revision snapshot"
  );

  // Publish restored draft so homepage is back to original headline
  dbMod.publishDocument("homepage", ownerActor);

  // 8. Specialty Slug Changes & Automatic Redirects
  console.log("  Checking Specialty slug change & automatic redirect mapping...");
  const burnSpec = stateWithRevisions.specialties[2];
  assert.ok(burnSpec);
  const originalBurnSlug = burnSpec.slug;
  const updatedBurnDraft = structuredClone(burnSpec.draft);
  updatedBurnDraft.slug = "advanced-burn-care";

  dbMod.saveSpecialtyDraft(
    burnSpec.id,
    updatedBurnDraft,
    burnSpec.displayOrder,
    ownerActor
  );
  // Before publish, old slug is still live and no redirect yet
  assert.equal(
    dbMod.resolveSlugRedirect("specialty", originalBurnSlug),
    null
  );

  // Publish specialty with new slug
  dbMod.publishSpecialty(burnSpec.id, ownerActor);
  assert.equal(
    dbMod.resolveSlugRedirect("specialty", originalBurnSlug),
    "advanced-burn-care",
    "Publishing a specialty with a changed slug must record an automatic redirect from old slug to new slug"
  );

  // 9. Localization Separation & Translation Completeness
  console.log("  Checking Arabic/English separation & translation completeness...");
  const completenessPartial = sanitizeMod.evaluateTranslationCompleteness([
    { label: "العنوان", value: { ar: "عنوان عربي", en: "" } },
    { label: "الوصف", value: { ar: "وصف عربي", en: "English description" } },
  ]);
  assert.equal(completenessPartial.isArComplete, true);
  assert.equal(completenessPartial.isEnComplete, false);
  assert.equal(completenessPartial.arPercent, 100);
  assert.equal(completenessPartial.enPercent, 50);
  assert.deepEqual(completenessPartial.missingEnFields, ["العنوان"]);

  // Verify sanitizeLocalizedText never copies Arabic into English
  const cleanLoc = sanitizeMod.sanitizeLocalizedText(
    { ar: "نص عربي فقط", en: "" },
    200
  );
  assert.equal(cleanLoc.ar, "نص عربي فقط");
  assert.equal(
    cleanLoc.en,
    "",
    "English field must remain empty when not translated, never copied from Arabic"
  );

  // 10. Rich-Text Sanitization & Reading-Time Calculation
  console.log("  Checking Rich-Text sanitization & reading-time calculation...");
  const dirtyBlocks = [
    {
      id: "b1",
      type: "paragraph",
      text: 'فقرة طبية <script>alert("xss")</script> مع <strong>تأكيد</strong> ورابط <a href="javascript:evil()">ضار</a> ورابط <a href="https://example.com" onclick="steal()">آمن</a>.',
    },
  ];
  const sanitizedBlocks = sanitizeMod.sanitizeRichTextBlocks(dirtyBlocks);
  assert.equal(
    sanitizedBlocks[0].text.includes("<script"),
    false,
    "Script tags must be stripped from rich text"
  );
  assert.equal(
    sanitizedBlocks[0].text.includes("javascript:"),
    false,
    "javascript: URLs must be stripped from rich text"
  );
  assert.equal(
    sanitizedBlocks[0].text.includes("onclick"),
    false,
    "Inline event handlers must be stripped from rich text"
  );
  assert.equal(
    sanitizedBlocks[0].text.includes("<strong>تأكيد</strong>"),
    true,
    "Safe inline formatting must be preserved"
  );

  const readingStats = sanitizeMod.calculateBlocksReadingTime(sanitizedBlocks);
  assert.equal(readingStats.labelAr, "دقيقة واحدة للقراءة");
  assert.equal(readingStats.labelEn, "1 min read");

  // 11. Media Library Validation, Private Upload, Promotion on Publish, & Deletion Protection
  console.log("  Checking Media Library validation, private-to-public promotion, and deletion protection...");
  // Reject SVG and executable buffers
  const svgBuffer = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
  const svgCheck = sanitizeMod.inspectAndValidateImageBuffer(
    svgBuffer,
    "image/svg+xml",
    "attack.svg"
  );
  assert.equal(svgCheck.valid, false, "SVG uploads must be blocked");

  const exeBuffer = Buffer.from("MZ\x90\x00\x03\x00\x00\x00", "binary");
  const exeCheck = sanitizeMod.inspectAndValidateImageBuffer(
    exeBuffer,
    "application/octet-stream",
    "malware.exe"
  );
  assert.equal(exeCheck.valid, false, "Executable uploads must be blocked");

  // Valid 1x1 PNG buffer
  const validPngBuffer = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64"
  );
  const pngCheck = sanitizeMod.inspectAndValidateImageBuffer(
    validPngBuffer,
    "image/png",
    "test-editorial.png"
  );
  assert.equal(pngCheck.valid, true);
  assert.equal(pngCheck.width, 1);
  assert.equal(pngCheck.height, 1);

  // Upload media as Editor -> starts private (isPublic === false)
  const uploadedAsset = dbMod.uploadMediaAsset({
    buffer: validPngBuffer,
    mimeType: "image/png",
    originalFilename: "Doctor Custom Upload!.png",
    altText: { ar: "صورة تجريبية للمحرر", en: "Editor test image" },
    focalPoint: { x: 42, y: 38 },
    actor: editorActor,
  });
  assert.equal(
    uploadedAsset.isPublic,
    false,
    "Newly uploaded media not yet referenced by published content must remain private"
  );
  assert.equal(uploadedAsset.width, 1);
  assert.equal(uploadedAsset.height, 1);
  assert.deepEqual(uploadedAsset.focalPoint, { x: 42, y: 38 });

  // Reference the uploaded private asset in homepage draft and publish -> promotes asset to public
  const hpWithNewMedia = structuredClone(
    dbMod.getAdminCmsState(provisionedOwner).documents.homepage.draft
  );
  hpWithNewMedia.hero.image = uploadedAsset.publicUrl;
  dbMod.saveDocumentDraft("homepage", hpWithNewMedia, ownerActor);
  dbMod.publishDocument("homepage", ownerActor);

  const stateAfterMediaPublish = dbMod.getAdminCmsState(provisionedOwner);
  const promotedAsset = stateAfterMediaPublish.mediaAssets.find(
    (m) => m.id === uploadedAsset.id
  );
  assert.ok(promotedAsset);
  assert.equal(
    promotedAsset.isPublic,
    true,
    "Publishing content that references a private media asset must promote it to public"
  );

  // Attempting to delete media referenced by published homepage must throw 409 MEDIA_REFERENCED_IN_PUBLISHED_CONTENT
  assert.throws(
    () => dbMod.deleteMediaAsset(promotedAsset.id, ownerActor),
    (err) =>
      err.status === 409 &&
      err.code === "MEDIA_REFERENCED_IN_PUBLISHED_CONTENT",
    "Deleting media still referenced by published content must be blocked with 409 MEDIA_REFERENCED_IN_PUBLISHED_CONTENT"
  );
} finally {
  try {
    fs.rmSync(tempCmsDir, { recursive: true, force: true });
  } catch {
    // Ignore Windows SQLite file lock cleanup warnings on temp dir
  }
}

console.log("All unit regression & CMS integration tests passed!");
