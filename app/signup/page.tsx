import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthScreen } from "@/components/auth-screen";
import { SignupForm } from "@/components/auth-forms";
import { getOptionalUser } from "@/lib/auth/session";
import { inviteAuthContext } from "@/lib/invite-auth";
import { invitePath } from "@/lib/invite-path";

export const metadata: Metadata = {
  title: "Create an account",
};

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ invite?: string }> }) {
  const context = await inviteAuthContext((await searchParams).invite);
  if (await getOptionalUser()) {
    redirect(invitePath(context.invite));
  }
  return (
    <AuthScreen title="Create an account">
      <SignupForm {...context} />
    </AuthScreen>
  );
}
