import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_LOCALE } from "./lib/locales";
import siteConfig from "../content/site-config.json";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = `/${DEFAULT_LOCALE}`;
    const redirectResponse = NextResponse.redirect(url, 307);
    if (siteConfig.previewNoIndex) {
      redirectResponse.headers.set("X-Robots-Tag", "noindex, nofollow");
    }
    return redirectResponse;
  }

  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];
  const isAdminOrApi = firstSegment === "admin" || firstSegment === "api";
  const resolvedLocale = firstSegment === "en" ? "en" : "ar";

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-locale", resolvedLocale);
  requestHeaders.set("x-pathname", pathname);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  const isPreview =
    request.nextUrl.searchParams.get("preview") === "draft" ||
    Boolean(request.cookies.get("cms_draft_preview")?.value);

  if (siteConfig.previewNoIndex || isAdminOrApi || isPreview) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|fonts|images|brand|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
