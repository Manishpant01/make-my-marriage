import { MongoClient, type Db } from "mongodb";
import { ConfigError } from "@/lib/errors";

const INDEX_REVISION = 1;

const globalForMongo = globalThis as unknown as {
  mongoClient?: Promise<MongoClient>;
  mongoIndexes?: Promise<void>;
  mongoUri?: string;
  indexRevision?: number;
};

function requireUri() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new ConfigError("MONGODB_URI is not set");
  }
  return uri;
}

function client() {
  const uri = requireUri();
  if (globalForMongo.mongoUri !== uri) {
    globalForMongo.mongoUri = uri;
    globalForMongo.mongoClient = undefined;
    globalForMongo.mongoIndexes = undefined;
  }
  if (!globalForMongo.mongoClient) {
    const mongo = new MongoClient(uri);
    globalForMongo.mongoClient = mongo.connect().catch((error: unknown) => {
      globalForMongo.mongoClient = undefined;
      throw error;
    });
  }
  return globalForMongo.mongoClient;
}

export async function getDb(): Promise<Db> {
  const connected = await client();
  return connected.db("makemymarriage");
}

export function readyDb() {
  if (globalForMongo.indexRevision !== INDEX_REVISION) {
    globalForMongo.indexRevision = INDEX_REVISION;
    globalForMongo.mongoIndexes = undefined;
  }
  if (!globalForMongo.mongoIndexes) {
    globalForMongo.mongoIndexes = ensureIndexes().catch((error: unknown) => {
      globalForMongo.mongoIndexes = undefined;
      throw error;
    });
  }
  return globalForMongo.mongoIndexes.then(() => getDb());
}

async function ensureIndexes() {
  const db = await getDb();
  await Promise.all([
    db.collection("users").createIndex({ email: 1 }, { unique: true }),
    db.collection("sessions").createIndex({ sessionId: 1 }, { unique: true }),
    db
      .collection("sessions")
      .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection("memberships").createIndex({ userId: 1 }),
    db.collection("authAttempts").createIndex({ key: 1 }, { unique: true }),
    db
      .collection("authAttempts")
      .createIndex({ resetAt: 1 }, { expireAfterSeconds: 0 }),
  ]);
}
