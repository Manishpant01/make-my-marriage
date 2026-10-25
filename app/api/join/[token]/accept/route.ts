import { getCurrentUser } from "@/lib/auth/session";
import { acceptInvite } from "@/lib/family";
import { familyFailure as authFailure, jsonError } from "@/lib/family-http";
export const runtime = "nodejs";
export async function POST(_request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError("Sign in first.", 401);
    return Response.json(await acceptInvite(user, (await context.params).token));
  } catch (error) { return authFailure(error); }
}
