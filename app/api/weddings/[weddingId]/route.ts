import { getCurrentUser } from "@/lib/auth/session";
import { authFailure, jsonError } from "@/lib/errors";
import { parseWeddingPatch } from "@/lib/validators";
import { getWeddingDashboard } from "@/lib/weddings";
import { updateCouple, updateInvitation } from "@/lib/wedding-update";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ weddingId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { weddingId } = await context.params;
  try {
    const user = await getCurrentUser();
    if (!user) {
      return jsonError("Sign in first.", 401);
    }
    const wedding = await getWeddingDashboard(user._id, weddingId);
    if (!wedding) {
      return jsonError("That wedding was not found.", 404);
    }
    return Response.json({
      brideName: wedding.brideName,
      groomName: wedding.groomName,
      invitationMessage: wedding.invitationMessage,
      startDate: wedding.startDate,
      endDate: wedding.endDate,
      budgetTotal: wedding.budget,
      publicSlug: wedding.publicSlug,
      spent: wedding.spent,
      stillDue: wedding.stillDue,
    });
  } catch (error) {
    return authFailure(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { weddingId } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Check the form.", 400);
  }
  const parsed = parseWeddingPatch(body);
  if (!parsed.ok) {
    return jsonError(parsed.message, 400);
  }
  try {
    const user = await getCurrentUser();
    if (!user) {
      return jsonError("Sign in first.", 401);
    }
    const updated =
      parsed.kind === "invitation"
        ? await updateInvitation(user, weddingId, parsed.data)
        : await updateCouple(user, weddingId, parsed.data);
    if (!updated) {
      return jsonError("That wedding was not found.", 404);
    }
    return Response.json(updated);
  } catch (error) {
    return authFailure(error);
  }
}
