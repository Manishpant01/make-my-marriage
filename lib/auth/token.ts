import { createHmac, timingSafeEqual } from "node:crypto";

function encode(value: string) {
  return Buffer.from(value).toString("base64url");
}

export function signSessionToken(
  sessionId: string,
  expiresAt: Date,
  secret: string,
) {
  const header = encode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = encode(
    JSON.stringify({
      sid: sessionId,
      exp: Math.floor(expiresAt.getTime() / 1000),
    }),
  );
  const data = `${header}.${payload}`;
  const signature = createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${signature}`;
}

export function readSessionId(token: string, secret: string) {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }
  const [header, payload, signature] = parts;
  const data = `${header}.${payload}`;
  const expected = createHmac("sha256", secret).update(data).digest("base64url");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }
  try {
    const body = JSON.parse(Buffer.from(payload, "base64url").toString()) as {
      sid?: unknown;
      exp?: unknown;
    };
    if (typeof body.sid !== "string" || typeof body.exp !== "number") {
      return null;
    }
    if (body.exp * 1000 <= Date.now()) {
      return null;
    }
    return body.sid;
  } catch {
    return null;
  }
}
