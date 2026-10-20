import { assertAuthRate, clientAddress } from "@/lib/auth/rate";
import { publicUser } from "@/lib/auth/session";
import { signUp } from "@/lib/auth/users";
import { authFailure, jsonError } from "@/lib/errors";
import { firstIssue, signupSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Check the name, email, and password.", 400);
  }
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(firstIssue(parsed.error), 400);
  }
  try {
    await assertAuthRate(`signup:${clientAddress(request)}`);
    const user = await signUp(parsed.data);
    return Response.json(publicUser(user));
  } catch (error) {
    return authFailure(error);
  }
}
