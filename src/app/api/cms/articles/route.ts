import { NextRequest } from "next/server";
import {
  handleCmsApiError,
  jsonResponse,
  requireAuthenticatedCmsUser,
} from "@/lib/cms/api-helpers";
import { saveArticleDraft } from "@/lib/cms/db";

export async function POST(request: NextRequest) {
  try {
    const user = requireAuthenticatedCmsUser(request);
    const body = (await request.json()) as {
      id?: string;
      draft?: unknown;
      summary?: string;
    };

    const id = body.id || `article-${Date.now()}`;
    const article = saveArticleDraft(
      id,
      body.draft ?? body,
      { email: user.email, role: user.role },
      body.summary
    );

    return jsonResponse({
      article,
      message: "تم حفظ مسودة المقال بنجاح.",
    });
  } catch (err) {
    return handleCmsApiError(err);
  }
}
