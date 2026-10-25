import { randomBytes } from "node:crypto";
import type { ObjectId } from "mongodb";
import { readyDb } from "@/lib/db";
import { familyAccess, type EmailDoc, type MemberDoc, type InviteWedding } from "@/lib/family";
import { assertAuthRate } from "@/lib/auth/rate";
import type { UserDoc } from "@/lib/auth/session";

function escape(value: string) {
  return value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}

export async function sendFamilyEmail(emailId: ObjectId) {
  const db = await readyDb();
  const emails = db.collection<EmailDoc>("emailSends");
  const leaseId = randomBytes(16).toString("hex");
  const row = await emails.findOneAndUpdate({ _id: emailId, kind: "helper_invite", status: { $in: ["pending", "failed"] },
    $or: [{ leaseUntil: { $exists: false } }, { leaseUntil: { $lte: new Date() } }] },
    { $set: { leaseId, leaseUntil: new Date(Date.now() + 120_000), status: "pending" } }, { returnDocument: "after" });
  if (!row) return (await emails.findOne({ _id: emailId }))?.status ?? "failed";
  let providerAccepted = false;
  let definitelyRejected = false;
  try {
    const member = await db.collection<MemberDoc>("memberships").findOne({ _id: row.membershipId, weddingId: row.weddingId });
    const wedding = await db.collection<InviteWedding>("weddings").findOne({ _id: row.weddingId });
    if (!member?.inviteToken || member.userId || !wedding) {
      await emails.updateOne({ _id: row._id, leaseId }, { $unset: { leaseId: "", leaseUntil: "" } });
      return "skipped" as const;
    }
    const { RESEND_API_KEY, RESEND_FROM_ADDRESS, APP_URL } = process.env;
    if (!RESEND_API_KEY || (!row.sendContext && (!RESEND_FROM_ADDRESS || !APP_URL))) throw new Error("Email configuration missing");
    // Freeze inputs before contacting Resend. A later name or env edit
    // must not change the payload under an idempotency key already in use.
    const context = row.sendContext ?? {
      from: RESEND_FROM_ADDRESS!, appUrl: APP_URL!, name: member.name,
      relation: member.relation, role: member.role, brideName: wedding.brideName, groomName: wedding.groomName,
    };
    const origin = new URL(context.appUrl);
    if (!["https:", "http:"].includes(origin.protocol)) throw new Error("Invalid application URL");
    const url = new URL(`/join/${member.inviteToken}`, origin).toString();
    const text = `Hi ${context.name},\n\nYou're invited to help plan ${context.brideName} and ${context.groomName}'s wedding as ${context.relation} (${context.role}).\n\nUse ${row.recipientEmail} to log in or create an account, then accept your invitation:\n${url}\n\nMakeMyMarriage`;
    const body = JSON.stringify({ from: context.from, to: [row.recipientEmail],
      subject: "You're invited to plan a wedding · MakeMyMarriage", text,
      html: `<p>${escape(text).replace(/\n/g, "<br>")}</p><p><a href="${escape(url)}">View invitation</a></p>` });
    const prepared = await emails.updateOne({ _id: row._id, leaseId }, {
      $set: { sendContext: context, firstAttemptAt: row.firstAttemptAt ?? new Date() },
    });
    if (!prepared.matchedCount) return "pending" as const;
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": `family-invite/${row._id}` },
      body,
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) {
      // These responses confirm rejection. A 409/5xx or timeout can represent
      // an already accepted send, so preserve its context for an exact replay.
      definitelyRejected = [400, 401, 403, 422, 429].includes(response.status);
      throw new Error("Email provider rejected the request");
    }
    const result: unknown = await response.json();
    if (!result || typeof result !== "object" || !("id" in result) || typeof result.id !== "string" || !result.id) {
      throw new Error("Email provider did not confirm the send");
    }
    providerAccepted = true;
    const recorded = await emails.updateOne({ _id: row._id, leaseId }, { $set: { status: "sent", sentAt: new Date(), providerEmailId: result.id }, $unset: { error: "", leaseId: "", leaseUntil: "" } });
    if (!recorded.matchedCount) return "pending" as const;
    return "sent" as const;
  } catch {
    // Provider errors can contain credentials, request metadata, and recipient data.
    if (providerAccepted) return "pending" as const;
    try {
      const recorded = await emails.updateOne({ _id: row._id, leaseId }, {
        $set: { status: "failed", error: "The email couldn't be sent. Try again." },
        $unset: { leaseId: "", leaseUntil: "", ...(definitelyRejected && !row.firstAttemptAt ? { sendContext: "", firstAttemptAt: "" } : {}) },
      });
      return recorded.matchedCount ? "failed" as const : "pending" as const;
    } catch {
      // Keep the lease to expire normally if Atlas cannot record the outcome.
      return "pending" as const;
    }
  }
}

export async function retryFamilyEmails(user: UserDoc, weddingId: string) {
  const { db, id, member } = await familyAccess(user._id, weddingId);
  await assertAuthRate(`family-retry:${user._id}:${id}`);
  const allowedMembers = await db.collection<MemberDoc>("memberships").find({ weddingId: id, ...(member.role === "admin" ? {} : { role: "helper" as const }) }).toArray();
  const pendingMembers = allowedMembers.filter(row => !row.userId);
  const memberIds = pendingMembers.map(member => member._id);
  const rows = await db.collection<EmailDoc>("emailSends").find({ weddingId: id, kind: "helper_invite", membershipId: { $in: memberIds }, status: { $in: ["pending", "failed"] } }).sort({ _id: 1 }).limit(50).toArray();
  const skipped = await db.collection<EmailDoc>("emailSends").countDocuments({ weddingId: id, kind: "helper_invite", membershipId: { $in: allowedMembers.map(row => row._id) }, $or: [{ status: "sent" }, { membershipId: { $nin: memberIds } }] });
  const results: Awaited<ReturnType<typeof sendFamilyEmail>>[] = [];
  for (const row of rows) {
    // Pace this request's retries instead of bursting 50 calls at the provider.
    // Rate-limit responses from other concurrent requests remain retryable failures.
    if (results.length) await new Promise(resolve => setTimeout(resolve, 600));
    results.push(await sendFamilyEmail(row._id));
  }
  return { sent: results.filter(status => status === "sent").length, failed: results.filter(status => status === "failed").length, pending: results.filter(status => status === "pending").length,
    skipped: skipped + results.filter(status => status === "skipped").length,
    items: rows.map((row, index) => ({ membershipId: String(row.membershipId), recipient: row.recipientEmail, kind: row.kind, status: results[index] })) };
}
