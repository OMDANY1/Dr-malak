#!/usr/bin/env node
/**
 * Secure CLI Administrator Provisioning Script
 *
 * Usage:
 *   npm run cms:provision-admin -- --email=owner@example.com --password=YourStrongPassword123! --role=owner --name="د. ملاك السيف"
 *
 * Or via environment variables:
 *   CMS_ADMIN_EMAIL=owner@example.com CMS_ADMIN_PASSWORD=YourStrongPassword123! npm run cms:provision-admin
 *
 * Never hardcodes credentials or commits secrets.
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

// Load .env.local if present
const envLocalPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  const lines = fs.readFileSync(envLocalPath, "utf-8").split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

function parseArgs(argv) {
  const result = {};
  for (const arg of argv) {
    if (arg.startsWith("--")) {
      const eqIdx = arg.indexOf("=");
      if (eqIdx > 2) {
        const key = arg.slice(2, eqIdx).trim();
        const val = arg.slice(eqIdx + 1).trim();
        result[key] = val;
      }
    }
  }
  return result;
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

const args = parseArgs(process.argv.slice(2));
const email = (
  args.email ||
  process.env.CMS_ADMIN_EMAIL ||
  process.env.CMS_INITIAL_OWNER_EMAIL ||
  ""
)
  .trim()
  .toLowerCase();
const password =
  args.password ||
  process.env.CMS_ADMIN_PASSWORD ||
  process.env.CMS_INITIAL_OWNER_PASSWORD ||
  "";
const role = (args.role || process.env.CMS_ADMIN_ROLE || "owner")
  .trim()
  .toLowerCase();
const displayName = (
  args.name ||
  process.env.CMS_ADMIN_NAME ||
  (role === "owner" ? "مالكة الموقع (د. ملاك السيف)" : "محرر المحتوى")
).trim();

if (!email || !email.includes("@")) {
  console.error(
    "خطأ: يرجى تحديد البريد الإلكتروني عبر --email=user@domain.com أو متغير البيئة CMS_ADMIN_EMAIL."
  );
  process.exit(1);
}

if (!password || password.length < 8) {
  console.error(
    "خطأ: يرجى تحديد كلمة مرور قوية لا تقل عن 8 خانات عبر --password=... أو متغير البيئة CMS_ADMIN_PASSWORD."
  );
  process.exit(1);
}

if (role !== "owner" && role !== "editor") {
  console.error("خطأ: الدور الوظيفي يجب أن يكون owner أو editor.");
  process.exit(1);
}

const dbPath =
  process.env.CMS_SQLITE_PATH ||
  path.join(process.cwd(), "content", ".cms-data", "cms.sqlite");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new DatabaseSync(dbPath);
db.exec(`
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
`);

const now = new Date().toISOString();
const existing = db
  .prepare("SELECT id FROM cms_users WHERE email = ?")
  .get(email);

if (existing) {
  db.prepare(
    `UPDATE cms_users
     SET password_hash = ?, display_name = ?, role = ?, is_active = 1, updated_at = ?
     WHERE email = ?`
  ).run(hashPassword(password), displayName, role, now, email);
  console.log(
    `[CMS Auth] تم تحديث بيانات المستخدم بنجاح: ${email} (الدور: ${role})`
  );
} else {
  const id = `user-${role}-${crypto.randomBytes(4).toString("hex")}`;
  db.prepare(
    `INSERT INTO cms_users (id, email, password_hash, display_name, role, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 1, ?, ?)`
  ).run(id, email, hashPassword(password), displayName, role, now, now);
  console.log(
    `[CMS Auth] تم إنشاء حساب المسؤول بنجاح: ${email} (الدور: ${role})`
  );
}
db.close();

// If Supabase credentials are configured and not running against an isolated temp DB, sync to Supabase Cloud
if (
  !process.env.CMS_SQLITE_PATH &&
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.SUPABASE_SERVICE_ROLE_KEY
) {
  const supUrl = process.env.NEXT_PUBLIC_SUPABASE_URL.replace(
    /\/rest\/v1\/?$/i,
    ""
  ).replace(/\/+$/, "");
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  try {
    // 1. Pull existing cloud bundle if present, merge user, and push back
    const getRes = await fetch(
      `${supUrl}/storage/v1/object/cms-private-media/cms-state/state-bundle.json`,
      {
        headers: { apikey: secret, Authorization: `Bearer ${secret}` },
      }
    );
    if (getRes.ok) {
      const bundle = await getRes.json();
      const reopenDb = new DatabaseSync(dbPath);
      const localUser = reopenDb
        .prepare("SELECT * FROM cms_users WHERE email = ?")
        .get(email);
      reopenDb.close();
      if (bundle && Array.isArray(bundle.cms_users) && localUser) {
        bundle.cms_users = bundle.cms_users.filter((u) => u.email !== email);
        bundle.cms_users.push(localUser);
        bundle.exportedAt = new Date().toISOString();
        await fetch(
          `${supUrl}/storage/v1/object/cms-private-media/cms-state/state-bundle.json`,
          {
            method: "POST",
            headers: {
              apikey: secret,
              Authorization: `Bearer ${secret}`,
              "Content-Type": "application/json",
              "x-upsert": "true",
            },
            body: JSON.stringify(bundle),
          }
        );
        console.log("[CMS Cloud] تمت مزامنة حساب المسؤول مع سحابة Supabase بنجاح.");
      }
    }
  } catch (err) {
    console.warn("[CMS Cloud] تعذرت المزامنة الاختيارية مع السحابة:", err.message);
  }
}
