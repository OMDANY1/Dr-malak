import { NextRequest } from "next/server";
import {
  handleCmsApiError,
  jsonResponse,
  requireAuthenticatedCmsUser,
  requireOwnerCmsUser,
  revalidatePublicSite,
} from "@/lib/cms/api-helpers";
import {
  CmsError,
  publishDocument,
  saveDocumentDraft,
} from "@/lib/cms/db";

const VALID_KEYS = new Set([
  "homepage",
  "doctorProfile",
  "faq",
  "contactSettings",
]);

type ValidDocKey = "homepage" | "doctorProfile" | "faq" | "contactSettings";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ key: string }> }
) {
  try {
    const user = requireAuthenticatedCmsUser(request);
    const { key } = await context.params;
    if (!VALID_KEYS.has(key)) {
      throw new CmsError("مفتاح المستند غير معروف.", 404, "NOT_FOUND");
    }

    const body = (await request.json()) as {
      draft?: unknown;
      summary?: string;
    };

    const saved = saveDocumentDraft(
      key as ValidDocKey,
      body.draft ?? body,
      { email: user.email, role: user.role },
      body.summary
    );

    return jsonResponse({
      key,
      draft: saved,
      message: "تم حفظ المسودة بنجاح دون تغيير النسخة المنشورة للزوار.",
    });
  } catch (err) {
    return handleCmsApiError(err);
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ key: string }> }
) {
  try {
    const user = requireOwnerCmsUser(request);
    const { key } = await context.params;
    if (!VALID_KEYS.has(key)) {
      throw new CmsError("مفتاح المستند غير معروف.", 404, "NOT_FOUND");
    }

    const body = (await request.json().catch(() => ({}))) as {
      draft?: unknown;
      summary?: string;
    };

    const published = publishDocument(
      key as ValidDocKey,
      { email: user.email, role: user.role },
      body.draft,
      body.summary
    );

    revalidatePublicSite();

    return jsonResponse({
      key,
      published,
      message: "تم نشر التحديثات على الموقع العام بنجاح.",
    });
  } catch (err) {
    return handleCmsApiError(err);
  }
}
