export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export class DuplicateEmailError extends Error {
  constructor() {
    super("An account with this email already exists.");
    this.name = "DuplicateEmailError";
  }
}

export class RateLimitError extends Error {
  constructor() {
    super("Too many attempts. Try again later.");
    this.name = "RateLimitError";
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }
}

export function jsonError(error: string, status: number) {
  return Response.json({ error }, { status });
}

export function authFailure(error: unknown) {
  if (error instanceof RateLimitError) {
    return jsonError(error.message, 429);
  }
  if (error instanceof ForbiddenError) {
    return jsonError(error.message, 403);
  }
  if (error instanceof DuplicateEmailError) {
    return jsonError(error.message, 409);
  }
  if (error instanceof ConfigError) {
    return jsonError("Sign-in is not configured.", 503);
  }
  console.error(error);
  return jsonError("Something went wrong.", 500);
}
