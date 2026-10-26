import { ObjectId, type Db, type ClientSession } from "mongodb";
import { createHash } from "node:crypto";
import { transaction } from "@/lib/db";
import { familyAccess } from "@/lib/family";
import { RequestError } from "@/lib/errors";
import { assertAuthRate } from "@/lib/auth/rate";
import type { UserDoc } from "@/lib/auth/session";
import type { EventInput, EventPatch } from "@/lib/event-input";

type EventDoc = {
  _id: ObjectId; weddingId: ObjectId; name: string; order: number;
  date?: string; time?: string; venueName?: string; latitude?: number; longitude?: number; youtubeUrl?: string; createKey?: string; createFingerprint?: string;
};
export type PlannedEvent = {
  id: string; name: string; order: number; date: string; time: string; venueName: string;
  latitude: number | null; longitude: number | null; youtubeUrl: string;
};
export type EventPage = { items: PlannedEvent[]; page: number; pageSize: number; total: number };
function present(event: EventDoc): PlannedEvent {
  return { id: String(event._id), name: event.name, order: event.order, date: event.date ?? "", time: event.time ?? "",
    venueName: event.venueName ?? "", latitude: event.latitude ?? null, longitude: event.longitude ?? null, youtubeUrl: event.youtubeUrl ?? "" };
}
function objectId(value: string) {
  if (!/^[a-f\d]{24}$/i.test(value)) throw new RequestError("That event was not found.", 404);
  return new ObjectId(value);
}
export async function listEvents(userId: ObjectId, weddingId: string, page = 1, pageSize = 20): Promise<EventPage> {
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 50 || !Number.isSafeInteger((page - 1) * pageSize)) throw new RequestError("Choose a valid page.");
  const { db, id } = await familyAccess(userId, weddingId);
  const collection = db.collection<EventDoc>("events");
  const [items, total] = await Promise.all([
    collection.find({ weddingId: id }).sort({ order: 1, _id: 1 }).skip((page - 1) * pageSize).limit(pageSize).toArray(),
    collection.countDocuments({ weddingId: id }),
  ]);
  return { items: items.map(present), total, page, pageSize };
}
export async function getEvent(userId: ObjectId, weddingId: string, eventId: string) {
  const { db, id } = await familyAccess(userId, weddingId);
  const event = await db.collection<EventDoc>("events").findOne({ _id: objectId(eventId), weddingId: id });
  if (!event) throw new RequestError("That event was not found. It may have been removed.", 404);
  return present(event);
}

async function lockSchedule(db: Db, session: ClientSession, userId: ObjectId, id: ObjectId) {
  const member = await db.collection("memberships").findOne({ weddingId: id, userId, role: { $in: ["admin", "helper"] } }, { session });
  if (!member) throw new RequestError("That wedding was not found.", 404);
  // All event mutations write this document first, serializing order changes,
  // appends, and deletion cleanup even when different event rows are affected.
  const locked = await db.collection("weddings").updateOne({ _id: id }, { $inc: { eventRevision: 1 } }, { session });
  if (!locked.matchedCount) throw new RequestError("That wedding was not found.", 404);
}
function changes(input: EventPatch) {
  const set: Record<string, unknown> = {}, unset: Record<string, ""> = {};
  for (const field of ["name", "date", "time", "venueName", "latitude", "longitude"] as const) {
    if (!(field in input)) continue;
    if (input[field] === null || input[field] === "") unset[field] = "";
    else set[field] = input[field];
  }
  return { ...(Object.keys(set).length ? { $set: set } : {}), ...(Object.keys(unset).length ? { $unset: unset } : {}) };
}

export async function createEvent(user: UserDoc, weddingId: string, input: EventInput, key?: string) {
  const fingerprint = createHash("sha256").update(JSON.stringify({ name: input.name, date: input.date || "", time: input.time || "", venueName: input.venueName || "", latitude: input.latitude ?? null, longitude: input.longitude ?? null })).digest("hex");
  function replay(existing: EventDoc) {
    if (existing.createFingerprint !== fingerprint) throw new RequestError("This save already created an event. Return to Events to edit it.", 409);
    return present(existing);
  }
  const { db, id } = await familyAccess(user._id, weddingId);
  if (key) {
    const existing = await db.collection<EventDoc>("events").findOne({ weddingId: id, createKey: key });
    if (existing) return replay(existing);
  }
  await assertAuthRate(`events:${user._id}:${id}`, 60);
  return transaction(async (db, session) => {
    await lockSchedule(db, session, user._id, id);
    const events = db.collection<EventDoc>("events");
    if (key) {
      const existing = await events.findOne({ weddingId: id, createKey: key }, { session });
      if (existing) return replay(existing);
    }
    const last = await events.find({ weddingId: id }, { session }).sort({ order: -1 }).limit(1).next();
    const event: EventDoc = { _id: new ObjectId(), weddingId: id, name: input.name, order: (last?.order ?? 0) + 1, ...(key ? { createKey: key, createFingerprint: fingerprint } : {}) };
    const update = changes(input);
    Object.assign(event, update.$set);
    await events.insertOne(event, { session });
    return present(event);
  });
}

export async function updateEvent(user: UserDoc, weddingId: string, eventId: string, input: EventPatch) {
  const { id } = await familyAccess(user._id, weddingId);
  const target = objectId(eventId);
  await assertAuthRate(`events:${user._id}:${id}`, 60);
  return transaction(async (db, session) => {
    await lockSchedule(db, session, user._id, id);
    const events = db.collection<EventDoc>("events");
    const event = await events.findOne({ _id: target, weddingId: id }, { session });
    if (!event) throw new RequestError("That event was not found. It may have been removed.", 404);
    if (input.order !== undefined) {
      const rows = await events.find({ weddingId: id }, { session }).sort({ order: 1, _id: 1 }).toArray();
      if (input.order > rows.length) throw new RequestError("That position is outside the schedule.");
      const remaining = rows.filter(row => !row._id.equals(target));
      remaining.splice(input.order - 1, 0, event);
      await events.bulkWrite(remaining.map((row, index) => ({ updateOne: { filter: { _id: row._id, weddingId: id }, update: { $set: { order: index + 1 } } } })), { session });
    }
    const update = changes(input);
    if (Object.keys(update).length) await events.updateOne({ _id: target, weddingId: id }, update, { session });
    return present((await events.findOne({ _id: target, weddingId: id }, { session }))!);
  });
}

export async function deleteEvent(user: UserDoc, weddingId: string, eventId: string) {
  const { id } = await familyAccess(user._id, weddingId);
  const target = objectId(eventId);
  await assertAuthRate(`events:${user._id}:${id}`, 60);
  await transaction(async (db, session) => {
    await lockSchedule(db, session, user._id, id);
    const events = db.collection<EventDoc>("events");
    const removed = await events.deleteOne({ _id: target, weddingId: id }, { session });
    if (!removed.deletedCount) throw new RequestError("That event was not found. It may have been removed.", 404);
    // Support existing ObjectId storage and older string representations.
    await db.collection("guests").updateMany({ weddingId: id,
      $or: [{ invitedEventIds: { $in: [target, String(target)] } }, { "rsvps.eventId": { $in: [target, String(target)] } }],
    }, [{ $set: {
      invitedEventIds: { $filter: { input: { $ifNull: ["$invitedEventIds", []] }, as: "event", cond: { $not: [{ $in: ["$$event", [target, String(target)]] }] } } },
      rsvps: { $filter: { input: { $ifNull: ["$rsvps", []] }, as: "reply", cond: { $not: [{ $in: ["$$reply.eventId", [target, String(target)]] }] } } },
    } }], { session });
    const rows = await events.find({ weddingId: id }, { session }).sort({ order: 1, _id: 1 }).toArray();
    if (rows.length) await events.bulkWrite(rows.map((row, index) => ({ updateOne: { filter: { _id: row._id, weddingId: id }, update: { $set: { order: index + 1 } } } })), { session });
  });
}
