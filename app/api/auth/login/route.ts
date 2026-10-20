import { assertAuthRate, clientAddress } from "@/lib/auth/rate";
import { publicUser, startSession } from "@/lib/auth/session";
import { findUserByPassword } from "@/lib/auth/users";
import { authFailure, jsonError } from "@/lib/errors";
import { firstIssue, loginSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Check the email and password.", 400);
  }
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(firstIssue(parsed.error), 400);
  }
  try {
    await assertAuthRate(`login:${clientAddress(request)}`);
    const user = await findUserByPassword(parsed.data.email, parsed.data.password);
    if (!user) {
      return jsonError("Email or password is wrong.", 401);
    }
    await startSession(user._id);
    return Response.json(publicUser(user));
  } catch (error) {
    return authFailure(error);
  }
}
