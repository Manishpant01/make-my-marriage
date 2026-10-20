import { assertAuthRate, clientAddress } from "@/lib/auth/rate";
import { authFailure, jsonError } from "@/lib/errors";
import { firstIssue, forgotPasswordSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Enter a valid email.", 400);
  }
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(firstIssue(parsed.error), 400);
  }
  try {
    await assertAuthRate(`forgot:${clientAddress(request)}`);
  } catch (error) {
    return authFailure(error);
  }
  return jsonError("Password reset email is not set up.", 503);
}
