import { endSession } from "@/lib/auth/session";
import { authFailure, jsonError } from "@/lib/errors";

export const runtime = "nodejs";

export async function POST() {
  try {
    const ended = await endSession();
    if (!ended) {
      return jsonError("Sign in first.", 401);
    }
    return Response.json({ message: "Signed out." });
  } catch (error) {
    return authFailure(error);
  }
}
