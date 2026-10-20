import { afterEach, expect, test } from "vitest";
import { clientAddress } from "@/lib/auth/rate";
import {
  firstIssue,
  forgotPasswordSchema,
  loginSchema,
  signupSchema,
} from "@/lib/validators";

const previousVercel = process.env.VERCEL;

afterEach(() => {
  if (previousVercel === undefined) {
    delete process.env.VERCEL;
  } else {
    process.env.VERCEL = previousVercel;
  }
});

test("a caller cannot choose the rate-limit address", () => {
  delete process.env.VERCEL;
  const request = new Request("http://localhost/api/auth/login", {
    headers: {
      "x-forwarded-for": "203.0.113.20",
      "x-real-ip": "203.0.113.21",
      "x-vercel-forwarded-for": "203.0.113.22",
    },
  });
  expect(clientAddress(request)).toBe("local");
  process.env.VERCEL = "1";
  expect(clientAddress(request)).toBe("203.0.113.22");
});

test("a password of only spaces is refused", () => {
  const parsed = signupSchema.safeParse({
    name: "Anu",
    email: "anu@example.com",
    password: "        ",
  });
  expect(parsed.success).toBe(false);
  if (!parsed.success) {
    expect(firstIssue(parsed.error)).toBe("Use at least 8 characters.");
  }
});

test("a missing email is a form message", () => {
  const parsed = loginSchema.safeParse({ password: "password123" });
  expect(parsed.success).toBe(false);
  if (!parsed.success) {
    expect(firstIssue(parsed.error)).toBe("Enter a valid email.");
  }
});

test("an email that is not text is a form message", () => {
  const parsed = loginSchema.safeParse({
    email: { $gt: "" },
    password: "password123",
  });
  expect(parsed.success).toBe(false);
  if (!parsed.success) {
    expect(firstIssue(parsed.error)).toBe("Enter a valid email.");
  }
});

test("forgot password requires an email", () => {
  const parsed = forgotPasswordSchema.safeParse({});
  expect(parsed.success).toBe(false);
  if (!parsed.success) {
    expect(firstIssue(parsed.error)).toBe("Enter a valid email.");
  }
});
