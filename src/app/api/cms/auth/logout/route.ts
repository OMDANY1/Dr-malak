import { NextResponse } from "next/server";
import { CMS_PREVIEW_COOKIE, CMS_SESSION_COOKIE } from "@/lib/cms/auth";

export async function POST() {
  const response = NextResponse.json(
    { loggedOut: true },
    {
      headers: {
        "X-Robots-Tag": "noindex, nofollow",
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
  response.cookies.delete(CMS_SESSION_COOKIE);
  response.cookies.delete(CMS_PREVIEW_COOKIE);
  return response;
}
