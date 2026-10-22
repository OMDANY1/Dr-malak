import { NextRequest } from "next/server";
import {
  handleCmsApiError,
  jsonResponse,
  requireAuthenticatedCmsUser,
  requireOwnerCmsUser,
  revalidatePublicSite,
  syncCmsStateToCloud,
} from "@/lib/cms/api-helpers";
import {
  publishSpecialty,
  saveSpecialtyDraft,
  unpublishSpecialty,
} from "@/lib/cms/db";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuthenticatedCmsUser(request);
    const { id } = await context.params;
    const body = (await request.json()) as {
      draft?: unknown;
      displayOrder?: number;
      summary?: string;
    };

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

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireOwnerCmsUser(request);
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      action?: "publish" | "unpublish";
      draft?: unknown;
      displayOrder?: number;
      summary?: string;
    };

    if (body.action === "unpublish") {
      const specialty = unpublishSpecialty(id, {
        email: user.email,
        role: user.role,
      });
      await syncCmsStateToCloud();
      revalidatePublicSite();
      return jsonResponse({
        specialty,
        message: "تم إلغاء نشر التخصص وتحويله إلى مسودة.",
      });
    }

    const specialty = publishSpecialty(
      id,
      { email: user.email, role: user.role },
      body.draft,
      body.displayOrder,
      body.summary
    );

    await syncCmsStateToCloud();
    revalidatePublicSite();

    return jsonResponse({
      specialty,
      message: "تم نشر التخصص على الموقع العام بنجاح.",
    });
  } catch (err) {
    return handleCmsApiError(err);
  }
}
