import { getCurrentUser } from "@/lib/auth/session";
import { inviteFamily } from "@/lib/family";
import { sendFamilyEmail } from "@/lib/family-email";
import { familyFailure as authFailure, jsonError } from "@/lib/family-http";
export const runtime = "nodejs";
export async function POST(request: Request, context: { params: Promise<{ weddingId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError("Sign in first.", 401);
    let body: unknown;
    try { body = await request.json(); } catch { return jsonError("Check the form.", 400); }
    const { weddingId } = await context.params;
    const created = await inviteFamily(user, weddingId, body);
    let status: Awaited<ReturnType<typeof sendFamilyEmail>> = "pending";
    try {
      status = await sendFamilyEmail(created.emailId);
    } catch {
      // Creation already committed. Never present a delivery/storage problem
      // as a failed invitation or ask the caller to create it again.
      console.error("Invitation saved; email delivery status is temporarily unavailable.");
    }
    return Response.json({ member: created.member, email: { status, ...(status === "failed" ? { error: "The email couldn't be sent. Try again." } : {}) } }, { status: 201 });
  } catch (error) { return authFailure(error); }
}
