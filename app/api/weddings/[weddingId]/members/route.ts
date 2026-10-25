import { getCurrentUser } from "@/lib/auth/session";
import { listFamily } from "@/lib/family";
import { familyFailure as authFailure, jsonError } from "@/lib/family-http";
export const runtime = "nodejs";
export async function GET(request: Request, context: { params: Promise<{ weddingId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError("Sign in first.", 401);
    const { weddingId } = await context.params;
    const query = new URL(request.url).searchParams;
    return Response.json(await listFamily(user._id, weddingId, Number(query.get("page") ?? 1), Number(query.get("pageSize") ?? 20)));
  } catch (error) { return authFailure(error); }
}
