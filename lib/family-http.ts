import { ConfigError, RateLimitError, RequestError, jsonError } from "@/lib/errors";

export { jsonError };
export function familyFailure(error: unknown) {
  if (error instanceof RequestError) return jsonError(error.message, error.status);
  if (error instanceof RateLimitError) return jsonError(error.message, 429);
  if (error instanceof ConfigError) return jsonError("This service is not configured. Try again later.", 503);
  // Database errors can embed whole invite documents. Never log their tokens.
  console.error("Family invitation request failed.");
  return jsonError("We couldn't complete that request. Try again.", 500);
}
