import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CMS_SESSION_COOKIE, verifySessionToken } from "@/lib/cms/auth";
import { getAdminCmsState, getCmsUserByEmail } from "@/lib/cms/db";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CMS_SESSION_COOKIE)?.value;
  const payload = verifySessionToken(token);

  if (!payload) {
    redirect("/admin/login");
  }

  const dbUser = getCmsUserByEmail(payload.email);
  if (!dbUser || !dbUser.isActive) {
    redirect("/admin/login");
  }

  const initialState = getAdminCmsState(dbUser);

  return <AdminDashboardClient initialState={initialState} />;
}
