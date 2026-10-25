import { randomBytes } from "node:crypto";
import { MongoServerError, ObjectId, type Db, type ClientSession } from "mongodb";
import { z } from "zod";
import { readyDb, transaction } from "@/lib/db";
import { RequestError } from "@/lib/errors";
import { assertAuthRate } from "@/lib/auth/rate";
import type { UserDoc } from "@/lib/auth/session";
import { validInviteToken } from "@/lib/invite-path";

export const inviteSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email().max(254),
  role: z.enum(["admin", "helper"]),
  relation: z.enum(["bride", "groom", "mother", "father", "brother", "sister", "other"]),
}).strict();

export type MemberDoc = {
  _id: ObjectId; weddingId: ObjectId; userId?: ObjectId;
  name: string; email: string; role: "admin" | "helper"; relation: string; inviteToken?: string;
};
export type InviteWedding = {
  _id: ObjectId; brideName: string; groomName: string; startDate: string; endDate: string;
};
export type FamilyMember = {
  id: string; name: string; email: string; role: "admin" | "helper"; relation: string;
  joined: boolean; emailStatus?: "pending" | "sent" | "failed";
};
export type FamilyPage = { items: FamilyMember[]; total: number; page: number; pageSize: number };
export type EmailDoc = {
  _id: ObjectId; weddingId: ObjectId; membershipId: ObjectId; recipientEmail: string;
  kind: "helper_invite"; status: "pending" | "sent" | "failed";
  error?: string; sentAt?: Date; leaseId?: string; leaseUntil?: Date;
  providerEmailId?: string;
  firstAttemptAt?: Date;
  sendContext?: {
    from: string; appUrl: string; name: string; relation: string; role: "admin" | "helper";
    brideName: string; groomName: string;
  };
};

export function safeMember(member: MemberDoc): FamilyMember {
  return { id: member._id.toString(), name: member.name, email: member.email,
    role: member.role, relation: member.relation, joined: !!member.userId };
}

export async function familyAccess(userId: ObjectId, weddingId: string, admin = false) {
  if (!ObjectId.isValid(weddingId)) throw new RequestError("That wedding was not found.", 404);
  const db = await readyDb();
  const id = new ObjectId(weddingId);
  const member = await db.collection<MemberDoc>("memberships").findOne({ weddingId: id, userId });
  const wedding = member ? await db.collection<InviteWedding>("weddings").findOne({ _id: id }) : null;
  if (!member || !wedding) throw new RequestError("That wedding was not found.", 404);
  if (admin && member.role !== "admin") throw new RequestError("Only admins can perform this action.", 403);
  return { db, id, member, wedding };
}

export async function listFamily(userId: ObjectId, weddingId: string, page = 1, pageSize = 20): Promise<FamilyPage> {
  const { db, id, member } = await familyAccess(userId, weddingId);
  page = Number.isSafeInteger(page) && page > 0 ? Math.min(page, 1_000_000) : 1;
  pageSize = Math.max(1, Math.min(50, Math.floor(pageSize) || 20));
  const collection = db.collection<MemberDoc>("memberships");
  const [rows, total] = await Promise.all([
    collection.find({ weddingId: id }).sort({ _id: 1 }).skip((page - 1) * pageSize).limit(pageSize).toArray(),
    collection.countDocuments({ weddingId: id }),
  ]);
  const visibleEmailIds = rows.filter(row => member.role === "admin" || row.role === "helper").map(row => row._id);
  const emails = await db.collection<EmailDoc>("emailSends")
    .find({ weddingId: id, kind: "helper_invite", membershipId: { $in: visibleEmailIds } }).toArray();
  const statuses = new Map(emails.map(row => [String(row.membershipId), row.status]));
  return { items: rows.map(row => ({ ...safeMember(row), ...(statuses.has(String(row._id)) ? { emailStatus: statuses.get(String(row._id)) } : {}) })), total, page, pageSize };
}

export async function inviteFamily(user: UserDoc, weddingId: string, body: unknown) {
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) throw new RequestError("Check the name, email, and relation.");
  const input = parsed.data;
  const access = await familyAccess(user._id, weddingId);
  if (input.role === "admin" && access.member.role !== "admin") {
    throw new RequestError("Only admins can invite a partner.", 403);
  }
  if (input.email === user.email.toLowerCase()) throw new RequestError("You are already part of this wedding.", 409);
  const opposite = access.member.relation === "bride" ? "groom" : access.member.relation === "groom" ? "bride" : null;
  if (input.role === "admin" ? input.relation !== opposite : ["bride", "groom"].includes(input.relation)) {
    throw new RequestError("Choose a valid relation for this invitation.");
  }
  await assertAuthRate(`family-invite:${user._id}:${access.id}`);
  const membership: MemberDoc = { _id: new ObjectId(), weddingId: access.id,
    ...input, inviteToken: randomBytes(32).toString("base64url") };
  const email: EmailDoc = { _id: new ObjectId(), weddingId: access.id,
    membershipId: membership._id, recipientEmail: input.email, kind: "helper_invite", status: "pending" };
  try {
    await transaction(async (db, session) => {
      // Recheck access in the same snapshot as the two durable writes.
      const current = await db.collection<MemberDoc>("memberships").findOne({ _id: access.member._id, weddingId: access.id, userId: user._id }, { session });
      const wedding = await db.collection("weddings").findOne({ _id: access.id }, { session });
      if (!current || !wedding) throw new RequestError("That wedding was not found.", 404);
      if (input.role === "admin" && current.role !== "admin") throw new RequestError("Only admins can invite a partner.", 403);
      await db.collection<MemberDoc>("memberships").insertOne(membership, { session });
      await db.collection<EmailDoc>("emailSends").insertOne(email, { session });
    });
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      throw new RequestError("That email or partner is already pending or joined. View Family to check.", 409);
    }
    throw error;
  }
  return { member: safeMember(membership), emailId: email._id };
}

export async function removeHelper(user: UserDoc, weddingId: string, membershipId: string) {
  const { id } = await familyAccess(user._id, weddingId, true);
  if (!ObjectId.isValid(membershipId)) throw new RequestError("That family member was not found.", 404);
  await transaction(async (db, session) => {
    const target = await db.collection<MemberDoc>("memberships").findOne({ _id: new ObjectId(membershipId), weddingId: id }, { session });
    if (!target) throw new RequestError("That family member was not found.", 404);
    if (target.role !== "helper") throw new RequestError("Admins cannot be removed.", 403);
    await db.collection("memberships").deleteOne({ _id: target._id, weddingId: id, role: "helper" }, { session });
    await db.collection("emailSends").deleteMany({ membershipId: target._id, kind: "helper_invite" }, { session });
  });
}

export async function readInvite(token: string, user?: Pick<UserDoc, "_id"> | null) {
  if (!validInviteToken(token)) return null;
  const db = await readyDb();
  const member = await db.collection<MemberDoc>("memberships").findOne({ inviteToken: token });
  if (!member || (member.userId && user && !member.userId.equals(user._id))) return null;
  const wedding = await db.collection<InviteWedding>("weddings").findOne({ _id: member.weddingId });
  if (!wedding) return null;
  return { name: member.name, email: member.email, role: member.role, relation: member.relation,
    joined: !!member.userId, wedding: { id: String(wedding._id), brideName: wedding.brideName,
      groomName: wedding.groomName, startDate: wedding.startDate, endDate: wedding.endDate } };
}
export type JoinInvite = NonNullable<Awaited<ReturnType<typeof readInvite>>>;

export async function acceptInvite(user: UserDoc, token: string) {
  if (!validInviteToken(token)) throw new RequestError("This invitation is unavailable. Ask the couple for help.", 404);
  await assertAuthRate(`join:${user._id}`);
  return transaction(async (db: Db, session: ClientSession) => {
    const member = await db.collection<MemberDoc>("memberships").findOne({ inviteToken: token }, { session });
    const wedding = member ? await db.collection<InviteWedding>("weddings").findOne({ _id: member.weddingId }, { session }) : null;
    if (!member || !wedding || (member.userId && !member.userId.equals(user._id))) {
      throw new RequestError("This invitation is unavailable. Ask the couple for help.", 404);
    }
    if (member.email.toLowerCase() !== user.email.toLowerCase()) {
      throw new RequestError("Use the email this invitation was sent to. Switch accounts to continue.", 403);
    }
    if (!member.userId) {
      await db.collection<MemberDoc>("memberships").updateOne({ _id: member._id, userId: { $exists: false } }, { $set: { userId: user._id } }, { session });
    }
    return { weddingId: String(wedding._id), brideName: wedding.brideName, groomName: wedding.groomName,
      startDate: wedding.startDate, endDate: wedding.endDate, role: member.role, relation: member.relation, joined: true };
  });
}
