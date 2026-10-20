import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 32;

function scryptAsync(
  password: string,
  salt: Buffer,
  keyLength: number,
  options: { N: number; r: number; p: number; maxmem: number },
) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, keyLength, options, (error, derived) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(derived);
    });
  });
}
const COST = 131072;
const BLOCK_SIZE = 8;
const PARALLEL = 1;

function scryptParams(cost: number, blockSize: number, parallel: number) {
  return {
    N: cost,
    r: blockSize,
    p: parallel,
    maxmem: 128 * cost * blockSize * 2,
  };
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await scryptAsync(
    password,
    salt,
    KEY_LENGTH,
    scryptParams(COST, BLOCK_SIZE, PARALLEL),
  );
  return [
    "scrypt",
    COST,
    BLOCK_SIZE,
    PARALLEL,
    salt.toString("base64url"),
    hash.toString("base64url"),
  ].join("$");
}

function readHash(stored: string) {
  const parts = stored.split("$");
  if (parts[0] !== "scrypt") {
    return null;
  }
  if (parts.length === 6) {
    return {
      cost: Number(parts[1]),
      blockSize: Number(parts[2]),
      parallel: Number(parts[3]),
      salt: parts[4] ?? "",
      hash: parts[5] ?? "",
    };
  }
  if (parts.length === 3) {
    return {
      cost: 16384,
      blockSize: 8,
      parallel: 1,
      salt: parts[1] ?? "",
      hash: parts[2] ?? "",
    };
  }
  return null;
}

export async function verifyPassword(password: string, stored: string) {
  const parsed = readHash(stored);
  if (!parsed || !parsed.salt || !parsed.hash) {
    return false;
  }
  const { cost, blockSize, parallel, salt, hash } = parsed;
  if (
    !Number.isSafeInteger(cost) ||
    cost < 16384 ||
    cost > 262144 ||
    !Number.isSafeInteger(blockSize) ||
    blockSize < 1 ||
    blockSize > 16 ||
    !Number.isSafeInteger(parallel) ||
    parallel < 1 ||
    parallel > 4
  ) {
    return false;
  }
  const actual = Buffer.from(hash, "base64url");
  if (actual.length === 0) {
    return false;
  }
  const derived = await scryptAsync(
    password,
    Buffer.from(salt, "base64url"),
    actual.length,
    scryptParams(cost, blockSize, parallel),
  );
  if (derived.length !== actual.length) {
    return false;
  }
  return timingSafeEqual(derived, actual);
}
