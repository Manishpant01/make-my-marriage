import { getCurrentUser } from "@/lib/auth/session";
import { deleteEvent, getEvent, updateEvent } from "@/lib/events";
import { patchEventSchema, eventInputError } from "@/lib/event-input";
import { familyFailure, jsonError } from "@/lib/family-http";
export const runtime = "nodejs";
type Context = { params: Promise<{ weddingId: string; eventId: string }> };
export async function GET(_request: Request, context: Context) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError("Sign in first.", 401);
    const { weddingId, eventId } = await context.params;
    return Response.json(await getEvent(user._id, weddingId, eventId));
  } catch (error) { return familyFailure(error); }
}
export async function PATCH(request: Request, context: Context) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError("Sign in first.", 401);
    let body: unknown;
    try { body = await request.json(); } catch { return jsonError("Check the event details.", 400); }
    const parsed = patchEventSchema.safeParse(body);
    if (!parsed.success) return jsonError(eventInputError(parsed.error), 400);
    const { weddingId, eventId } = await context.params;
    return Response.json(await updateEvent(user, weddingId, eventId, parsed.data));
  } catch (error) { return familyFailure(error); }
}
export async function DELETE(_request: Request, context: Context) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError("Sign in first.", 401);
    const { weddingId, eventId } = await context.params;
    await deleteEvent(user, weddingId, eventId);
    return Response.json({ removed: true });
  } catch (error) { return familyFailure(error); }
}
