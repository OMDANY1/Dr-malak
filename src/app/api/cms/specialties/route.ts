import { NextRequest } from "next/server";
import {
  handleCmsApiError,
  jsonResponse,
  requireAuthenticatedCmsUser,
  syncCmsStateToCloud,
} from "@/lib/cms/api-helpers";
import { saveSpecialtyDraft } from "@/lib/cms/db";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthenticatedCmsUser(request);
    const body = (await request.json()) as {
      id?: string;
      draft?: unknown;
      displayOrder?: number;
      summary?: string;
    };

    const id = body.id || `specialty-${Date.now()}`;
    const specialty = saveSpecialtyDraft(
      id,
      body.draft ?? body,
      body.displayOrder,
      { email: user.email, role: user.role },
      body.summary
    );

    await syncCmsStateToCloud();

    return jsonResponse({
      specialty,
      message: "تم حفظ مسودة التخصص بنجاح.",
    });
  } catch (err) {
    return handleCmsApiError(err);
  }
}
