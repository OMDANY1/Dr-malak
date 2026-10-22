import crypto from "crypto";
import fs from "fs";
import path from "path";
import type { CmsRole, CmsUser } from "./types";

export const CMS_SESSION_COOKIE = "cms_session";
export const CMS_PREVIEW_COOKIE = "cms_draft_preview";

const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours
const PREVIEW_TTL_SECONDS = 60 * 60 * 4; // 4 hours

function getSigningSecret(): string {
  if (process.env.CMS_SESSION_SECRET && process.env.CMS_SESSION_SECRET.length >= 16) {
    return process.env.CMS_SESSION_SECRET;
  }
  if (
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY.length >= 16
  ) {
    return process.env.SUPABASE_SERVICE_ROLE_KEY;
  }

  // Local development/test persistent secret in gitignored content/.cms-data/.session-secret
  try {
    const dataDir = path.join(process.cwd(), "content", ".cms-data");
    const secretFile = path.join(dataDir, ".session-secret");
    if (fs.existsSync(secretFile)) {
      const existing = fs.readFileSync(secretFile, "utf-8").trim();
      if (existing.length >= 32) return existing;
    }
    fs.mkdirSync(dataDir, { recursive: true });
    const generated = crypto.randomBytes(32).toString("hex");
    fs.writeFileSync(secretFile, generated, { mode: 0o600 });
    return generated;
  } catch {
    // Ephemeral fallback if filesystem is read-only and no env var is set
    return crypto
      .createHash("sha256")
      .update(`${process.cwd()}::${process.pid}::cms-ephemeral-secret`)
      .digest("hex");
  }
}

/**
 * Hashes a password using Node's built-in scrypt with a random 16-byte salt.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

/**
 * Verifies a password against a stored scrypt hash using timingSafeEqual.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.startsWith("scrypt$")) return false;
  const parts = storedHash.split("$");
  if (parts.length !== 3) return false;
  const [, salt, expectedHex] = parts;
  if (!salt || !expectedHex) return false;

  try {
    const derived = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(expectedHex, "hex");
    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

export interface SessionTokenPayload {
  sub: string;
  email: string;
  role: CmsRole;
  displayName: string;
  exp: number;
}

export function signSessionToken(user: CmsUser): string {
  const payload: SessionTokenPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    displayName: user.displayName,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf-8").toString(
    "base64url"
  );
  const signature = crypto
    .createHmac("sha256", getSigningSecret())
    .update(encodedPayload)
    .digest("base64url");
  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(token: string | undefined): SessionTokenPayload | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encodedPayload, signature] = parts;
  if (!encodedPayload || !signature) return null;

  try {
    const expectedSig = crypto
      .createHmac("sha256", getSigningSecret())
      .update(encodedPayload)
      .digest();
    const actualSig = Buffer.from(signature, "base64url");
    if (
      expectedSig.length !== actualSig.length ||
      !crypto.timingSafeEqual(expectedSig, actualSig)
    ) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf-8")
    ) as SessionTokenPayload;

    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    if (payload.role !== "owner" && payload.role !== "editor") {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function signDraftPreviewToken(userEmail: string, role: CmsRole): string {
  const payload = {
    purpose: "draft_preview",
    email: userEmail,
    role,
    exp: Math.floor(Date.now() / 1000) + PREVIEW_TTL_SECONDS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf-8").toString(
    "base64url"
  );
  const signature = crypto
    .createHmac("sha256", getSigningSecret())
    .update(encodedPayload)
    .digest("base64url");
  return `${encodedPayload}.${signature}`;
}

export function verifyDraftPreviewToken(token: string | undefined): boolean {
  if (!token || typeof token !== "string") return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [encodedPayload, signature] = parts;
  if (!encodedPayload || !signature) return false;

  try {
    const expectedSig = crypto
      .createHmac("sha256", getSigningSecret())
      .update(encodedPayload)
      .digest();
    const actualSig = Buffer.from(signature, "base64url");
    if (
      expectedSig.length !== actualSig.length ||
      !crypto.timingSafeEqual(expectedSig, actualSig)
    ) {
      return false;
    }

    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf-8")
    ) as { purpose?: string; exp?: number };

    if (payload.purpose !== "draft_preview") return false;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks whether the current Next.js request has an authenticated CMS session
 * AND/OR active signed draft preview cookie.
 */
export async function isDraftPreviewRequest(
  previewQueryParam?: string
): Promise<boolean> {
  try {
    const { ensureSupabasePulled } = await import("./cloud-sync");
    await ensureSupabasePulled();
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(CMS_SESSION_COOKIE)?.value;
    const previewToken = cookieStore.get(CMS_PREVIEW_COOKIE)?.value;

    const validSession = verifySessionToken(sessionToken);
    const validPreviewCookie = verifyDraftPreviewToken(previewToken);

    if (validPreviewCookie && validSession) {
      return true;
    }
    if (previewQueryParam === "draft" && (validSession || validPreviewCookie)) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
