import { readyDb } from "@/lib/db";
import { RateLimitError } from "@/lib/errors";

const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000;

type AttemptDoc = {
  key: string;
  count: number;
  resetAt: Date;
};

export function clientAddress(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || request.headers.get("x-real-ip") || "unknown";
}

export async function assertAuthRate(key: string) {
  const db = await readyDb();
  const attempts = db.collection<AttemptDoc>("authAttempts");
  const now = new Date();
  const existing = await attempts.findOne({ key });
  if (existing && existing.resetAt > now && existing.count >= MAX_ATTEMPTS) {
    throw new RateLimitError();
  }
  if (!existing || existing.resetAt <= now) {
    try {
      await attempts.updateOne(
        { key },
        { $set: { count: 1, resetAt: new Date(now.getTime() + WINDOW_MS) } },
        { upsert: true },
      );
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === 11000
      ) {
        await attempts.updateOne({ key }, { $inc: { count: 1 } });
        return;
      }
      throw error;
    }
    return;
  }
  await attempts.updateOne(
    { key, resetAt: existing.resetAt },
    { $inc: { count: 1 } },
  );
}
