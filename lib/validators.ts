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
