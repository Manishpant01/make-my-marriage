"use server";

import { redirect } from "next/navigation";
import { endSession } from "@/lib/auth/session";

export async function logout() {
  try {
    await endSession();
  } catch (error) {
    console.error(error);
  }
  redirect("/");
}
