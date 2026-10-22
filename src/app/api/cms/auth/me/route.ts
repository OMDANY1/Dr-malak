import { NextRequest } from "next/server";
import {
  handleCmsApiError,
  jsonResponse,
  requireAuthenticatedCmsUser,
} from "@/lib/cms/api-helpers";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthenticatedCmsUser(request);
    return jsonResponse({ authenticated: true, user });
  } catch (err) {
    return handleCmsApiError(err);
  }
}
