import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, expect, test, vi } from "vitest";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { Collection, ObjectId } from "mongodb";
import { readyDb } from "@/lib/db";
import { createEvent, deleteEvent, getEvent, listEvents, updateEvent } from "@/lib/events";
import { createEventSchema, patchEventSchema, eventInputError } from "@/lib/event-input";
import { getWeddingDashboard } from "@/lib/weddings";
import type { UserDoc } from "@/lib/auth/session";
import { GET, POST } from "@/app/api/weddings/[weddingId]/events/route";
import { GET as read, PATCH, DELETE } from "@/app/api/weddings/[weddingId]/events/[eventId]/route";
const auth = vi.hoisted(() => ({ user: null as UserDoc | null }));
vi.mock("@/lib/auth/session", () => ({ getCurrentUser: async () => auth.user }));
let mongo: MongoMemoryReplSet;
let admin: UserDoc, helper: UserDoc, outsider: UserDoc, weddingId: ObjectId, ids: ObjectId[];
function user(email: string): UserDoc { return { _id: new ObjectId(), email, name: email, passwordHash: "test", createdAt: new Date(), updatedAt: new Date() }; }
beforeAll(async () => { mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } }); process.env.MONGODB_URI = mongo.getUri(); }, 60_000);
afterAll(async () => { await mongo?.stop(); });
beforeEach(async () => {
  const db = await readyDb();
  for (const name of ["weddings", "memberships", "events", "guests", "authAttempts", "tasks", "expenses"]) await db.collection(name).deleteMany({});
  admin = user("admin@example.test"); helper = user("helper@example.test"); outsider = user("other@example.test"); weddingId = new ObjectId(); auth.user = null;
  await db.collection("weddings").insertOne({ _id: weddingId, brideName: "Priya", groomName: "Rahul", startDate: "2027-03-12", endDate: "2027-03-14", publicSlug: "events-test" });
  await db.collection("memberships").insertMany([{ weddingId, userId: admin._id, role: "admin", relation: "bride", name: "Priya", email: admin.email }, { weddingId, userId: helper._id, role: "helper", relation: "mother", name: "Helper", email: helper.email }]);
  ids = Array.from({ length: 7 }, () => new ObjectId());
  await db.collection("events").insertMany(["Roka / engagement", "Haldi", "Mehendi", "Sangeet", "Wedding ceremony", "Reception", "Vidaai"].map((name, index) => ({ _id: ids[index], weddingId, name, order: index + 1 })));
});
test("event validation accepts optional fields and explicit clearing, refusing bad dates, times, and partial locations", () => {
  expect(createEventSchema.safeParse({ name: "Family lunch" }).success).toBe(true);
  expect(createEventSchema.safeParse({ name: "Event", date: "2028-02-29", time: "23:59", venueName: "Zero", latitude: 0, longitude: 0 }).success).toBe(true);
  expect(patchEventSchema.safeParse({ date: null, time: "", venueName: null, latitude: null, longitude: null }).success).toBe(true);
  for (const body of [null, [], {}, { name: "" }, { name: "Event", date: "2027-02-29" }, { name: "Event", time: "24:00" }, { name: "Event", venueName: "Hall" }, { name: "Event", venueName: "Hall", latitude: 91, longitude: 0 }, { name: "Event", venueName: "Hall", latitude: 0, longitude: -181 }, { name: "Event", latitude: "28" }, { name: "Event", youtubeUrl: "https://youtu.be/test" }]) expect(createEventSchema.safeParse(body).success).toBe(false);
  for (const body of [{}, { order: 0 }, { order: 1.5 }, { venueName: null }, { youtubeUrl: "x" }]) expect(patchEventSchema.safeParse(body).success).toBe(false);
});
test("saved family order is paged, and new events append without sorting dates", async () => {
  const a = await listEvents(helper._id, String(weddingId), 2, 3);
  expect(a.items.map(row => row.order)).toEqual([4, 5, 6]);
  expect(a.total).toBe(7);
  const added = await createEvent(helper, String(weddingId), { name: "Early event", date: "2026-01-01" });
  expect(added.order).toBe(8);
  expect((await listEvents(admin._id, String(weddingId))).items.at(-1)?.id).toBe(added.id);
  expect((await getWeddingDashboard(admin._id, String(weddingId)))?.startDate).toBe("2027-03-12");
});
test("helpers edit all event fields and clear them without changing order or wedding dates", async () => {
  const updated = await updateEvent(helper, String(weddingId), String(ids[2]), { name: "Henna", date: "2027-03-11", time: "16:00", venueName: "Hall", latitude: 28.6139, longitude: 77.209 });
  expect(updated).toMatchObject({ name: "Henna", order: 3, date: "2027-03-11", time: "16:00", latitude: 28.6139 });
  await updateEvent(helper, String(weddingId), String(ids[2]), { date: null, time: "", venueName: null, latitude: null, longitude: null });
  expect(await getEvent(admin._id, String(weddingId), String(ids[2]))).toMatchObject({ name: "Henna", order: 3, date: "", time: "", venueName: "", latitude: null, longitude: null });
  expect((await getWeddingDashboard(admin._id, String(weddingId)))?.events[2]).toMatchObject({ name: "Henna", date: "", time: "" });
});
test("a repeated concurrent add returns one event, and different payload reuse is explicit", async () => {
  const key = randomUUID();
  const results = await Promise.all(Array.from({ length: 5 }, () => createEvent(helper, String(weddingId), { name: "Lunch" }, key)));
  expect(new Set(results.map(row => row.id)).size).toBe(1);
  expect((await listEvents(admin._id, String(weddingId))).total).toBe(8);
  await expect(createEvent(helper, String(weddingId), { name: "Changed" }, key)).rejects.toMatchObject({ status: 409 });
});
test("simultaneous adds and reorder operations preserve a complete unique sequence", async () => {
  await Promise.all(Array.from({ length: 5 }, (_, index) => createEvent(helper, String(weddingId), { name: `Added ${index}` }, randomUUID())));
  await Promise.all([updateEvent(admin, String(weddingId), String(ids[6]), { order: 1 }), updateEvent(helper, String(weddingId), String(ids[0]), { order: 12 })]);
  const rows = (await listEvents(admin._id, String(weddingId))).items;
  expect(rows.map(row => row.order)).toEqual(Array.from({ length: 12 }, (_, index) => index + 1));
  expect(new Set(rows.map(row => row.id)).size).toBe(12);
});
test("reorder uses global positions across page boundaries and rejects out-of-range moves", async () => {
  await updateEvent(helper, String(weddingId), String(ids[2]), { order: 4 });
  expect((await listEvents(admin._id, String(weddingId), 2, 3)).items[0].id).toBe(String(ids[2]));
  await expect(updateEvent(helper, String(weddingId), String(ids[0]), { order: 8 })).rejects.toMatchObject({ status: 400 });
  expect((await listEvents(admin._id, String(weddingId))).items.map(row => row.order)).toEqual([1, 2, 3, 4, 5, 6, 7]);
});
test("delete cleans invitation selections and replies for this wedding only", async () => {
  const db = await readyDb(); const otherWedding = new ObjectId();
  await db.collection("guests").insertMany([
    { weddingId, name: "Guest", invitedEventIds: [ids[0], ids[2], String(ids[2])], rsvps: [{ eventId: ids[0], answer: "yes" }, { eventId: ids[2], answer: "yes" }, { eventId: String(ids[2]), answer: "no" }] },
    { weddingId: otherWedding, name: "Other", invitedEventIds: [ids[2]], rsvps: [{ eventId: ids[2], answer: "yes" }] },
  ]);
  await deleteEvent(helper, String(weddingId), String(ids[2]));
  const guest = await db.collection("guests").findOne({ weddingId });
  expect(guest?.invitedEventIds.map(String)).toEqual([String(ids[0])]);
  expect(guest?.rsvps).toHaveLength(1);
  expect(await db.collection("guests").countDocuments({})).toBe(2);
  expect((await db.collection("guests").findOne({ weddingId: otherWedding }))?.rsvps).toHaveLength(1);
  expect((await listEvents(admin._id, String(weddingId))).items.map(row => row.order)).toEqual([1, 2, 3, 4, 5, 6]);
});
test("failed guest cleanup rolls back deletion and the schedule", async () => {
  const original = Collection.prototype.updateMany;
  const mock = vi.spyOn(Collection.prototype, "updateMany").mockImplementation(function (this: Collection, ...args: Parameters<Collection["updateMany"]>) {
    if (this.collectionName === "guests") return Promise.reject(new Error("cleanup failed"));
    return original.apply(this, args);
  });
  try { await expect(deleteEvent(helper, String(weddingId), String(ids[0]))).rejects.toThrow("cleanup failed"); }
  finally { mock.mockRestore(); }
  expect((await listEvents(admin._id, String(weddingId))).items.map(row => row.id)).toEqual(ids.map(String));
});
test("all events can be deleted; a subsequent add starts at one", async () => {
  for (const id of ids) await deleteEvent(admin, String(weddingId), String(id));
  expect(await listEvents(helper._id, String(weddingId))).toMatchObject({ total: 0, items: [] });
  expect((await createEvent(helper, String(weddingId), { name: "New beginning" })).order).toBe(1);
});
test("nonmembers and cross-wedding ids are refused; deleted editors return 404", async () => {
  await expect(createEvent(outsider, String(weddingId), { name: "Bad" })).rejects.toMatchObject({ status: 404 });
  await expect(updateEvent(outsider, String(weddingId), String(ids[0]), { name: "Bad" })).rejects.toMatchObject({ status: 404 });
  await expect(deleteEvent(outsider, String(weddingId), String(ids[0]))).rejects.toMatchObject({ status: 404 });
  const foreign = new ObjectId(); await (await readyDb()).collection("events").insertOne({ _id: foreign, weddingId: new ObjectId(), name: "Foreign", order: 1 });
  await expect(getEvent(helper._id, String(weddingId), String(foreign))).rejects.toMatchObject({ status: 404 });
  await expect(updateEvent(helper, String(weddingId), String(foreign), { order: 1 })).rejects.toMatchObject({ status: 404 });
  await deleteEvent(helper, String(weddingId), String(ids[0]));
  await expect(getEvent(helper._id, String(weddingId), String(ids[0]))).rejects.toMatchObject({ status: 404 });
});
test("HTTP event routes enforce sessions, validate inputs, and allow helpers", async () => {
  const context = { params: Promise.resolve({ weddingId: String(weddingId) }) };
  const detail = { params: Promise.resolve({ weddingId: String(weddingId), eventId: String(ids[0]) }) };
  const request = (body: unknown, method = "POST") => new Request("http://localhost/api/events", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  expect((await POST(request({ name: "Lunch" }), context)).status).toBe(401);
  expect((await GET(new Request("http://localhost/api/events"), context)).status).toBe(401);
  expect((await DELETE(new Request("http://localhost/api/events", { method: "DELETE" }), detail)).status).toBe(401);
  auth.user = helper;
  for (const body of [{}, { name: null }, { name: [] }]) {
    const response = await POST(request(body), context);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Enter an event name." });
  }
  for (const order of [null, "first", 0, -1, 1.5]) {
    const response = await PATCH(request({ order }, "PATCH"), detail);
    expect(response.status).toBe(400);
    expect((await response.json()).error).not.toMatch(/Invalid input|expected|received/);
  }
  const badDate = createEventSchema.safeParse({ name: "Event", date: [] });
  expect(badDate.success).toBe(false);
  if (!badDate.success) expect(eventInputError(badDate.error)).toBe("Enter a valid date.");
  for (const body of [null, [], { name: "Event", venueName: "Partial" }]) expect((await POST(request(body), context)).status).toBe(400);
  expect((await PATCH(request({ youtubeUrl: "https://youtu.be/test" }, "PATCH"), detail)).status).toBe(400);
  expect((await GET(new Request("http://localhost/api/events?pageSize=51"), context)).status).toBe(400);
  expect((await read(new Request("http://localhost/api/events"), detail)).status).toBe(200);
  expect((await POST(request({ name: "Lunch" }), context)).status).toBe(201);
  expect((await PATCH(request({ name: "Updated" }, "PATCH"), detail)).status).toBe(200);
});
