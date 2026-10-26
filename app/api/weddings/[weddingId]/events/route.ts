import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { createEvent, listEvents } from "@/lib/events";
import { createEventSchema, eventInputError } from "@/lib/event-input";
import { familyFailure, jsonError } from "@/lib/family-http";
import { readPage } from "@/lib/validators";
export const runtime = "nodejs";
type Context = { params: Promise<{ weddingId: string }> };
export async function GET(request: Request, context: Context) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError("Sign in first.", 401);
    const page = readPage(new URL(request.url));
    if (!page) return jsonError("Choose a valid page.", 400);
    return Response.json(await listEvents(user._id, (await context.params).weddingId, page.page, page.pageSize));
  } catch (error) { return familyFailure(error); }
}
export async function POST(request: Request, context: Context) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError("Sign in first.", 401);
    let body: unknown;
    try { body = await request.json(); } catch { return jsonError("Check the event details.", 400); }
    const parsed = createEventSchema.safeParse(body);
    if (!parsed.success) return jsonError(eventInputError(parsed.error), 400);
    const key = request.headers.get("Idempotency-Key") ?? undefined;
    if (key !== undefined && !z.uuid().safeParse(key).success) return jsonError("Check the save key.", 400);
    return Response.json(await createEvent(user, (await context.params).weddingId, parsed.data, key), { status: 201 });
  } catch (error) { return familyFailure(error); }
}
