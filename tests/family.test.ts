import { afterAll, beforeAll, beforeEach, expect, test, vi } from "vitest";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { Collection, ObjectId } from "mongodb";
import { readyDb } from "@/lib/db";
import { acceptInvite, familyAccess, inviteFamily, listFamily, readInvite, removeHelper, type EmailDoc, type MemberDoc } from "@/lib/family";
import { retryFamilyEmails, sendFamilyEmail } from "@/lib/family-email";
import { invitePath, authInvitePath } from "@/lib/invite-path";
import { inviteAuthContext } from "@/lib/invite-auth";
import { getWeddingDashboard, listWeddings } from "@/lib/weddings";
import type { UserDoc } from "@/lib/auth/session";
import { POST as inviteRoute } from "@/app/api/weddings/[weddingId]/invites/route";
import { GET as joinRoute } from "@/app/api/join/[token]/route";
import { POST as acceptRoute } from "@/app/api/join/[token]/accept/route";

const auth = vi.hoisted(() => ({ user: null as UserDoc | null }));
vi.mock("@/lib/auth/session", () => ({ getCurrentUser: async () => auth.user }));

const mail = vi.hoisted(() => ({ fail: false, send: vi.fn<typeof fetch>() }));

let mongo: MongoMemoryReplSet;
let admin: UserDoc;
let weddingId: ObjectId;
const helper = { name: "Meera", email: "meera@example.com", role: "helper", relation: "mother" };
function person(email: string): UserDoc {
  return { _id: new ObjectId(), name: email.split("@")[0], email, passwordHash: "test", createdAt: new Date(), updatedAt: new Date() };
}
async function storedToken(memberId: string) {
  return (await (await readyDb()).collection<MemberDoc>("memberships").findOne({ _id: new ObjectId(memberId) }))!.inviteToken!;
}
beforeAll(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  process.env.MONGODB_URI = mongo.getUri();
  process.env.APP_URL = "https://example.test";
  process.env.RESEND_API_KEY = "test-resend-key";
  process.env.RESEND_FROM_ADDRESS = "invite@example.test";
}, 60_000);
afterAll(async () => { vi.unstubAllGlobals(); await mongo?.stop(); });
beforeEach(async () => {
  const db = await readyDb();
  for (const name of ["users", "memberships", "weddings", "emailSends", "authAttempts"]) await db.collection(name).deleteMany({});
  admin = person("priya@example.com"); weddingId = new ObjectId();
  await db.collection("users").insertOne(admin);
  await db.collection("weddings").insertOne({ _id: weddingId, brideName: "Priya", groomName: "Rahul", startDate: "2027-03-12", endDate: "2027-03-14", publicSlug: "test-wedding" });
  await db.collection("memberships").insertOne({ weddingId, userId: admin._id, name: admin.name, email: admin.email, role: "admin", relation: "bride" });
  mail.fail = false;
  mail.send.mockReset().mockImplementation(async () => mail.fail
    ? Response.json({ message: "Provider details must stay private" }, { status: 422 })
    : Response.json({ id: "test-email-id" }));
  vi.stubGlobal("fetch", mail.send);
  auth.user = null;
});

test("invites normalize email, save one pending membership and email, and expose no tokens", async () => {
  const result = await inviteFamily(admin, String(weddingId), { ...helper, email: "  MEERA@Example.com  " });
  expect(result.member).toMatchObject({ email: helper.email, joined: false });
  expect(result.member).not.toHaveProperty("inviteToken");
  const family = await listFamily(admin._id, String(weddingId));
  expect(family.items).toHaveLength(2);
  expect(family.items[1]).toMatchObject({ joined: false, emailStatus: "pending" });
  expect((await getWeddingDashboard(admin._id, String(weddingId)))?.family).toBe(1);
  const read = await readInvite(await storedToken(result.member.id));
  expect(read).toMatchObject({ email: helper.email, joined: false, wedding: { brideName: "Priya", groomName: "Rahul" } });
  expect(Object.keys(read!).sort()).toEqual(["email", "joined", "name", "relation", "role", "wedding"]);
  expect(read).not.toHaveProperty("inviteToken");
});

test("self invites, invalid root bodies, role/relation tampering and duplicate emails are refused", async () => {
  await expect(inviteFamily(admin, String(weddingId), { ...helper, email: admin.email.toUpperCase() })).rejects.toMatchObject({ status: 409 });
  for (const body of [null, [], {}, { ...helper, role: "admin", relation: "bride" }, { ...helper, relation: "groom" }]) {
    await expect(inviteFamily(admin, String(weddingId), body)).rejects.toMatchObject({ status: 400 });
  }
  await inviteFamily(admin, String(weddingId), helper);
  await expect(inviteFamily(admin, String(weddingId), { ...helper, email: "MEERA@example.com" })).rejects.toMatchObject({ status: 409 });
});

test("concurrent requests cannot reserve two partner slots or reuse an email", async () => {
  const partners = await Promise.allSettled(["rahul1@example.com", "rahul2@example.com"].map(email => inviteFamily(admin, String(weddingId), { name: "Rahul", email, role: "admin", relation: "groom" })));
  expect(partners.filter(result => result.status === "fulfilled")).toHaveLength(1);
  const duplicates = await Promise.allSettled(Array.from({ length: 5 }, () => inviteFamily(admin, String(weddingId), helper)));
  expect(duplicates.filter(result => result.status === "fulfilled")).toHaveLength(1);
  const db = await readyDb();
  expect(await db.collection("memberships").countDocuments({ weddingId, role: "admin" })).toBe(2);
  expect(await db.collection("emailSends").countDocuments({ weddingId })).toBe(2);
});

test("a groom can only invite the bride; accepted partners cannot be recreated", async () => {
  const db = await readyDb();
  await db.collection("memberships").updateOne({ userId: admin._id }, { $set: { relation: "groom" } });
  await expect(inviteFamily(admin, String(weddingId), { ...helper, role: "admin", relation: "groom" })).rejects.toMatchObject({ status: 400 });
  const created = await inviteFamily(admin, String(weddingId), { ...helper, role: "admin", relation: "bride" });
  const recipient = person(helper.email);
  await acceptInvite(recipient, await storedToken(created.member.id));
  await expect(inviteFamily(admin, String(weddingId), { ...helper, email: "other@example.com", role: "admin", relation: "bride" })).rejects.toMatchObject({ status: 409 });
});

test("email failure keeps the invitation; concurrent retries send once and skip sent mail", async () => {
  const result = await inviteFamily(admin, String(weddingId), helper);
  mail.fail = true;
  expect(await sendFamilyEmail(result.emailId)).toBe("failed");
  const db = await readyDb();
  expect(await db.collection("memberships").countDocuments({ weddingId })).toBe(2);
  expect((await db.collection<EmailDoc>("emailSends").findOne({ _id: result.emailId }))?.error).not.toContain("Provider");
  mail.fail = false;
  await Promise.all([retryFamilyEmails(admin, String(weddingId)), retryFamilyEmails(admin, String(weddingId))]);
  expect(mail.send).toHaveBeenCalledTimes(2); // One failed original, one successful retry.
  const [url, options] = mail.send.mock.calls[1];
  expect(url).toBe("https://api.resend.com/emails");
  expect(options?.headers).toMatchObject({ Authorization: "Bearer test-resend-key", "Content-Type": "application/json" });
  const body = JSON.parse(String(options?.body));
  expect(body.from).toBe("invite@example.test");
  expect(body.to).toEqual([helper.email]);
  expect(body.text).toContain(`/join/${await storedToken(result.member.id)}`);
  await retryFamilyEmails(admin, String(weddingId));
  expect(mail.send).toHaveBeenCalledTimes(2);
  expect(await db.collection("emailSends").countDocuments({ weddingId })).toBe(1);
});

test("missing Resend configuration reports failed instead of a fictional successful send", async () => {
  const result = await inviteFamily(admin, String(weddingId), helper);
  const previous = process.env.RESEND_FROM_ADDRESS;
  delete process.env.RESEND_FROM_ADDRESS;
  try { expect(await sendFamilyEmail(result.emailId)).toBe("failed"); expect(mail.send).not.toHaveBeenCalled(); }
  finally { process.env.RESEND_FROM_ADDRESS = previous; }
});

test("Resend authentication, quota, malformed success and network failures remain retryable", async () => {
  for (const response of [Response.json({ message: "secret details" }, { status: 401 }), Response.json({ message: "quota" }, { status: 429 }), Response.json({})]) {
    const result = await inviteFamily(admin, String(weddingId), { ...helper, email: `person${new ObjectId()}@example.com` });
    mail.send.mockResolvedValueOnce(response);
    expect(await sendFamilyEmail(result.emailId)).toBe("failed");
    expect((await (await readyDb()).collection<EmailDoc>("emailSends").findOne({ _id: result.emailId }))?.error).toBe("The email couldn't be sent. Try again.");
  }
  const result = await inviteFamily(admin, String(weddingId), helper);
  mail.send.mockRejectedValueOnce(new DOMException("Timed out", "TimeoutError"));
  expect(await sendFamilyEmail(result.emailId)).toBe("failed");
  expect(await sendFamilyEmail(result.emailId)).toBe("sent");
});

test("a failed email-row write rolls back the membership", async () => {
  const insert = Collection.prototype.insertOne;
  const mock = vi.spyOn(Collection.prototype, "insertOne").mockImplementation(function (this: Collection, ...args: Parameters<Collection["insertOne"]>) {
    if (this.collectionName === "emailSends") return Promise.reject(new Error("test email write failed"));
    return insert.apply(this, args);
  });
  try { await expect(inviteFamily(admin, String(weddingId), helper)).rejects.toThrow("test email write failed"); }
  finally { mock.mockRestore(); }
  expect(await (await readyDb()).collection("memberships").countDocuments({ weddingId })).toBe(1);
});

test("acceptance requires the invited account, is idempotent, and adds the existing wedding to home", async () => {
  const result = await inviteFamily(admin, String(weddingId), helper);
  const token = await storedToken(result.member.id);
  const wrong = person("wrong@example.com"), recipient = person(helper.email);
  await expect(acceptInvite(wrong, token)).rejects.toMatchObject({ status: 403 });
  expect((await listWeddings(recipient._id, 1, 20)).items).toHaveLength(0);
  const accepts = await Promise.all([acceptInvite(recipient, token), acceptInvite(recipient, token)]);
  expect(accepts[0]).toMatchObject({ weddingId: String(weddingId), joined: true, role: "helper", relation: "mother" });
  expect(accepts[1]).toEqual(accepts[0]);
  expect((await listWeddings(recipient._id, 1, 20)).items).toHaveLength(1);
  expect((await getWeddingDashboard(admin._id, String(weddingId)))?.family).toBe(2);
  expect(await readInvite(token, wrong)).toBeNull();
  expect(await readInvite(token, recipient)).toMatchObject({ joined: true });
});

test("helpers can invite and retry helpers but cannot invite partners or remove family", async () => {
  const result = await inviteFamily(admin, String(weddingId), helper);
  const token = await storedToken(result.member.id);
  const recipient = person(helper.email);
  await (await readyDb()).collection("users").insertOne(recipient);
  await acceptInvite(recipient, token);
  const family = await listFamily(recipient._id, String(weddingId));
  expect(family.items).toHaveLength(2);
  expect(family.items[1]).toHaveProperty("emailStatus", "pending");
  const other = await inviteFamily(recipient, String(weddingId), { ...helper, email: "other@example.com" });
  expect(other.member).toMatchObject({ role: "helper", joined: false });
  await expect(inviteFamily(recipient, String(weddingId), { ...helper, email: "partner@example.com", role: "admin", relation: "groom" })).rejects.toMatchObject({ status: 403 });
  const partner = await inviteFamily(admin, String(weddingId), { name: "Rahul", email: "partner@example.com", role: "admin", relation: "groom" });
  const retry = await retryFamilyEmails(recipient, String(weddingId));
  expect(retry.sent).toBe(1);
  expect(retry.items.map(item => item.membershipId)).toEqual([other.member.id]);
  expect((await (await readyDb()).collection<EmailDoc>("emailSends").findOne({ _id: partner.emailId }))?.status).toBe("pending");
  expect((await listFamily(recipient._id, String(weddingId))).items.find(item => item.id === partner.member.id)).not.toHaveProperty("emailStatus");
  await expect(removeHelper(recipient, String(weddingId), result.member.id)).rejects.toMatchObject({ status: 403 });
  await removeHelper(admin, String(weddingId), result.member.id);
  expect(await readInvite(token)).toBeNull();
  expect(await (await readyDb()).collection("users").findOne({ _id: recipient._id })).not.toBeNull();
  await expect(familyAccess(recipient._id, String(weddingId))).rejects.toMatchObject({ status: 404 });
  const pending = await inviteFamily(admin, String(weddingId), helper);
  const pendingToken = await storedToken(pending.member.id);
  await removeHelper(admin, String(weddingId), pending.member.id);
  await expect(acceptInvite(recipient, pendingToken)).rejects.toMatchObject({ status: 404 });
});

test.each(["mother", "father", "brother", "sister", "other"])("a joined %s can invite another helper; pending and unrelated accounts cannot", async relation => {
  const created = await inviteFamily(admin, String(weddingId), { ...helper, relation });
  const recipient = person(helper.email);
  const body = { ...helper, email: "next@example.com", relation: "sister" };
  await expect(inviteFamily(recipient, String(weddingId), body)).rejects.toMatchObject({ status: 404 });
  await acceptInvite(recipient, await storedToken(created.member.id));
  const invited = await inviteFamily(recipient, String(weddingId), body);
  expect(invited.member).toMatchObject({ role: "helper", relation: "sister", email: "next@example.com" });
  const next = person("next@example.com");
  await acceptInvite(next, await storedToken(invited.member.id));
  expect((await inviteFamily(next, String(weddingId), { ...body, email: "third@example.com" })).member.role).toBe("helper");
  await expect(inviteFamily(recipient, String(weddingId), { ...body, email: "bad@example.com", relation: "bride" })).rejects.toMatchObject({ status: 400 });
  await expect(inviteFamily(person("outsider@example.com"), String(weddingId), body)).rejects.toMatchObject({ status: 404 });
});

test("helper invitation HTTP route rejects role escalation without creating membership or email", async () => {
  const created = await inviteFamily(admin, String(weddingId), helper);
  const recipient = person(helper.email);
  await acceptInvite(recipient, await storedToken(created.member.id));
  auth.user = recipient;
  const context = { params: Promise.resolve({ weddingId: String(weddingId) }) };
  const request = (role: string, relation: string) => new Request("http://localhost/api/weddings/test/invites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "Other", email: "other@example.com", role, relation }) });
  const rejected = await inviteRoute(request("admin", "groom"), context);
  expect(rejected.status).toBe(403);
  expect(await rejected.json()).toEqual({ error: "Only admins can invite a partner." });
  const db = await readyDb();
  expect(await db.collection("memberships").countDocuments({ weddingId })).toBe(2);
  expect(await db.collection("emailSends").countDocuments({ weddingId })).toBe(1);
  const accepted = await inviteRoute(request("helper", "father"), context);
  expect(accepted.status).toBe(201);
  expect((await accepted.json()).member.role).toBe("helper");
});

test("admin removal and cross-wedding access are refused; missing wedding invalidates join", async () => {
  const result = await inviteFamily(admin, String(weddingId), helper);
  const db = await readyDb();
  const creator = await db.collection<MemberDoc>("memberships").findOne({ userId: admin._id });
  await expect(removeHelper(admin, String(weddingId), String(creator!._id))).rejects.toMatchObject({ status: 403 });
  await expect(listFamily(person("other@example.com")._id, String(weddingId))).rejects.toMatchObject({ status: 404 });
  const token = await storedToken(result.member.id);
  await db.collection("weddings").deleteOne({ _id: weddingId });
  expect(await readInvite(token)).toBeNull();
  await expect(acceptInvite(person(helper.email), token)).rejects.toMatchObject({ status: 404 });
});

test("invite attempts are limited atomically under concurrent load", async () => {
  const results = await Promise.allSettled(Array.from({ length: 20 }, (_, index) => inviteFamily(admin, String(weddingId), { ...helper, email: `person${index}@example.com` })));
  expect(results.filter(result => result.status === "fulfilled")).toHaveLength(10);
  expect(await (await readyDb()).collection("emailSends").countDocuments({ weddingId })).toBe(10);
});

test("auth preserves invitation intent with trusted email prefill and refuses external destinations", async () => {
  const result = await inviteFamily(admin, String(weddingId), helper);
  const token = await storedToken(result.member.id);
  expect(await inviteAuthContext(token)).toEqual({ invite: token, invitedEmail: helper.email });
  expect(authInvitePath("/login", token)).toBe(`/login?invite=${token}`);
  expect(invitePath(token)).toBe(`/join/${token}`);
  for (const input of ["https://evil.test", "//evil.test", "../home", "/join/test", [token]]) expect(invitePath(input)).toBe("/home");
});

test("HTTP routes enforce sign-in, return friendly validation, and distinguish saved email failure", async () => {
  const context = { params: Promise.resolve({ weddingId: String(weddingId) }) };
  const request = (body: unknown) => new Request("http://localhost/api/weddings/test/invites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  expect((await inviteRoute(request(helper), context)).status).toBe(401);
  auth.user = admin;
  for (const body of [null, []]) {
    const response = await inviteRoute(request(body), context);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Check the name, email, and relation." });
  }
  mail.fail = true;
  const response = await inviteRoute(request(helper), context);
  expect(response.status).toBe(201);
  const created = await response.json();
  expect(created.email).toEqual({ status: "failed", error: "The email couldn't be sent. Try again." });
  expect(created.member.joined).toBe(false);
  const token = await storedToken(created.member.id);
  const tokenContext = { params: Promise.resolve({ token }) };
  auth.user = null;
  const publicResponse = await joinRoute(new Request("http://localhost/api/join/test"), tokenContext);
  expect(publicResponse.status).toBe(200);
  const publicBody = await publicResponse.json();
  expect(publicBody).not.toHaveProperty("inviteToken");
  expect(publicBody).not.toHaveProperty("members");
  expect(publicBody).not.toHaveProperty("events");
  expect((await acceptRoute(new Request("http://localhost/api/join/test/accept", { method: "POST" }), tokenContext)).status).toBe(401);
});

test("retry skips accepted invitations even if their original email failed", async () => {
  const created = await inviteFamily(admin, String(weddingId), helper);
  mail.fail = true;
  await sendFamilyEmail(created.emailId);
  await acceptInvite(person(helper.email), await storedToken(created.member.id));
  mail.send.mockClear(); mail.fail = false;
  const retry = await retryFamilyEmails(admin, String(weddingId));
  expect(retry.skipped).toBe(1);
  expect(mail.send).not.toHaveBeenCalled();
});

test("family pagination caps page sizes and normalizes invalid page values", async () => {
  await inviteFamily(admin, String(weddingId), helper);
  expect(await listFamily(admin._id, String(weddingId), Infinity, 100)).toMatchObject({ page: 1, pageSize: 50, total: 2 });
  const second = await listFamily(admin._id, String(weddingId), 2, 1);
  expect(second.items[0].email).toBe(helper.email);
});

test("an accepted-but-timed-out send replays the same provider key and payload after names and config change", async () => {
  const created = await inviteFamily(admin, String(weddingId), helper);
  const accepted = new Map<string, string>();
  let deliveries = 0;
  mail.send.mockImplementation(async (_url, options) => {
    const key = new Headers(options?.headers).get("Idempotency-Key");
    expect(key).toBe(`family-invite/${created.emailId}`);
    const body = String(options?.body);
    if (accepted.has(key!)) {
      expect(body).toBe(accepted.get(key!));
      return Response.json({ id: "accepted-once" });
    }
    accepted.set(key!, body); deliveries += 1;
    throw new DOMException("Response timed out after acceptance", "TimeoutError");
  });
  expect(await sendFamilyEmail(created.emailId)).toBe("failed");
  const db = await readyDb();
  await db.collection("weddings").updateOne({ _id: weddingId }, { $set: { brideName: "Corrected name" } });
  const previousFrom = process.env.RESEND_FROM_ADDRESS, previousUrl = process.env.APP_URL;
  process.env.RESEND_FROM_ADDRESS = "changed@example.test"; process.env.APP_URL = "https://changed.example.test";
  try { expect(await sendFamilyEmail(created.emailId)).toBe("sent"); }
  finally { process.env.RESEND_FROM_ADDRESS = previousFrom; process.env.APP_URL = previousUrl; }
  expect(deliveries).toBe(1);
  expect(mail.send).toHaveBeenCalledTimes(2);
  expect((await db.collection<EmailDoc>("emailSends").findOne({ _id: created.emailId }))?.providerEmailId).toBe("accepted-once");
});

test("a failed sent-status write stays pending and retries the same accepted email after lease expiry", async () => {
  const created = await inviteFamily(admin, String(weddingId), helper);
  const providerKeys = new Set<string>();
  mail.send.mockImplementation(async (_url, options) => {
    providerKeys.add(new Headers(options?.headers).get("Idempotency-Key")!);
    return Response.json({ id: "accepted-before-db-error" });
  });
  const original = Collection.prototype.updateOne;
  const mock = vi.spyOn(Collection.prototype, "updateOne").mockImplementation(function (this: Collection, ...args: Parameters<Collection["updateOne"]>) {
    if (this.collectionName === "emailSends" && !Array.isArray(args[1]) && args[1].$set?.status === "sent") return Promise.reject(new Error("Atlas status write failed"));
    return original.apply(this, args);
  });
  try { expect(await sendFamilyEmail(created.emailId)).toBe("pending"); }
  finally { mock.mockRestore(); }
  const db = await readyDb();
  const row = await db.collection<EmailDoc>("emailSends").findOne({ _id: created.emailId });
  expect(row).toMatchObject({ status: "pending" });
  expect(row?.leaseUntil).toBeInstanceOf(Date);
  await db.collection("emailSends").updateOne({ _id: created.emailId }, { $set: { leaseUntil: new Date(0) } });
  expect(await sendFamilyEmail(created.emailId)).toBe("sent");
  expect([...providerKeys]).toEqual([`family-invite/${created.emailId}`]);
});

test.each(["claim", "failure status", "sent status", "send context"])("a saved invitation returns 201 when the email %s operation fails", async failure => {
  auth.user = admin;
  const originalClaim = Collection.prototype.findOneAndUpdate;
  const originalUpdate = Collection.prototype.updateOne;
  const claim = vi.spyOn(Collection.prototype, "findOneAndUpdate").mockImplementation(function (this: Collection, ...args: Parameters<Collection["findOneAndUpdate"]>) {
    if (this.collectionName === "emailSends" && failure === "claim") return Promise.reject(new Error("Claim unavailable"));
    return originalClaim.apply(this, args);
  });
  const update = vi.spyOn(Collection.prototype, "updateOne").mockImplementation(function (this: Collection, ...args: Parameters<Collection["updateOne"]>) {
    const fields = Array.isArray(args[1]) ? undefined : args[1].$set;
    if (this.collectionName === "emailSends" && (
      (failure === "failure status" && fields?.status === "failed") ||
      (failure === "sent status" && fields?.status === "sent") ||
      (failure === "send context" && fields?.sendContext)
    )) return Promise.reject(new Error("Email update unavailable"));
    return originalUpdate.apply(this, args);
  });
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  mail.fail = failure === "failure status";
  let response: Response;
  try {
    response = await inviteRoute(new Request("http://localhost/api/weddings/test/invites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(helper) }), { params: Promise.resolve({ weddingId: String(weddingId) }) });
  } finally { claim.mockRestore(); update.mockRestore(); log.mockRestore(); }
  expect(response.status).toBe(201);
  const body = await response.json();
  expect(body.member).toMatchObject({ email: helper.email, joined: false });
  expect(body.email.status).toBe(failure === "send context" ? "failed" : "pending");
  expect(body).not.toHaveProperty("error");
  expect(body.member).not.toHaveProperty("sendContext");
  const db = await readyDb();
  expect(await db.collection("memberships").countDocuments({ weddingId })).toBe(2);
  expect(await db.collection("emailSends").countDocuments({ weddingId })).toBe(1);
  if (failure === "claim" || failure === "send context") expect(mail.send).not.toHaveBeenCalled();
});

test("definite initial rejection permits correcting the sender, but separate emails use separate keys", async () => {
  const created = await inviteFamily(admin, String(weddingId), helper);
  mail.fail = true;
  expect(await sendFamilyEmail(created.emailId)).toBe("failed");
  expect((await (await readyDb()).collection<EmailDoc>("emailSends").findOne({ _id: created.emailId }))?.sendContext).toBeUndefined();
  mail.fail = false;
  const previous = process.env.RESEND_FROM_ADDRESS;
  process.env.RESEND_FROM_ADDRESS = "verified@example.test";
  try { expect(await sendFamilyEmail(created.emailId)).toBe("sent"); }
  finally { process.env.RESEND_FROM_ADDRESS = previous; }
  expect(JSON.parse(String(mail.send.mock.calls[1][1]?.body)).from).toBe("verified@example.test");
  const another = await inviteFamily(admin, String(weddingId), { ...helper, email: "another@example.com" });
  await sendFamilyEmail(another.emailId);
  const keys = mail.send.mock.calls.map(([, options]) => new Headers(options?.headers).get("Idempotency-Key"));
  expect(keys).toEqual([`family-invite/${created.emailId}`, `family-invite/${created.emailId}`, `family-invite/${another.emailId}`]);
});
