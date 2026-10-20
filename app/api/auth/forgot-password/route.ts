import { jsonError } from "@/lib/errors";

export const runtime = "nodejs";

export async function POST() {
  return jsonError("Password reset email is not set up.", 503);
}
