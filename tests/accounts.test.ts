import { afterAll, beforeAll, expect, test, vi } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { ObjectId } from "mongodb";

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
import { DuplicateEmailError, RateLimitError } from "@/lib/errors";
import { listWeddings } from "@/lib/weddings";

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
      name: "Rahul",
      email: "rahul@example.com",
      password: "password123",
    }),
  ).rejects.toBeInstanceOf(DuplicateEmailError);
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
