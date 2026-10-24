import { afterAll, beforeAll, expect, test, vi } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Collection, ObjectId } from "mongodb";

const cookieJar = vi.hoisted(() => ({
  values: new Map<string, string>(),
  failSet: false,
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get(name: string) {
      const value = cookieJar.values.get(name);
      return value === undefined ? undefined : { name, value };
    },
    set(name: string, value: string) {
      if (cookieJar.failSet) {
        throw new Error("cookie failed");
      }
      if (!value) {
        cookieJar.values.delete(name);
      } else {
        cookieJar.values.set(name, value);
      }
    },
  }),
}));

import { assertAuthRate } from "@/lib/auth/rate";
import { endSession, getOptionalUser, startSession } from "@/lib/auth/session";
import { createUser, findUserByPassword, signUp } from "@/lib/auth/users";
import { readyDb } from "@/lib/db";
import { DuplicateEmailError, ForbiddenError, RateLimitError } from "@/lib/errors";
import { updateCouple, updateInvitation } from "@/lib/wedding-update";
import {
  createWedding,
  formatRupees,
  formatWeddingDates,
  getWeddingDashboard,
  nextEvent,
  getWeddingForUser,
  listWeddings,
} from "@/lib/weddings";

let mongo: MongoMemoryServer;
let uri = "";

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  uri = mongo.getUri();
  process.env.MONGODB_URI = uri;
  process.env.AUTH_SECRET = "test-secret-with-enough-length";
});

afterAll(async () => {
  await mongo.stop();
});

test("a wrong password does not sign in", async () => {
  await createUser({
    name: "Priya",
    email: "priya@example.com",
    password: "password123",
  });
  const db = await readyDb();
  const stored = await db.collection("users").findOne({ email: "priya@example.com" });
  expect(stored?.createdAt).toBeInstanceOf(Date);
  expect(stored?.updatedAt).toEqual(stored?.createdAt);
  expect(
    await findUserByPassword("priya@example.com", "password124"),
  ).toBeNull();
  expect(
    await findUserByPassword("priya@example.com", "password123"),
  ).toMatchObject({ email: "priya@example.com" });
});

test("the same email cannot be registered twice", async () => {
  await createUser({
    name: "Rahul",
    email: "rahul@example.com",
    password: "password123",
  });
  await expect(
    createUser({
      name: "Other",
      email: "Rahul@Example.com",
      password: "password123",
    }),
  ).rejects.toBeInstanceOf(DuplicateEmailError);
  const db = await readyDb();
  const emailIndex = (await db.collection("users").indexes()).find(
    (index) => index.name === "email_1",
  );
  expect(emailIndex?.unique).toBe(true);
  expect(
    await findUserByPassword("RAHUL@example.com", "password123"),
  ).toMatchObject({ email: "rahul@example.com", name: "Rahul" });
});

test("a failed session rolls the new account back", async () => {
  cookieJar.failSet = true;
  await expect(
    signUp({
      name: "Asha",
      email: "asha@example.com",
      password: "password123",
    }),
  ).rejects.toThrow("cookie failed");
  cookieJar.failSet = false;
  const db = await readyDb();
  expect(await db.collection("users").findOne({ email: "asha@example.com" })).toBeNull();
  expect(await db.collection("sessions").countDocuments()).toBe(0);
});

test("logout deletes the session and clears the cookie", async () => {
  const user = await createUser({
    name: "Meera",
    email: "meera@example.com",
    password: "password123",
  });
  await startSession(user._id);
  const db = await readyDb();
  expect(await db.collection("sessions").countDocuments({ userId: user._id })).toBe(1);
  expect(cookieJar.values.get("session")).toBeTruthy();
  expect(await endSession()).toBe(true);
  expect(await db.collection("sessions").countDocuments({ userId: user._id })).toBe(0);
  expect(cookieJar.values.has("session")).toBe(false);
});

test("logout still clears the cookie when the database is down", async () => {
  const user = await createUser({
    name: "Dev",
    email: "dev@example.com",
    password: "password123",
  });
  await startSession(user._id);
  process.env.MONGODB_URI = "mongodb://127.0.0.1:1/?serverSelectionTimeoutMS=500";
  await expect(endSession()).rejects.toThrow();
  expect(cookieJar.values.has("session")).toBe(false);
  process.env.MONGODB_URI = uri;
});

test("a stored session does not crash the page when the database is down", async () => {
  const user = await createUser({
    name: "Neel",
    email: "neel@example.com",
    password: "password123",
  });
  await startSession(user._id);
  process.env.MONGODB_URI = "mongodb://127.0.0.1:1/?serverSelectionTimeoutMS=500";
  expect(await getOptionalUser()).toBeNull();
  process.env.MONGODB_URI = uri;
  cookieJar.values.clear();
});

test("login and signup attempts are limited", async () => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    await assertAuthRate("login:test-limit");
  }
  await expect(assertAuthRate("login:test-limit")).rejects.toBeInstanceOf(
    RateLimitError,
  );
});

test("wedding pages stay in a stable order", async () => {
  const userId = new ObjectId();
  const db = await readyDb();
  const ids = [new ObjectId(), new ObjectId(), new ObjectId()];
  const names = ["A", "B", "C"];
  const weddingIds: ObjectId[] = [];
  for (const name of names) {
    const wedding = await db.collection("weddings").insertOne({
      brideName: name,
      groomName: "G",
      startDate: "2027-03-12",
      endDate: "2027-03-14",
      publicSlug: `slug-${name}`,
    });
    weddingIds.push(wedding.insertedId);
  }
  const memberships = db.collection("memberships");
  await memberships.insertOne({
    _id: ids[2],
    userId,
    weddingId: weddingIds[2],
    role: "admin",
    relation: "bride",
  });
  await memberships.insertOne({
    _id: ids[0],
    userId,
    weddingId: weddingIds[0],
    role: "admin",
    relation: "bride",
  });
  await memberships.insertOne({
    _id: ids[1],
    userId,
    weddingId: weddingIds[1],
    role: "admin",
    relation: "bride",
  });
  const first = await listWeddings(userId, 1, 2);
  const again = await listWeddings(userId, 1, 2);
  expect(first.items.map((item) => item.brideName)).toEqual(["A", "B"]);
  expect(again.items.map((item) => item.brideName)).toEqual(["A", "B"]);
  const second = await listWeddings(userId, 2, 2);
  expect(second.items.map((item) => item.brideName)).toEqual(["C"]);
});

test("starting a wedding writes the couple, the admin, and seven events", async () => {
  const user = await createUser({
    name: "Priya Shah",
    email: "priya.setup@example.com",
    password: "password123",
  });
  const created = await createWedding(user, {
    brideName: "Priya",
    groomName: "Rahul",
    startDate: "2027-03-12",
    endDate: "2027-03-14",
    relation: "bride",
    idempotencyKey: "11111111-1111-4111-8111-111111111111",
  });
  expect(created.publicSlug).not.toMatch(/priya|rahul/i);
  expect(created.events.map((event) => event.name)).toEqual([
    "Roka / engagement",
    "Haldi",
    "Mehendi",
    "Sangeet",
    "Wedding ceremony",
    "Reception",
    "Vidaai",
  ]);
  expect(created.events.map((event) => event.order)).toEqual([
    1, 2, 3, 4, 5, 6, 7,
  ]);
  const db = await readyDb();
  const membership = await db.collection("memberships").findOne({
    weddingId: new ObjectId(created.id),
  });
  expect(membership).toMatchObject({
    role: "admin",
    relation: "bride",
    name: "Priya Shah",
    email: "priya.setup@example.com",
    userId: user._id,
  });
  expect(membership).not.toHaveProperty("inviteToken");
  const listed = await listWeddings(user._id, 1, 20);
  expect(listed.items[0]).toMatchObject({
    brideName: "Priya",
    groomName: "Rahul",
    startDate: "2027-03-12",
    endDate: "2027-03-14",
  });
  expect(await getWeddingForUser(user._id, created.id)).toMatchObject({
    brideName: "Priya",
  });
  expect(await getWeddingForUser(new ObjectId(), created.id)).toBeNull();
  expect(formatWeddingDates("2027-03-12", "2027-03-14")).toBe(
    "12–14 March 2027",
  );
  expect(formatWeddingDates("2027-03-12", "2027-03-12")).toBe("12 March 2027");
});

test("the same save returns the same wedding", async () => {
  const user = await createUser({
    name: "Anika Shah",
    email: "anika.save@example.com",
    password: "password123",
  });
  const input = {
    brideName: "Anika",
    groomName: "Rahul",
    startDate: "2027-03-12",
    endDate: "2027-03-14",
    relation: "bride" as const,
    idempotencyKey: "33333333-3333-4333-8333-333333333333",
  };
  const [first, second] = await Promise.all([
    createWedding(user, input),
    createWedding(user, input),
  ]);
  expect(second.id).toBe(first.id);
  const db = await readyDb();
  expect(
    await db.collection("weddings").countDocuments({ brideName: "Anika" }),
  ).toBe(1);
  expect((await createWedding(user, input)).id).toBe(first.id);
});

test("creating weddings stops after ten attempts", async () => {
  const user = await createUser({
    name: "Meera Shah",
    email: "meera.limit@example.com",
    password: "password123",
  });
  await startSession(user._id);
  const { POST } = await import("@/app/api/weddings/route");
  for (let index = 0; index < 10; index += 1) {
    const response = await POST(weddingRequest(`Meera ${index}`));
    expect(response.status).toBe(200);
  }
  const blocked = await POST(weddingRequest("Meera again"));
  expect(blocked.status).toBe(429);
});

test("a failed follow-up still removes the wedding", async () => {
  const user = await createUser({
    name: "Leela Shah",
    email: "leela.cleanup@example.com",
    password: "password123",
  });
  const proto = Collection.prototype as unknown as {
    insertOne: (this: Collection, ...args: never[]) => Promise<unknown>;
    deleteMany: (this: Collection, ...args: never[]) => Promise<unknown>;
  };
  const insertOne = proto.insertOne;
  const deleteMany = proto.deleteMany;
  proto.insertOne = async function (this: Collection, ...args) {
    if (this.collectionName === "memberships") {
      throw new Error("membership failed");
    }
    return insertOne.apply(this, args);
  };
  proto.deleteMany = async function (this: Collection, ...args) {
    if (this.collectionName === "events") {
      throw new Error("delete failed");
    }
    return deleteMany.apply(this, args);
  };
  const reported: unknown[] = [];
  const errorLog = console.error;
  console.error = (value: unknown) => {
    reported.push(value);
  };
  try {
    await expect(
      createWedding(user, {
        brideName: "Leftover",
        groomName: "Rahul",
        startDate: "2027-03-12",
        endDate: "2027-03-14",
        relation: "bride",
        idempotencyKey: "44444444-4444-4444-8444-444444444444",
      }),
    ).rejects.toThrow("membership failed");
  } finally {
    proto.insertOne = insertOne;
    proto.deleteMany = deleteMany;
    console.error = errorLog;
  }
  const db = await readyDb();
  expect(
    await db.collection("weddings").countDocuments({ brideName: "Leftover" }),
  ).toBe(0);
  expect(
    await db.collection("weddingCreates").countDocuments({ userId: user._id }),
  ).toBe(0);
  expect(
    reported.some(
      (error) => error instanceof Error && error.message === "delete failed",
    ),
  ).toBe(true);
});

test("the dashboard shows this wedding and an empty plan", async () => {
  const user = await createUser({
    name: "Priya Shah",
    email: "priya.dash@example.com",
    password: "password123",
  });
  const created = await createWedding(user, {
    brideName: "Priya",
    groomName: "Rahul",
    startDate: "2027-03-12",
    endDate: "2027-03-14",
    relation: "bride",
    idempotencyKey: "55555555-5555-4555-8555-555555555555",
  });
  const dashboard = await getWeddingDashboard(user._id, created.id);
  expect(dashboard).toMatchObject({
    brideName: "Priya",
    role: "admin",
    guests: 0,
    openTasks: 0,
    tasks: [],
    budget: 0,
    spent: 0,
    stillDue: 0,
    family: 1,
  });
  expect(dashboard?.events.map((event) => event.name)).toEqual([
    "Roka / engagement",
    "Haldi",
    "Mehendi",
    "Sangeet",
    "Wedding ceremony",
    "Reception",
    "Vidaai",
  ]);
  expect(dashboard?.events.every((event) => event.date === "")).toBe(true);
  expect(await getWeddingDashboard(new ObjectId(), created.id)).toBeNull();
  expect(formatRupees(450000)).toBe("₹4,50,000");
  expect(formatRupees(0)).toBe("₹0");
});

test("an admin can correct the couple and the invitation", async () => {
  const user = await createUser({
    name: "Priya Shah",
    email: "priya.dates@example.com",
    password: "password123",
  });
  const helper = await createUser({
    name: "Meera Shah",
    email: "meera.helper@example.com",
    password: "password123",
  });
  const created = await createWedding(user, {
    brideName: "Anika",
    groomName: "Rohan",
    startDate: "2027-03-12",
    endDate: "2027-03-14",
    relation: "bride",
    idempotencyKey: "66666666-6666-4666-8666-666666666666",
  });
  const db = await readyDb();
  await db.collection("memberships").insertOne({
    weddingId: new ObjectId(created.id),
    userId: helper._id,
    role: "helper",
    relation: "sister",
    name: "Meera Shah",
    email: "meera.helper@example.com",
  });
  const couple = {
    brideName: "Priya",
    groomName: "Rahul",
    startDate: "2027-04-01",
    endDate: "2027-04-03",
  };
  await expect(updateCouple(helper, created.id, couple)).rejects.toBeInstanceOf(
    ForbiddenError,
  );
  await updateCouple(user, created.id, couple);
  const listed = await listWeddings(user._id, 1, 20);
  expect(listed.items[0]).toMatchObject(couple);
  await expect(
    updateInvitation(helper, created.id, { invitationMessage: "Join us." }),
  ).rejects.toBeInstanceOf(ForbiddenError);
  await updateInvitation(user, created.id, { invitationMessage: "Join us." });
  expect(await getWeddingDashboard(helper._id, created.id)).toMatchObject({
    role: "helper",
    family: 2,
    ...couple,
    invitationMessage: "Join us.",
  });
  await updateCouple(user, created.id, {
    ...couple,
    invitationMessage: "Come celebrate.",
  });
  expect(await getWeddingDashboard(user._id, created.id)).toMatchObject({
    ...couple,
    invitationMessage: "Come celebrate.",
  });
});

test("a save fails when the wedding record is gone", async () => {
  const user = await createUser({
    name: "Priya Shah",
    email: "priya.missing@example.com",
    password: "password123",
  });
  const created = await createWedding(user, {
    brideName: "Anika",
    groomName: "Rohan",
    startDate: "2027-03-12",
    endDate: "2027-03-14",
    relation: "bride",
    idempotencyKey: "77777777-7777-4777-8777-777777777777",
  });
  const db = await readyDb();
  await db.collection("weddings").deleteOne({ _id: new ObjectId(created.id) });
  const couple = {
    brideName: "Priya",
    groomName: "Rahul",
    startDate: "2027-04-01",
    endDate: "2027-04-03",
  };
  expect(await updateCouple(user, created.id, couple)).toBeNull();
  expect(
    await updateInvitation(user, created.id, { invitationMessage: "Join us." }),
  ).toBeNull();
});

test("one reply per event, and the next event is the soonest dated day", async () => {
  const user = await createUser({
    name: "Priya Shah",
    email: "priya.replies@example.com",
    password: "password123",
  });
  const created = await createWedding(user, {
    brideName: "Anika",
    groomName: "Rohan",
    startDate: "2027-03-12",
    endDate: "2027-03-14",
    relation: "bride",
    idempotencyKey: "88888888-8888-4888-8888-888888888888",
  });
  const db = await readyDb();
  const weddingId = new ObjectId(created.id);
  const dashboard = await getWeddingDashboard(user._id, created.id);
  const events = dashboard?.events ?? [];
  const roka = events[0];
  const ceremony = events[4];
  await db.collection("guests").insertOne({
    weddingId,
    invitedEventIds: [roka.id, events[1].id, ceremony.id],
    rsvps: [
      { eventId: ceremony.id, answer: "yes" },
      { eventId: ceremony.id, answer: "yes" },
      { eventId: roka.id, answer: "yes" },
      { eventId: roka.id, answer: "no" },
    ],
  });
  await db.collection("tasks").insertMany([
    {
      weddingId,
      title: "Book the hall",
      assigneeId: user._id,
      status: "open",
    },
    {
      weddingId,
      title: "Book the hall",
      assigneeId: user._id,
      status: "open",
    },
  ]);
  await db.collection("events").updateOne(
    { _id: new ObjectId(ceremony.id) },
    { $set: { date: "2027-03-14" } },
  );
  const again = await getWeddingDashboard(user._id, created.id);
  expect(again).toMatchObject({ yes: 1, no: 1, waiting: 1 });
  expect(again?.tasks).toHaveLength(2);
  expect(new Set(again?.tasks.map((task) => task.id)).size).toBe(2);
  const schedule = again?.events ?? [];
  expect(nextEvent(schedule, "2027-03-01")?.id).toBe(ceremony.id);
  expect(nextEvent(schedule, "2027-04-01")?.name).toBe("Roka / engagement");
  expect(nextEvent(events, "2027-03-01")?.name).toBe("Roka / engagement");
  expect(
    nextEvent(
      [
        { name: "Haldi", date: "2026-01-01" },
        { name: "Vidaai", date: "2026-01-02" },
      ],
      "2027-03-01",
    )?.name,
  ).toBe("Vidaai");
});

test("parallel requests cannot bypass fresh, active, or expired rate windows", async () => {
  const db = await readyDb();
  const cases = [
    { key: "parallel:fresh", remaining: 10 },
    { key: "parallel:active", remaining: 2 },
    { key: "parallel:expired", remaining: 10 },
  ];
  await db.collection("authAttempts").insertMany([
    { key: "parallel:active", count: 8, resetAt: new Date(Date.now() + 900000) },
    { key: "parallel:expired", count: 10, resetAt: new Date(Date.now() - 1000) },
  ]);
  for (const { key, remaining } of cases) {
    const results = await Promise.allSettled(
      Array.from({ length: 20 }, () => assertAuthRate(key)),
    );
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(remaining);
    const failures = results.filter((result) => result.status === "rejected");
    expect(failures).toHaveLength(20 - remaining);
    for (const result of failures) {
      if (result.status === "rejected") expect(result.reason).toBeInstanceOf(RateLimitError);
    }
    await expect(assertAuthRate(key)).rejects.toBeInstanceOf(RateLimitError);
    expect(await db.collection("authAttempts").countDocuments({ key })).toBe(1);
  }
});

test("twenty simultaneous invitation saves allow exactly ten", async () => {
  const user = await createUser({ name: "Anika", email: "parallel-saves@example.com", password: "password123" });
  const wedding = await createWedding(user, {
    brideName: "Anika", groomName: "Rohan", relation: "bride",
    startDate: "2027-03-12", endDate: "2027-03-14", idempotencyKey: crypto.randomUUID(),
  });
  await startSession(user._id);
  const { PATCH } = await import("@/app/api/weddings/[weddingId]/route");
  const responses = await Promise.all(Array.from({ length: 20 }, (_, index) => PATCH(
    new Request(`http://localhost/api/weddings/${wedding.id}`, {
      method: "PATCH", headers: { "content-type": "application/json" },
      body: JSON.stringify({ invitationMessage: `Invitation ${index}` }),
    }),
    { params: Promise.resolve({ weddingId: wedding.id }) },
  )));
  expect(responses.filter((response) => response.status === 200)).toHaveLength(10);
  expect(responses.filter((response) => response.status === 429)).toHaveLength(10);
});

test("invalid wedding body shapes receive a friendly HTTP 400", async () => {
  const { PATCH } = await import("@/app/api/weddings/[weddingId]/route");
  for (const body of [null, [], "text", 42, true]) {
    const response = await PATCH(new Request("http://localhost/api/weddings/invalid", {
      method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
    }), { params: Promise.resolve({ weddingId: "invalid" }) });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Check the form." });
  }
});

function weddingRequest(brideName: string) {
  return new Request("http://localhost/api/weddings", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      brideName,
      groomName: "Rahul",
      startDate: "2027-03-12",
      endDate: "2027-03-14",
      relation: "bride",
      idempotencyKey: crypto.randomUUID(),
    }),
  });
}
