import { NextRequest } from "next/server";
import {
  handleCmsApiError,
  jsonResponse,
  requireAuthenticatedCmsUser,
  requireOwnerCmsUser,
  revalidatePublicSite,
} from "@/lib/cms/api-helpers";
import {
  publishArticle,
  saveArticleDraft,
  unpublishArticle,
} from "@/lib/cms/db";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuthenticatedCmsUser(request);
    const { id } = await context.params;
    const body = (await request.json()) as {
      draft?: unknown;
      summary?: string;
    };

    const article = saveArticleDraft(
      id,
      body.draft ?? body,
      { email: user.email, role: user.role },
      body.summary
    );

    return jsonResponse({
      article,
      message: "تم حفظ مسودة المقال بنجاح دون تغيير النسخة المنشورة.",
    });
  } catch (err) {
    return handleCmsApiError(err);
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireOwnerCmsUser(request);
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      action?: "publish" | "unpublish";
      draft?: unknown;
      summary?: string;
    };

    if (body.action === "unpublish") {
      const article = unpublishArticle(id, {
        email: user.email,
        role: user.role,
      });
      revalidatePublicSite();
      return jsonResponse({
        article,
        message: "تم إلغاء نشر المقال وتحويله إلى مسودة.",
      });
    }

    const article = publishArticle(
      id,
      { email: user.email, role: user.role },
      body.draft,
      body.summary
    );

    revalidatePublicSite();

    return jsonResponse({
      article,
      message: "تم نشر المقال على الموقع العام بنجاح.",
    });
  } catch (err) {
    return handleCmsApiError(err);
  }
}
