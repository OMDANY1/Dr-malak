import fs from "fs";
import path from "path";
import {
  CmsRawDatabaseBundle,
  exportDatabaseBundle,
  getPrivateMediaDir,
  getStorageMode,
  importDatabaseBundle,
} from "./db";
import type { CmsRole } from "./types";

const BUNDLE_OBJECT_PATH = "cms-state/state-bundle.json";
let lastPullTimestamp = 0;
const PULL_TTL_MS = 1500;

function getSupabaseConfig(): { url: string; secretKey: string } | null {
  if (process.env.CMS_SQLITE_PATH) {
    // Isolated unit test database mode — do not sync to remote cloud
    return null;
  }
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!rawUrl || !secretKey) return null;

  const url = rawUrl
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/+$/, "");
  return { url, secretKey };
}

/**
 * Ensures the local SQLite working database is synchronized with the latest
 * state bundle stored in Supabase Storage (`cms-private-media/cms-state/state-bundle.json`).
 * Safe to call at the start of any Server Component render or API route handler.
 */
export async function ensureSupabasePulled(force = false): Promise<void> {
  const cfg = getSupabaseConfig();
  if (!cfg) return;

  const now = Date.now();
  if (!force && now - lastPullTimestamp < PULL_TTL_MS) {
    return;
  }

  try {
    const res = await fetch(
      `${cfg.url}/storage/v1/object/cms-private-media/${BUNDLE_OBJECT_PATH}`,
      {
        method: "GET",
        headers: {
          apikey: cfg.secretKey,
          Authorization: `Bearer ${cfg.secretKey}`,
          "Cache-Control": "no-cache",
        },
        cache: "no-store",
      }
    );

    if (res.ok) {
      const bundle = (await res.json()) as CmsRawDatabaseBundle;
      if (bundle && bundle.version === 1) {
        importDatabaseBundle(bundle);
        lastPullTimestamp = Date.now();
        return;
      }
    }

    // If not found in cloud yet (first initialization), push current local seeded state to cloud
    if (res.status === 400 || res.status === 404) {
      await syncStateToSupabase();
    }
  } catch {
    // Network error fallback: continue using local SQLite state
  }
}

/**
 * Persists the current SQLite database state bundle to Supabase Storage
 * (`cms-private-media/cms-state/state-bundle.json`) and promotes any newly public media
 * to `cms-public-media`.
 */
export async function syncStateToSupabase(): Promise<void> {
  const cfg = getSupabaseConfig();
  if (!cfg) return;

  try {
    const bundle = exportDatabaseBundle();

    // Ensure any public media assets that were uploaded locally exist in cms-public-media bucket
    for (const media of bundle.cms_media_assets) {
      const isPublic = Number(media.is_public) === 1;
      const filename = String(media.filename || "");
      const storagePath = String(media.storage_path || "");
      const mimeType = String(media.mime_type || "image/jpeg");

      if (
        isPublic &&
        filename &&
        !storagePath.startsWith("/images/") &&
        fs.existsSync(storagePath)
      ) {
        const buf = fs.readFileSync(storagePath);
        await uploadBufferToSupabaseBucket(
          "cms-public-media",
          `uploads/${filename}`,
          buf,
          mimeType
        );
      }
    }

    const body = JSON.stringify(bundle);
    await fetch(
      `${cfg.url}/storage/v1/object/cms-private-media/${BUNDLE_OBJECT_PATH}`,
      {
        method: "POST",
        headers: {
          apikey: cfg.secretKey,
          Authorization: `Bearer ${cfg.secretKey}`,
          "Content-Type": "application/json",
          "x-upsert": "true",
        },
        body,
      }
    );
    lastPullTimestamp = Date.now();
  } catch (err) {
    console.error("[CMS Cloud Sync] Failed to push state bundle to Supabase:", err);
  }
}

/**
 * Uploads a media binary buffer to Supabase Storage (`cms-private-media` or `cms-public-media`).
 */
export async function uploadBufferToSupabaseBucket(
  bucket: "cms-private-media" | "cms-public-media",
  objectPath: string,
  buffer: Buffer,
  mimeType: string
): Promise<string | null> {
  const cfg = getSupabaseConfig();
  if (!cfg) return null;

  try {
    const res = await fetch(
      `${cfg.url}/storage/v1/object/${bucket}/${objectPath}`,
      {
        method: "POST",
        headers: {
          apikey: cfg.secretKey,
          Authorization: `Bearer ${cfg.secretKey}`,
          "Content-Type": mimeType,
          "x-upsert": "true",
        },
        body: new Uint8Array(buffer),
      }
    );
    if (!res.ok) return null;
    if (bucket === "cms-public-media") {
      return `${cfg.url}/storage/v1/object/public/${bucket}/${objectPath}`;
    }
    return objectPath;
  } catch {
    return null;
  }
}

/**
 * Downloads a private media binary from Supabase Storage (`cms-private-media/uploads/<filename>`)
 * when serving `/api/cms/media/file/[id]` on a serverless instance where `/tmp` was cold-started.
 */
export async function downloadMediaFromSupabaseIfNeeded(
  filename: string,
  isPublic: boolean
): Promise<Buffer | null> {
  const cfg = getSupabaseConfig();
  if (!cfg) return null;

  const bucket = isPublic ? "cms-public-media" : "cms-private-media";
  try {
    const res = await fetch(
      `${cfg.url}/storage/v1/object/${bucket}/uploads/${filename}`,
      {
        method: "GET",
        headers: {
          apikey: cfg.secretKey,
          Authorization: `Bearer ${cfg.secretKey}`,
        },
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    const arrayBuf = await res.arrayBuffer();
    const buf = Buffer.from(arrayBuf);
    try {
      const privateDir = getPrivateMediaDir();
      fs.mkdirSync(privateDir, { recursive: true });
      fs.writeFileSync(path.join(privateDir, filename), buf);
    } catch {
      // ignore local cache write error
    }
    return buf;
  } catch {
    return null;
  }
}

/**
 * Mirrors a provisioned CMS user (`owner` or `editor`) into Supabase Auth (`/auth/v1/admin/users`).
 */
export async function syncUserToSupabaseAuth(params: {
  email: string;
  password?: string;
  displayName: string;
  role: CmsRole;
}): Promise<void> {
  const cfg = getSupabaseConfig();
  if (!cfg || getStorageMode() !== "supabase") return;

  try {
    const listRes = await fetch(`${cfg.url}/auth/v1/admin/users`, {
      headers: {
        apikey: cfg.secretKey,
        Authorization: `Bearer ${cfg.secretKey}`,
      },
    });
    if (!listRes.ok) return;
    const data = (await listRes.json()) as {
      users?: Array<{ id: string; email?: string }>;
    };
    const existing = data.users?.find(
      (u) => u.email?.toLowerCase() === params.email.toLowerCase()
    );

    if (existing) {
      const updatePayload: Record<string, unknown> = {
        user_metadata: {
          display_name: params.displayName,
          role: params.role,
        },
        app_metadata: {
          role: params.role,
        },
      };
      if (params.password && params.password.length >= 8) {
        updatePayload.password = params.password;
      }
      await fetch(`${cfg.url}/auth/v1/admin/users/${existing.id}`, {
        method: "PUT",
        headers: {
          apikey: cfg.secretKey,
          Authorization: `Bearer ${cfg.secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatePayload),
      });
    } else if (params.password && params.password.length >= 8) {
      await fetch(`${cfg.url}/auth/v1/admin/users`, {
        method: "POST",
        headers: {
          apikey: cfg.secretKey,
          Authorization: `Bearer ${cfg.secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: params.email.toLowerCase(),
          password: params.password,
          email_confirm: true,
          user_metadata: {
            display_name: params.displayName,
            role: params.role,
          },
          app_metadata: {
            role: params.role,
          },
        }),
      });
    }
  } catch {
    // Ignore optional Auth mirror error
  }
}
