import { randomBytes } from "node:crypto";
import { MongoServerError, ObjectId, type Db } from "mongodb";
import { assertAuthRate } from "@/lib/auth/rate";
import type { UserDoc } from "@/lib/auth/session";
import { readyDb } from "@/lib/db";

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
  date?: string;
  time?: string;
};

type MembershipDoc = {
  userId: ObjectId;
  weddingId: ObjectId;
  role: string;
  relation: string;
  name?: string;
};

type GuestReplyDoc = {
  invitedEventIds?: unknown[];
  rsvps?: { eventId?: unknown; answer?: string }[];
};

type TaskDoc = {
  _id: ObjectId;
  title: string;
  assigneeId: ObjectId;
  status: string;
};

type WeddingDoc = {
  _id: ObjectId;
  brideName: string;
  groomName: string;
  startDate: string;
  endDate: string;
  publicSlug: string;
  invitationMessage?: string;
  budgetTotal?: number;
};

type ScheduleEvent = {
  id: string;
  name: string;
  order: number;
  date: string;
  time: string;
};

type OpenTask = {
  id: string;
  title: string;
  assignee: string;
};

export type WeddingDashboard = {
  id: string;
  brideName: string;
  groomName: string;
  startDate: string;
  endDate: string;
  publicSlug: string;
  invitationMessage: string;
  role: "admin" | "helper";
  events: ScheduleEvent[];
  guests: number;
  yes: number;
  no: number;
  waiting: number;
  openTasks: number;
  tasks: OpenTask[];
  budget: number;
  spent: number;
  stillDue: number;
  family: number;
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

export function formatRupees(amount: number) {
  return `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount)}`;
}

export function nextEvent<T extends { date: string }>(events: T[], today: string) {
  return (
    events.find((event) => event.date !== "" && event.date >= today) ??
    events.find((event) => event.date === "") ??
    events[events.length - 1]
  );
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

export async function getWeddingDashboard(userId: ObjectId, weddingId: string, options: { skipEvents?: boolean } = {}) {
  const access = await memberWedding(userId, weddingId);
  if (!access) {
    return null;
  }
  const { db, id, wedding, membership } = access;
  const [events, guests, openTaskCount, openTasks, expenseSums, members] =
    await Promise.all([
      options.skipEvents ? Promise.resolve([] as EventDoc[]) : db
        .collection<EventDoc>("events")
        .find({ weddingId: id })
        .sort({ order: 1 })
        .toArray(),
      db
        .collection<GuestReplyDoc>("guests")
        .find({ weddingId: id })
        .toArray(),
      db.collection("tasks").countDocuments({ weddingId: id, status: "open" }),
      db
        .collection<TaskDoc>("tasks")
        .find({ weddingId: id, status: "open" })
        .sort({ _id: 1 })
        .limit(3)
        .toArray(),
      db
        .collection("expenses")
        .aggregate<{ spent: number; stillDue: number }>([
          { $match: { weddingId: id } },
          {
            $group: {
              _id: null,
              spent: { $sum: "$amount" },
              stillDue: { $sum: "$amountStillDue" },
            },
          },
        ])
        .toArray(),
      db.collection<MembershipDoc>("memberships").find({ weddingId: id }).toArray(),
    ]);
  const replies = countReplies(guests);
  const names = new Map(
    members.flatMap((member) =>
      member.userId
        ? [[member.userId.toString(), member.name ?? ""] as const]
        : [],
    ),
  );
  return {
    id: wedding._id.toString(),
    brideName: wedding.brideName,
    groomName: wedding.groomName,
    startDate: wedding.startDate,
    endDate: wedding.endDate,
    publicSlug: wedding.publicSlug,
    invitationMessage: wedding.invitationMessage ?? "",
    role: membership.role === "admin" ? ("admin" as const) : ("helper" as const),
    events: events.map((event) => ({
      id: event._id.toString(),
      name: event.name,
      order: event.order,
      date: event.date ?? "",
      time: event.time ?? "",
    })),
    guests: guests.length,
    yes: replies.yes,
    no: replies.no,
    waiting: replies.waiting,
    openTasks: openTaskCount,
    tasks: openTasks.map((task) => ({
      id: task._id.toString(),
      title: task.title,
      assignee: names.get(task.assigneeId.toString()) ?? "",
    })),
    budget: wedding.budgetTotal ?? 0,
    spent: expenseSums[0]?.spent ?? 0,
    stillDue: expenseSums[0]?.stillDue ?? 0,
    family: members.filter(member => member.userId).length,
  };
}

async function memberWedding(userId: ObjectId, weddingId: string) {
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
  return { db, id, wedding, membership };
}

function countReplies(guests: GuestReplyDoc[]) {
  let yes = 0;
  let no = 0;
  let waiting = 0;
  for (const guest of guests) {
    const invited = new Set((guest.invitedEventIds ?? []).map(String));
    const choice = new Map<string, "yes" | "no">();
    for (const reply of guest.rsvps ?? []) {
      const eventId = String(reply.eventId ?? "");
      if (!invited.has(eventId)) {
        continue;
      }
      if (reply.answer === "yes" || reply.answer === "no") {
        choice.set(eventId, reply.answer);
      }
    }
    for (const answer of choice.values()) {
      if (answer === "yes") {
        yes += 1;
      } else {
        no += 1;
      }
    }
    waiting += invited.size - choice.size;
  }
  return { yes, no, waiting };
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
