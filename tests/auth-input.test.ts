import { afterEach, expect, test } from "vitest";
import { clientAddress } from "@/lib/auth/rate";
import {
  createWeddingSchema,
  firstIssue,
  forgotPasswordSchema,
  loginSchema,
  parseWeddingPatch,
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

test("a wedding refuses a last day before the first", () => {
  const parsed = createWeddingSchema.safeParse({
    brideName: "Priya",
    groomName: "Rahul",
    startDate: "2027-03-14",
    endDate: "2027-03-12",
    relation: "bride",
    idempotencyKey: "11111111-1111-4111-8111-111111111111",
  });
  expect(parsed.success).toBe(false);
  if (!parsed.success) {
    expect(firstIssue(parsed.error)).toBe(
      "The last day is before the first day.",
    );
  }
});

test("a wedding refuses a date that is not a day", () => {
  const parsed = createWeddingSchema.safeParse({
    brideName: "Priya",
    groomName: "Rahul",
    startDate: "2027-02-31",
    endDate: "2027-03-02",
    relation: "groom",
    idempotencyKey: "22222222-2222-4222-8222-222222222222",
  });
  expect(parsed.success).toBe(false);
  if (!parsed.success) {
    expect(firstIssue(parsed.error)).toBe("Enter a real date.");
  }
});

test("forgot password requires an email", () => {
  const parsed = forgotPasswordSchema.safeParse({});
  expect(parsed.success).toBe(false);
  if (!parsed.success) {
    expect(firstIssue(parsed.error)).toBe("Enter a valid email.");
  }
});

test("the couple form refuses a last day before the first", () => {
  const parsed = parseWeddingPatch({
    brideName: "Anika",
    groomName: "Rohan",
    startDate: "2027-03-14",
    endDate: "2027-03-12",
  });
  expect(parsed.ok).toBe(false);
  if (!parsed.ok) {
    expect(parsed.message).toBe("The last day is before the first day.");
  }
});

test("a save can correct the couple and the message together", () => {
  expect(
    parseWeddingPatch({
      brideName: " Anika ",
      groomName: "Rohan",
      startDate: "2027-03-12",
      endDate: "2027-03-14",
      invitationMessage: "  Join us.  ",
    }),
  ).toEqual({
    ok: true,
    kind: "couple",
    data: {
      brideName: "Anika",
      groomName: "Rohan",
      startDate: "2027-03-12",
      endDate: "2027-03-14",
      invitationMessage: "Join us.",
    },
  });
  const parsed = parseWeddingPatch({
    brideName: "Anika",
    groomName: "Rohan",
    startDate: "2027-03-12",
    endDate: "2027-03-14",
    invitationMessage: "x".repeat(401),
  });
  expect(parsed.ok).toBe(false);
  if (!parsed.ok) {
    expect(parsed.message).toBe("That message is too long.");
  }
});

test("the invitation form keeps a short message and allows none", () => {
  expect(parseWeddingPatch({ invitationMessage: "  Join us.  " })).toEqual({
    ok: true,
    kind: "invitation",
    data: { invitationMessage: "Join us." },
  });
  expect(parseWeddingPatch({ invitationMessage: "" })).toEqual({
    ok: true,
    kind: "invitation",
    data: { invitationMessage: "" },
  });
  const parsed = parseWeddingPatch({ invitationMessage: "x".repeat(401) });
  expect(parsed.ok).toBe(false);
  if (!parsed.ok) {
    expect(parsed.message).toBe("That message is too long.");
  }
});
