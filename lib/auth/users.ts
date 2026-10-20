import { ObjectId } from "mongodb";
import { readyDb } from "@/lib/db";
import { DuplicateEmailError } from "@/lib/errors";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { startSession, type UserDoc } from "@/lib/auth/session";

function accountEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
}) {
  const email = accountEmail(input.email);
  const name = input.name.trim();
  const db = await readyDb();
  const users = db.collection<UserDoc>("users");
  const now = new Date();
  const existing = await users.findOne({ email });
  if (existing) {
    await hashPassword(input.password);
    throw new DuplicateEmailError();
  }
  try {
    const result = await users.insertOne({
      email,
      name,
      passwordHash: await hashPassword(input.password),
      createdAt: now,
      updatedAt: now,
    } as UserDoc);
    return {
      _id: result.insertedId,
      email,
      name,
      passwordHash: "",
      createdAt: now,
      updatedAt: now,
    } satisfies UserDoc;
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      throw new DuplicateEmailError();
    }
    throw error;
  }
}

export async function deleteUser(userId: ObjectId) {
  const db = await readyDb();
  await db.collection<UserDoc>("users").deleteOne({ _id: userId });
  await db.collection("sessions").deleteMany({ userId });
}

export async function signUp(input: {
  name: string;
  email: string;
  password: string;
}) {
  const user = await createUser(input);
  try {
    await startSession(user._id);
    return user;
  } catch (error) {
    await deleteUser(user._id).catch((cleanupError: unknown) => {
      console.error(cleanupError);
    });
    throw error;
  }
}

export async function findUserByPassword(email: string, password: string) {
  const db = await readyDb();
  const user = await db.collection<UserDoc>("users").findOne({
    email: accountEmail(email),
  });
  if (!user) {
    await hashPassword(password);
    return null;
  }
  const matches = await verifyPassword(password, user.passwordHash);
  return matches ? user : null;
}
