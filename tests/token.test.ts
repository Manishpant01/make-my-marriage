import { expect, test } from "vitest";
import { readSessionId, signSessionToken } from "@/lib/auth/token";

const secret = "test-secret-with-enough-length";

test("a token returns its session id", () => {
  const expiresAt = new Date(Date.now() + 60_000);
  const token = signSessionToken("session-1", expiresAt, secret);
  expect(readSessionId(token, secret)).toBe("session-1");
});

test("a tampered token is refused", () => {
  const expiresAt = new Date(Date.now() + 60_000);
  const token = signSessionToken("session-1", expiresAt, secret);
  const [header, payload, signature] = token.split(".");
  const flipped = `${signature.slice(0, -1)}${signature.endsWith("a") ? "b" : "a"}`;
  expect(readSessionId(`${header}.${payload}.${flipped}`, secret)).toBeNull();
  expect(readSessionId(`${header}.${payload}x.${signature}`, secret)).toBeNull();
  expect(readSessionId(token, "other-secret")).toBeNull();
});

test("an expired token is refused", () => {
  const token = signSessionToken(
    "session-1",
    new Date(Date.now() - 60_000),
    secret,
  );
  expect(readSessionId(token, secret)).toBeNull();
});
