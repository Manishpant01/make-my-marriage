import { ObjectId } from "mongodb";
import { assertAuthRate } from "@/lib/auth/rate";
import type { UserDoc } from "@/lib/auth/session";
import { readyDb } from "@/lib/db";
import { ForbiddenError } from "@/lib/errors";

async function adminWedding(user: UserDoc, weddingId: string, refusal: string) {
  if (!ObjectId.isValid(weddingId)) {
    return null;
  }
  const id = new ObjectId(weddingId);
  const db = await readyDb();
  const membership = await db.collection("memberships").findOne({
    userId: user._id,
    weddingId: id,
  });
  if (!membership) {
    return null;
  }
  await assertAuthRate(`wedding-update:${user._id.toString()}`);
  if (membership.role !== "admin") {
    throw new ForbiddenError(refusal);
  }
  return { db, id };
}

export async function updateCouple(
  user: UserDoc,
  weddingId: string,
  input: {
    brideName: string;
    groomName: string;
    startDate: string;
    endDate: string;
    invitationMessage?: string;
  },
) {
  const loaded = await adminWedding(
    user,
    weddingId,
    "Only an admin can change the couple.",
  );
  if (!loaded) {
    return null;
  }
  const result = await loaded.db.collection("weddings").updateOne(
    { _id: loaded.id },
    { $set: input },
  );
  if (result.matchedCount === 0) {
    return null;
  }
  return input;
}

export async function updateInvitation(
  user: UserDoc,
  weddingId: string,
  input: { invitationMessage: string },
) {
  const loaded = await adminWedding(
    user,
    weddingId,
    "Only an admin can change the invitation.",
  );
  if (!loaded) {
    return null;
  }
  const result = await loaded.db.collection("weddings").updateOne(
    { _id: loaded.id },
    { $set: { invitationMessage: input.invitationMessage } },
  );
  if (result.matchedCount === 0) {
    return null;
  }
  return input;
}
