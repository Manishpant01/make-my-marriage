import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { readyDb } from "@/lib/db";
import { ConfigError } from "@/lib/errors";
import { readSessionId, signSessionToken } from "@/lib/auth/token";

const COOKIE_NAME = "session";
const SESSION_MS = 30 * 24 * 60 * 60 * 1000;

type SessionDoc = {
  sessionId: string;
  userId: ObjectId;
  expiresAt: Date;
};

export type UserDoc = {
  _id: ObjectId;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
};

function requireSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new ConfigError("AUTH_SECRET is not set");
  }
  return secret;
}

function cookieOptions(expires?: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    ...(expires ? { expires } : { maxAge: 0 }),
  };
}

export function publicUser(user: UserDoc) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
  };
}

export async function startSession(userId: ObjectId) {
  const secret = requireSecret();
  const sessionId = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_MS);
  const db = await readyDb();
  await db.collection<SessionDoc>("sessions").insertOne({
    sessionId,
    userId,
    expiresAt,
  });
  const jar = await cookies();
  jar.set(
    COOKIE_NAME,
    signSessionToken(sessionId, expiresAt, secret),
    cookieOptions(expiresAt),
  );
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) {
    return false;
  }
  const secret = process.env.AUTH_SECRET;
  const sessionId = secret ? readSessionId(token, secret) : null;
  try {
    if (sessionId && process.env.MONGODB_URI) {
      const db = await readyDb();
      await db.collection<SessionDoc>("sessions").deleteOne({ sessionId });
    }
  } finally {
    jar.set(COOKIE_NAME, "", cookieOptions());
  }
  return Boolean(sessionId);
}

export async function getOptionalUser() {
  try {
    return await getCurrentUser();
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function getCurrentUser() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token || !process.env.AUTH_SECRET || !process.env.MONGODB_URI) {
    return null;
  }
  const sessionId = readSessionId(token, process.env.AUTH_SECRET);
  if (!sessionId) {
    return null;
  }
  const db = await readyDb();
  const session = await db.collection<SessionDoc>("sessions").findOne({
    sessionId,
    expiresAt: { $gt: new Date() },
  });
  if (!session) {
    return null;
  }
  return db.collection<UserDoc>("users").findOne({ _id: session.userId });
}
