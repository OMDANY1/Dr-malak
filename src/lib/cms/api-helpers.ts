import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { CMS_SESSION_COOKIE, verifySessionToken } from "./auth";
import { ensureSupabasePulled, syncStateToSupabase } from "./cloud-sync";
import { CmsError, getCmsUserByEmail } from "./db";
import { CmsUser } from "./types";

export function jsonResponse(
  data: unknown,
  status = 200,
  extraHeaders?: Record<string, string>
): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: {
      "X-Robots-Tag": "noindex, nofollow",
      "Cache-Control": "no-store, max-age=0",
      ...(extraHeaders || {}),
    },
  });
}

export function handleCmsApiError(err: unknown): NextResponse {
  if (err instanceof CmsError) {
    return jsonResponse(
      {
        error: err.message,
        code: err.code,
      },
      err.status
    );
  }
  const message =
    err instanceof Error ? err.message : "حدث خطأ غير متوقع أثناء معالجة الطلب.";
  return jsonResponse(
    {
      error: message,
      code: "INTERNAL_ERROR",
    },
    500
  );
}

/**
 * Verifies the request's signed session cookie and ensures the user still exists and is active in DB.
 */
export async function requireAuthenticatedCmsUser(
  request: NextRequest
): Promise<CmsUser> {
  await ensureSupabasePulled();
  const token = request.cookies.get(CMS_SESSION_COOKIE)?.value;
  const payload = verifySessionToken(token);
  if (!payload) {
    throw new CmsError(
      "يلزم تسجيل الدخول للوصول إلى لوحة إدارة المحتوى.",
      401,
      "UNAUTHENTICATED"
    );
  }

  const dbUser = getCmsUserByEmail(payload.email);
  if (!dbUser || !dbUser.isActive) {
    throw new CmsError(
      "الجلسة غير صالحة أو تم إيقاف الحساب.",
      401,
      "UNAUTHENTICATED"
    );
  }

  return dbUser;
}

export async function requireOwnerCmsUser(
  request: NextRequest
): Promise<CmsUser> {
  const user = await requireAuthenticatedCmsUser(request);
  if (user.role !== "owner") {
    throw new CmsError(
      "هذا الإجراء متاح فقط لدور المالك (Owner). حساب المحرر (Editor) مخصص لإعداد المسودات ومعاينتها.",
      403,
      "FORBIDDEN_ROLE"
    );
  }
  return user;
}

export async function syncCmsStateToCloud(): Promise<void> {
  await syncStateToSupabase();
}

/**
 * Invalidates Next.js App Router caches across both Arabic and English public routes after publish/unpublish.
 */
export function revalidatePublicSite(): void {
  try {
    revalidatePath("/", "layout");
    revalidatePath("/ar", "layout");
    revalidatePath("/en", "layout");
    revalidatePath("/ar", "page");
    revalidatePath("/en", "page");
    revalidatePath("/ar/about", "page");
    revalidatePath("/en/about", "page");
    revalidatePath("/ar/specialties", "page");
    revalidatePath("/en/specialties", "page");
    revalidatePath("/ar/articles", "page");
    revalidatePath("/en/articles", "page");
    revalidatePath("/ar/contact", "page");
    revalidatePath("/en/contact", "page");
    revalidatePath("/sitemap.xml");
  } catch {
    // Ignore when called outside Next.js request context (e.g. unit test runner)
  }
}
