import { NextRequest } from "next/server";
import { CMS_SESSION_COOKIE, signSessionToken } from "@/lib/cms/auth";
import {
  handleCmsApiError,
  jsonResponse,
} from "@/lib/cms/api-helpers";
import { ensureSupabasePulled } from "@/lib/cms/cloud-sync";
import { authenticateCmsUser, CmsError } from "@/lib/cms/db";

export async function POST(request: NextRequest) {
  try {
    await ensureSupabasePulled(true);
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    const email = String(body?.email || "").trim();
    const password = String(body?.password || "");

    if (!email || !password) {
      throw new CmsError(
        "يُرجى إدخال البريد الإلكتروني وكلمة المرور.",
        400,
        "MISSING_CREDENTIALS"
      );
    }

    const user = authenticateCmsUser(email, password);
    if (!user) {
      throw new CmsError(
        "بيانات الدخول غير صحيحة أو الحساب غير مفعّل.",
        401,
        "INVALID_CREDENTIALS"
      );
    }

    const token = signSessionToken(user);
    const response = jsonResponse({
      authenticated: true,
      user,
    });

    response.cookies.set(CMS_SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    return response;
  } catch (err) {
    return handleCmsApiError(err);
  }
}
