import { validInviteToken } from "@/lib/invite-path";
import { readInvite } from "@/lib/family";

export async function inviteAuthContext(value: unknown) {
  if (!validInviteToken(value)) return {};
  // Keep the destination even during a temporary lookup failure. Authentication
  // never accepts the invite; Join will revalidate it before granting access.
  try {
    const invite = await readInvite(value);
    return { invite: value, invitedEmail: invite?.email };
  } catch { return { invite: value }; }
}
