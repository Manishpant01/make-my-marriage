import { getCurrentUser } from "@/lib/auth/session";
import { authFailure, jsonError } from "@/lib/errors";
import { createWeddingSchema, firstIssue, readPage } from "@/lib/validators";
import { createWedding, listWeddings } from "@/lib/weddings";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const page = readPage(new URL(request.url));
  if (!page) {
    return jsonError("Check the page.", 400);
  }
  try {
    const user = await getCurrentUser();
    if (!user) {
      return jsonError("Sign in first.", 401);
    }
    const result = await listWeddings(user._id, page.page, page.pageSize);
    return Response.json(result);
  } catch (error) {
    return authFailure(error);
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Check the wedding.", 400);
  }
  const parsed = createWeddingSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(firstIssue(parsed.error), 400);
  }
  try {
    const user = await getCurrentUser();
    if (!user) {
      return jsonError("Sign in first.", 401);
    }
    const wedding = await createWedding(user, parsed.data);
    return Response.json(wedding);
  } catch (error) {
    return authFailure(error);
  }
}
