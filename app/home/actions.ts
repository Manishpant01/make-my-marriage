"use server";

import { redirect } from "next/navigation";
import { endSession } from "@/lib/auth/session";
import { invitePath } from "@/lib/invite-path";

export async function switchInviteAccount(token: string) {
  try {
    await endSession();
  } catch {
    // endSession clears the cookie even when deleting the stored session fails.
    console.error("Could not remove the stored session while switching accounts.");
  }
  redirect(invitePath(token));
}

export async function logout() {
  try {
    await endSession();
  } catch (error) {
    console.error(error);
  }
  redirect("/");
}
