import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CMS_SESSION_COOKIE, verifySessionToken } from "@/lib/cms/auth";
import { ensureSupabasePulled } from "@/lib/cms/cloud-sync";
import { getCmsUserByEmail, hasAnyProvisionedUsers } from "@/lib/cms/db";
import { AdminLoginClient } from "@/components/admin/AdminLoginClient";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  await ensureSupabasePulled();
  const cookieStore = await cookies();
  const token = cookieStore.get(CMS_SESSION_COOKIE)?.value;
  const payload = verifySessionToken(token);

  if (payload) {
    const dbUser = getCmsUserByEmail(payload.email);
    if (dbUser && dbUser.isActive) {
      redirect("/admin");
    }
  }

  const hasUsers = hasAnyProvisionedUsers();

  return <AdminLoginClient hasProvisionedUsers={hasUsers} />;
}
