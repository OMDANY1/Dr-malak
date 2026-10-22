import { NextRequest } from "next/server";
import {
  handleCmsApiError,
  jsonResponse,
  requireOwnerCmsUser,
  syncCmsStateToCloud,
} from "@/lib/cms/api-helpers";
import { syncUserToSupabaseAuth } from "@/lib/cms/cloud-sync";
import { listCmsUsers, provisionOrUpdateCmsUser } from "@/lib/cms/db";
import { CmsRole } from "@/lib/cms/types";

export async function GET(request: NextRequest) {
  try {
    await requireOwnerCmsUser(request);
    const users = listCmsUsers();
    return jsonResponse({ users });
  } catch (err) {
    return handleCmsApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireOwnerCmsUser(request);
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      displayName?: string;
      role?: CmsRole;
      isActive?: boolean;
    };

    const user = provisionOrUpdateCmsUser({
      email: String(body.email || ""),
      password: body.password ? String(body.password) : undefined,
      displayName: String(body.displayName || ""),
      role: body.role === "owner" ? "owner" : "editor",
      isActive: body.isActive,
    });

    await syncUserToSupabaseAuth({
      email: user.email,
      password: body.password ? String(body.password) : undefined,
      displayName: user.displayName,
      role: user.role,
    });
    await syncCmsStateToCloud();

    return jsonResponse({
      user,
      users: listCmsUsers(),
      message: "تم حفظ بيانات المستخدم والصلاحيات بنجاح.",
    });
  } catch (err) {
    return handleCmsApiError(err);
  }
}
