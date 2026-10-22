import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { CMS_PREVIEW_COOKIE, CMS_SESSION_COOKIE, verifyDraftPreviewToken, verifySessionToken } from "@/lib/cms/auth";
import { getMediaAssetById, getPrivateMediaDir, getPublicUploadsDir } from "@/lib/cms/db";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const asset = getMediaAssetById(id);

  if (!asset) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // Unpublished private uploads must NOT be exposed to anonymous public clients
  if (!asset.isPublic) {
    const sessionToken = request.cookies.get(CMS_SESSION_COOKIE)?.value;
    const previewToken = request.cookies.get(CMS_PREVIEW_COOKIE)?.value;
    const hasSession = Boolean(verifySessionToken(sessionToken));
    const hasPreview = Boolean(verifyDraftPreviewToken(previewToken));
    if (!hasSession && !hasPreview) {
      return NextResponse.json(
        {
          error:
            "هذه الصورة خاصة بمسودة غير منشورة ولا يُسمح بالوصول العام إليها قبل نشر المحتوى.",
          code: "PRIVATE_MEDIA_FORBIDDEN",
        },
        {
          status: 403,
          headers: {
            "X-Robots-Tag": "noindex, nofollow",
            "Cache-Control": "no-store",
          },
        }
      );
    }
  }

  // Locate file on disk (either in private media dir, public uploads dir, or public/ static path)
  const candidates = [
    asset.storagePath,
    path.join(getPrivateMediaDir(), asset.filename),
    path.join(getPublicUploadsDir(), asset.filename),
    path.join(process.cwd(), "public", asset.storagePath.replace(/^\//, "")),
  ];

  let foundPath: string | null = null;
  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      foundPath = candidate;
      break;
    }
  }

  if (!foundPath) {
    return new NextResponse("Media binary not found", { status: 404 });
  }

  const buffer = fs.readFileSync(foundPath);
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": asset.mimeType || "image/jpeg",
      "Content-Length": String(buffer.length),
      "Content-Disposition": `inline; filename="${asset.filename}"`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": asset.isPublic
        ? "public, max-age=31536000, immutable"
        : "private, no-store",
    },
  });
}
