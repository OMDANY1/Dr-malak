import { NextRequest } from "next/server";
import {
  handleCmsApiError,
  jsonResponse,
  requireOwnerCmsUser,
  syncCmsStateToCloud,
} from "@/lib/cms/api-helpers";
import { restoreRevisionToDraft } from "@/lib/cms/db";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireOwnerCmsUser(request);
    const { id } = await context.params;
    const result = restoreRevisionToDraft(id, {
      email: user.email,
      role: user.role,
    });

    await syncCmsStateToCloud();

    return jsonResponse({
      ...result,
      message:
        "تمت استعادة الإصدار المحدد كمسودة جديدة بنجاح دون المساس بسجل الإصدارات.",
    });
  } catch (err) {
    return handleCmsApiError(err);
  }
}
