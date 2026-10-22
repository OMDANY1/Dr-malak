import { NextRequest, NextResponse } from "next/server";
import {
  CMS_PREVIEW_COOKIE,
  signDraftPreviewToken,
} from "@/lib/cms/auth";
import {
  handleCmsApiError,
  jsonResponse,
  requireAuthenticatedCmsUser,
} from "@/lib/cms/api-helpers";

export async function POST(request: NextRequest) {
  try {
    const user = requireAuthenticatedCmsUser(request);
    const body = (await request.json().catch(() => ({}))) as {
      enable?: boolean;
      targetPath?: string;
    };

    const enable = body.enable !== false;
    const response = jsonResponse({
      previewEnabled: enable,
      targetPath: body.targetPath || "/ar?preview=draft",
    });

    if (enable) {
      const token = signDraftPreviewToken(user.email, user.role);
      response.cookies.set(CMS_PREVIEW_COOKIE, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 4,
      });
    } else {
      response.cookies.delete(CMS_PREVIEW_COOKIE);
    }

    return response;
  } catch (err) {
    return handleCmsApiError(err);
  }
}

export async function DELETE() {
  const response = jsonResponse({ previewEnabled: false });
  response.cookies.delete(CMS_PREVIEW_COOKIE);
  return response;
}

export async function GET(request: NextRequest) {
  const action = request.nextUrl.searchParams.get("action");
  const redirectPath = request.nextUrl.searchParams.get("redirect") || "/ar";
  const safeRedirect = redirectPath.startsWith("/") ? redirectPath : "/ar";

  if (action === "exit") {
    const url = request.nextUrl.clone();
    url.pathname = safeRedirect.split("?")[0];
    url.search = "";
    const response = NextResponse.redirect(url, 307);
    response.cookies.delete(CMS_PREVIEW_COOKIE);
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }

  try {
    const user = requireAuthenticatedCmsUser(request);
    const token = signDraftPreviewToken(user.email, user.role);
    const url = request.nextUrl.clone();
    url.pathname = safeRedirect.split("?")[0];
    url.searchParams.set("preview", "draft");
    const response = NextResponse.redirect(url, 307);
    response.cookies.set(CMS_PREVIEW_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 4,
    });
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  } catch (err) {
    return handleCmsApiError(err);
  }
}
