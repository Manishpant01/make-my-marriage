import { getCurrentUser } from "@/lib/auth/session";
import { removeHelper } from "@/lib/family";
import { familyFailure as authFailure, jsonError } from "@/lib/family-http";
export const runtime = "nodejs";
export async function DELETE(_request: Request, context: { params: Promise<{ weddingId: string; membershipId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError("Sign in first.", 401);
    const { weddingId, membershipId } = await context.params;
    await removeHelper(user, weddingId, membershipId);
    return Response.json({ removed: true });
  } catch (error) { return authFailure(error); }
}
