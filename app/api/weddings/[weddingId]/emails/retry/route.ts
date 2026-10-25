import { getCurrentUser } from "@/lib/auth/session";
import { retryFamilyEmails } from "@/lib/family-email";
import { familyFailure as authFailure, jsonError } from "@/lib/family-http";
export const runtime = "nodejs";
export async function POST(_request: Request, context: { params: Promise<{ weddingId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError("Sign in first.", 401);
    const { weddingId } = await context.params;
    return Response.json(await retryFamilyEmails(user, weddingId));
  } catch (error) { return authFailure(error); }
}
