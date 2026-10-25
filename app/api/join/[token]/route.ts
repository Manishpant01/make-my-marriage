import { getCurrentUser } from "@/lib/auth/session";
import { readInvite } from "@/lib/family";
import { familyFailure as authFailure, jsonError } from "@/lib/family-http";
export const runtime = "nodejs";
export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params;
    const invite = await readInvite(token, await getCurrentUser());
    return invite ? Response.json(invite) : jsonError("This invitation is unavailable. Ask the couple for help.", 404);
  } catch (error) { return authFailure(error); }
}
