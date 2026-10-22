import { NextRequest } from "next/server";
import {
  handleCmsApiError,
  jsonResponse,
  requireAuthenticatedCmsUser,
  syncCmsStateToCloud,
} from "@/lib/cms/api-helpers";
import { uploadBufferToSupabaseBucket } from "@/lib/cms/cloud-sync";
import {
  CmsError,
  listMediaAssets,
  uploadMediaAsset,
} from "@/lib/cms/db";

export async function GET(request: NextRequest) {
  try {
    await requireAuthenticatedCmsUser(request);
    const mediaAssets = listMediaAssets();
    return jsonResponse({ mediaAssets });
  } catch (err) {
    return handleCmsApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthenticatedCmsUser(request);
    const contentType = request.headers.get("content-type") || "";

    let buffer: Buffer;
    let originalFilename = "upload.jpg";
    let mimeType = "image/jpeg";
    let altAr = "";
    let altEn = "";
    let focalX = 50;
    let focalY = 50;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      if (!file || typeof (file as Blob).arrayBuffer !== "function") {
        throw new CmsError(
          "يُرجى اختيار ملف صورة لرفعه.",
          400,
          "MISSING_FILE"
        );
      }
      const f = file as File;
      originalFilename = f.name || "upload.jpg";
      mimeType = f.type || "image/jpeg";
      buffer = Buffer.from(await f.arrayBuffer());
      altAr = String(formData.get("altAr") || "");
      altEn = String(formData.get("altEn") || "");
      focalX = Number(formData.get("focalX") ?? 50);
      focalY = Number(formData.get("focalY") ?? 50);
    } else {
      const body = (await request.json()) as {
        base64?: string;
        filename?: string;
        mimeType?: string;
        altText?: { ar?: string; en?: string };
        focalPoint?: { x?: number; y?: number };
      };
      if (!body.base64) {
        throw new CmsError(
          "بيانات الصورة المرفوعة غير مكتملة.",
          400,
          "MISSING_FILE"
        );
      }
      const cleanBase64 = body.base64.replace(/^data:[^;]+;base64,/, "");
      buffer = Buffer.from(cleanBase64, "base64");
      originalFilename = body.filename || "upload.jpg";
      mimeType = body.mimeType || "image/jpeg";
      altAr = body.altText?.ar || "";
      altEn = body.altText?.en || "";
      focalX = Number(body.focalPoint?.x ?? 50);
      focalY = Number(body.focalPoint?.y ?? 50);
    }

    const asset = uploadMediaAsset({
      buffer,
      originalFilename,
      mimeType,
      altText: { ar: altAr, en: altEn },
      focalPoint: { x: focalX, y: focalY },
      actor: { email: user.email, role: user.role },
    });

    await uploadBufferToSupabaseBucket(
      "cms-private-media",
      `uploads/${asset.filename}`,
      buffer,
      asset.mimeType
    );
    await syncCmsStateToCloud();

    return jsonResponse({
      asset,
      message:
        "تم رفع الصورة بنجاح إلى مكتبة الوسائط الخاصة (تُنشر للعامة تلقائيًا عند نشر المحتوى المرتبط بها).",
    });
  } catch (err) {
    return handleCmsApiError(err);
  }
}
