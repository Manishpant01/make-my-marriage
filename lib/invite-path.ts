export function validInviteToken(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{43}$/.test(value);
}

export function invitePath(token: unknown) {
  return validInviteToken(token) ? `/join/${token}` : "/home";
}

export function authInvitePath(path: "/login" | "/signup" | "/forgot-password", token?: string) {
  return validInviteToken(token) ? `${path}?invite=${encodeURIComponent(token)}` : path;
}
