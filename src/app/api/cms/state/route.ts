import { NextRequest } from "next/server";
import {
  handleCmsApiError,
  jsonResponse,
  requireAuthenticatedCmsUser,
} from "@/lib/cms/api-helpers";
import { getAdminCmsState } from "@/lib/cms/db";

export async function GET(request: NextRequest) {
  try {
    const user = requireAuthenticatedCmsUser(request);
    const state = getAdminCmsState(user);
    return jsonResponse(state);
  } catch (err) {
    return handleCmsApiError(err);
  }
}
