import { randomBytes, scrypt } from "node:crypto";
import { expect, test } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

function scryptAsync(password: string, salt: Buffer) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, 32, { N: 16384, r: 8, p: 1 }, (error, derived) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(derived);
    });
  });
}

test("a password verifies only against its own hash", async () => {
  const hash = await hashPassword("password123");
  expect(hash.startsWith("scrypt$131072$8$1$")).toBe(true);
  expect(await verifyPassword("password123", hash)).toBe(true);
  expect(await verifyPassword("password124", hash)).toBe(false);
});

test("an older hash without a stored cost still verifies", async () => {
  const salt = randomBytes(16);
  const hash = await scryptAsync("older-password", salt);
  const stored = `scrypt$${salt.toString("base64url")}$${hash.toString("base64url")}`;
  expect(await verifyPassword("older-password", stored)).toBe(true);
  expect(await verifyPassword("other-password", stored)).toBe(false);
});
