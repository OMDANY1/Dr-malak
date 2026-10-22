import { NextRequest } from "next/server";
import { isDraftPreviewRequest } from "@/lib/cms/auth";
import { jsonResponse } from "@/lib/cms/api-helpers";
import { getPublicCmsSnapshot } from "@/lib/cms/db";

export async function GET(request: NextRequest) {
  const previewParam = request.nextUrl.searchParams.get("preview") ?? undefined;
  const previewDrafts = await isDraftPreviewRequest(previewParam);
  const snapshot = getPublicCmsSnapshot({ previewDrafts });
  return jsonResponse(snapshot, 200);
}
