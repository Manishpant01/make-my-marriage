import { randomBytes } from "node:crypto";
import { MongoServerError, ObjectId, type Db } from "mongodb";
import { assertAuthRate } from "@/lib/auth/rate";
import { readyDb } from "@/lib/db";
import type { UserDoc } from "@/lib/auth/session";

const STARTING_EVENTS = [
  "Roka / engagement",
  "Haldi",
  "Mehendi",
  "Sangeet",
  "Wedding ceremony",
  "Reception",
  "Vidaai",
] as const;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type CreatedWedding = {
  brideName: string;
  groomName: string;
  startDate: string;
  endDate: string;
  relation: "bride" | "groom";
  idempotencyKey: string;
};

type WeddingCreateDoc = {
  userId: ObjectId;
  key: string;
  weddingId: ObjectId | null;
};

type EventDoc = {
  _id: ObjectId;
  name: string;
  order: number;
};

type MembershipDoc = {
  userId: ObjectId;
  weddingId: ObjectId;
  role: string;
  relation: string;
};

type WeddingDoc = {
  _id: ObjectId;
  brideName: string;
  groomName: string;
  startDate: string;
  endDate: string;
  publicSlug: string;
};

export async function listWeddings(
  userId: ObjectId,
  page: number,
  pageSize: number,
) {
  const db = await readyDb();
  const memberships = db.collection<MembershipDoc>("memberships");
  const filter = { userId };
  const total = await memberships.countDocuments(filter);
  const rows = await memberships
    .find(filter)
    .sort({ _id: 1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .toArray();
  const weddings = await db
    .collection<WeddingDoc>("weddings")
    .find({ _id: { $in: rows.map((row) => row.weddingId) } })
    .toArray();
  const byId = new Map(
    weddings.map((wedding) => [wedding._id.toString(), wedding]),
  );
  const items = rows.flatMap((row) => {
    const wedding = byId.get(row.weddingId.toString());
    if (!wedding) {
      return [];
    }
    return [
      {
        id: wedding._id.toString(),
        brideName: wedding.brideName,
        groomName: wedding.groomName,
        startDate: wedding.startDate,
        endDate: wedding.endDate,
        publicSlug: wedding.publicSlug,
        role: row.role,
        relation: row.relation,
      },
    ];
  });
  return { items, total, page, pageSize };
}

export function formatWeddingDates(startDate: string, endDate: string) {
  const start = readDate(startDate);
  const end = readDate(endDate);
  if (startDate === endDate) {
    return `${start.day} ${start.month} ${start.year}`;
  }
  if (start.year === end.year && start.month === end.month) {
    return `${start.day}–${end.day} ${start.month} ${start.year}`;
  }
  if (start.year === end.year) {
    return `${start.day} ${start.month} – ${end.day} ${end.month} ${start.year}`;
  }
  return `${start.day} ${start.month} ${start.year} – ${end.day} ${end.month} ${end.year}`;
}

export async function createWedding(user: UserDoc, input: CreatedWedding) {
  const db = await readyDb();
  const claims = db.collection<WeddingCreateDoc>("weddingCreates");
  const saved = await finishedClaim(db, user._id, input.idempotencyKey);
  if (saved) {
    return saved;
  }
  await assertAuthRate(`wedding:${user._id.toString()}`);
  try {
    await claims.insertOne({
      userId: user._id,
      key: input.idempotencyKey,
      weddingId: null,
    });
  } catch (error) {
    if (!isDuplicateKey(error)) {
      throw error;
    }
    const existing = await waitForCreatedWedding(
      db,
      user._id,
      input.idempotencyKey,
    );
    if (!existing) {
      throw new Error("The wedding was not created.");
    }
    return existing;
  }

  let weddingId: ObjectId | null = null;
  try {
    const wedding = await insertWedding(db, input);
    weddingId = wedding.id;
    await db.collection("memberships").insertOne({
      weddingId,
      userId: user._id,
      role: "admin",
      relation: input.relation,
      name: user.name,
      email: user.email,
    });
    const eventDocs = STARTING_EVENTS.map((name, index) => ({
      weddingId,
      name,
      order: index + 1,
    }));
    const inserted = await db.collection("events").insertMany(eventDocs);
    await claims.updateOne(
      { userId: user._id, key: input.idempotencyKey },
      { $set: { weddingId } },
    );
    return {
      id: weddingId.toString(),
      brideName: input.brideName,
      groomName: input.groomName,
      startDate: input.startDate,
      endDate: input.endDate,
      publicSlug: wedding.publicSlug,
      role: "admin" as const,
      relation: input.relation,
      events: eventDocs.map((event, index) => ({
        id: inserted.insertedIds[index].toString(),
        name: event.name,
        order: event.order,
      })),
    };
  } catch (error) {
    if (weddingId) {
      await removeCreatedRows(db, weddingId);
    }
    try {
      await claims.deleteOne({ userId: user._id, key: input.idempotencyKey });
    } catch (cleanupError) {
      console.error(cleanupError);
    }
    throw error;
  }
}

export async function getWeddingForUser(userId: ObjectId, weddingId: string) {
  if (!ObjectId.isValid(weddingId)) {
    return null;
  }
  const id = new ObjectId(weddingId);
  const db = await readyDb();
  const membership = await db.collection<MembershipDoc>("memberships").findOne({
    userId,
    weddingId: id,
  });
  if (!membership) {
    return null;
  }
  const wedding = await db.collection<WeddingDoc>("weddings").findOne({ _id: id });
  if (!wedding) {
    return null;
  }
  return {
    id: wedding._id.toString(),
    brideName: wedding.brideName,
    groomName: wedding.groomName,
    startDate: wedding.startDate,
    endDate: wedding.endDate,
  };
}

function readDate(value: string) {
  const [year, month, day] = value.split("-");
  return {
    year,
    month: MONTHS[Number(month) - 1],
    day: String(Number(day)),
  };
}

async function insertWedding(db: Db, input: CreatedWedding) {
  const weddings = db.collection("weddings");
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const publicSlug = randomBytes(9).toString("base64url");
    try {
      const wedding = await weddings.insertOne({
        brideName: input.brideName,
        groomName: input.groomName,
        startDate: input.startDate,
        endDate: input.endDate,
        publicSlug,
      });
      return { id: wedding.insertedId, publicSlug };
    } catch (error) {
      if (!isDuplicateKey(error) || attempt === 2) {
        throw error;
      }
    }
  }
  throw new Error("The wedding was not created.");
}

async function finishedClaim(db: Db, userId: ObjectId, key: string) {
  const claim = await db
    .collection<WeddingCreateDoc>("weddingCreates")
    .findOne({ userId, key });
  if (!claim?.weddingId) {
    return null;
  }
  return finishedWedding(db, userId, claim.weddingId);
}

async function waitForCreatedWedding(db: Db, userId: ObjectId, key: string) {
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const claim = await db
      .collection<WeddingCreateDoc>("weddingCreates")
      .findOne({ userId, key });
    if (!claim) {
      return null;
    }
    if (claim.weddingId) {
      const wedding = await finishedWedding(db, userId, claim.weddingId);
      if (wedding) {
        return wedding;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  return null;
}

async function finishedWedding(db: Db, userId: ObjectId, weddingId: ObjectId) {
  const wedding = await db
    .collection<WeddingDoc>("weddings")
    .findOne({ _id: weddingId });
  const membership = await db.collection<MembershipDoc>("memberships").findOne({
    userId,
    weddingId,
  });
  if (!wedding || !membership) {
    return null;
  }
  if (membership.relation !== "bride" && membership.relation !== "groom") {
    return null;
  }
  const events = await db
    .collection<EventDoc>("events")
    .find({ weddingId })
    .sort({ order: 1 })
    .toArray();
  return {
    id: wedding._id.toString(),
    brideName: wedding.brideName,
    groomName: wedding.groomName,
    startDate: wedding.startDate,
    endDate: wedding.endDate,
    publicSlug: wedding.publicSlug,
    role: "admin" as const,
    relation: membership.relation,
    events: events.map((event) => ({
      id: event._id.toString(),
      name: event.name,
      order: event.order,
    })),
  };
}

async function removeCreatedRows(db: Db, weddingId: ObjectId) {
  const steps = [
    () => db.collection("events").deleteMany({ weddingId }),
    () => db.collection("memberships").deleteMany({ weddingId }),
    () => db.collection("weddings").deleteOne({ _id: weddingId }),
  ];
  for (const step of steps) {
    try {
      await step();
    } catch (cleanupError) {
      console.error(cleanupError);
    }
  }
}

function isDuplicateKey(error: unknown) {
  return error instanceof MongoServerError && error.code === 11000;
}
