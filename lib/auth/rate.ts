import { readyDb } from "@/lib/db";
import { RateLimitError } from "@/lib/errors";

const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000;

type AttemptDoc = {
  key: string;
  count: number;
  resetAt: Date;
};

function forwardedAddress(request: Request, name: string) {
  const first = request.headers.get(name)?.split(",")[0]?.trim();
  return first || "";
}

export function clientAddress(request: Request) {
  if (process.env.VERCEL) {
    return (
      forwardedAddress(request, "x-vercel-forwarded-for") ||
      request.headers.get("x-real-ip")?.trim() ||
      "local"
    );
  }
  return "local";
}

export async function assertAuthRate(key: string) {
  const db = await readyDb();
  const attempts = db.collection<AttemptDoc>("authAttempts");
  // A single document update reserves each attempt, including the first one.
  // Use database time so delayed requests cannot reset a newer window.
  const expired = { $lte: [{ $ifNull: ["$resetAt", new Date(0)] }, "$$NOW"] };
  const update = [{
    $set: {
      count: {
        $cond: [expired, 1, {
          $min: [{ $add: [{ $ifNull: ["$count", 0] }, 1] }, MAX_ATTEMPTS + 1],
        }],
      },
      resetAt: { $cond: [expired, { $add: ["$$NOW", WINDOW_MS] }, "$resetAt"] },
    },
  }];
  for (let retry = 0; retry < 3; retry += 1) {
    try {
      const reserved = await attempts.findOneAndUpdate({ key }, update, {
        upsert: true,
        returnDocument: "after",
      });
      if (!reserved || reserved.count > MAX_ATTEMPTS) {
        throw new RateLimitError();
      }
      return;
    } catch (error) {
      // Concurrent first requests may race on the unique key. The losing insert
      // reserved nothing; retry the same atomic operation against the winner.
      if (retry < 2 && typeof error === "object" && error !== null &&
          "code" in error && error.code === 11000) continue;
      throw error;
    }
  }
}
