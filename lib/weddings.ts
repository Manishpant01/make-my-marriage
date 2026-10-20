import { ObjectId } from "mongodb";
import { readyDb } from "@/lib/db";

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
