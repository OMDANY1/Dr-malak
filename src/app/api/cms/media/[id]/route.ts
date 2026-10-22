import { NextRequest } from "next/server";
import {
  handleCmsApiError,
  jsonResponse,
  requireAuthenticatedCmsUser,
  requireOwnerCmsUser,
} from "@/lib/cms/api-helpers";
import { deleteMediaAsset, updateMediaAsset } from "@/lib/cms/db";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuthenticatedCmsUser(request);
    const { id } = await context.params;
    const body = (await request.json()) as {
      altText?: { ar: string; en: string };
      focalPoint?: { x: number; y: number };
      isPublic?: boolean;
      replaceBase64?: string;
      replaceFilename?: string;
      replaceMimeType?: string;
    };

    let replaceBuffer: Buffer | undefined;
    if (body.replaceBase64) {
      const cleanBase64 = body.replaceBase64.replace(/^data:[^;]+;base64,/, "");
      replaceBuffer = Buffer.from(cleanBase64, "base64");
    }

    const asset = updateMediaAsset(id, {
      altText: body.altText,
      focalPoint: body.focalPoint,
      // Only owner can directly toggle public visibility of an asset
      isPublic: user.role === "owner" ? body.isPublic : undefined,
      replaceBuffer,
      replaceOriginalFilename: body.replaceFilename,
      replaceMimeType: body.replaceMimeType,
      actor: { email: user.email, role: user.role },
    });

    return jsonResponse({
      asset,
      message: "تم تحديث بيانات الصورة بنجاح.",
    });
  } catch (err) {
    return handleCmsApiError(err);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireOwnerCmsUser(request);
    const { id } = await context.params;
    const result = deleteMediaAsset(id, {
      email: user.email,
      role: user.role,
    });

    return jsonResponse({
      ...result,
      message: "تم حذف الصورة من مكتبة الوسائط.",
    });
  } catch (err) {
    return handleCmsApiError(err);
  }
}
