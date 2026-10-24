import { z } from "zod";

const email = z
  .string("Enter a valid email.")
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email."));

const password = z
  .string("Use at least 8 characters.")
  .min(8, "Use at least 8 characters.")
  .max(200, "That password is too long.")
  .refine((value) => value.trim().length >= 8, "Use at least 8 characters.");

export const signupSchema = z.object({
  name: z
    .string("Enter your name.")
    .trim()
    .min(1, "Enter your name.")
    .max(80, "That name is too long."),
  email,
  password,
});

export const loginSchema = z.object({
  email,
  password,
});

export const forgotPasswordSchema = z.object({
  email,
});

const calendarDate = z
  .string("Enter a date.")
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a date.")
  .refine(isCalendarDate, "Enter a real date.");

export const createWeddingSchema = z
  .object({
    brideName: z
      .string("Enter the bride’s name.")
      .trim()
      .min(1, "Enter the bride’s name.")
      .max(80, "That name is too long."),
    groomName: z
      .string("Enter the groom’s name.")
      .trim()
      .min(1, "Enter the groom’s name.")
      .max(80, "That name is too long."),
    startDate: calendarDate,
    endDate: calendarDate,
    relation: z.enum(["bride", "groom"], {
      error: "Choose the bride or the groom.",
    }),
    idempotencyKey: z.uuid("Check the wedding."),
  })
  .refine((value) => value.endDate >= value.startDate, {
    error: "The last day is before the first day.",
    path: ["endDate"],
  });

const personName = (empty: string) =>
  z.string(empty).trim().min(1, empty).max(80, "That name is too long.");

const coupleFields = z
  .object({
    brideName: personName("Enter the bride’s name."),
    groomName: personName("Enter the groom’s name."),
    startDate: calendarDate,
    endDate: calendarDate,
  }, { error: "Check the form." })
  .refine((value) => value.endDate >= value.startDate, {
    error: "The last day is before the first day.",
    path: ["endDate"],
  });

const invitationFields = z.object({
  invitationMessage: z
    .string("Enter a message.")
    .trim()
    .max(400, "That message is too long."),
}, { error: "Check the form." });

export function parseWeddingPatch(body: unknown) {
  const record =
    body !== null && typeof body === "object"
      ? (body as Record<string, unknown>)
      : null;
  const invitationOnly =
    record !== null &&
    "invitationMessage" in record &&
    !("brideName" in record) &&
    !("groomName" in record) &&
    !("startDate" in record) &&
    !("endDate" in record);
  if (invitationOnly) {
    const parsed = invitationFields.safeParse(body);
    if (!parsed.success) {
      return { ok: false as const, message: firstIssue(parsed.error) };
    }
    return { ok: true as const, kind: "invitation" as const, data: parsed.data };
  }
  const parsed = coupleFields.safeParse(body);
  if (!parsed.success) {
    return { ok: false as const, message: firstIssue(parsed.error) };
  }
  const withMessage =
    record !== null && "invitationMessage" in record
      ? invitationFields.safeParse(body)
      : null;
  if (withMessage && !withMessage.success) {
    return { ok: false as const, message: firstIssue(withMessage.error) };
  }
  return {
    ok: true as const,
    kind: "couple" as const,
    data: withMessage?.success
      ? { ...parsed.data, invitationMessage: withMessage.data.invitationMessage }
      : parsed.data,
  };
}

function isCalendarDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function firstIssue(error: z.ZodError) {
  return error.issues[0]?.message ?? "Check the form.";
}

export function readPage(url: URL) {
  const page = url.searchParams.has("page")
    ? Number(url.searchParams.get("page"))
    : 1;
  const pageSize = url.searchParams.has("pageSize")
    ? Number(url.searchParams.get("pageSize"))
    : 20;
  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > 50
  ) {
    return null;
  }
  return { page, pageSize };
}
