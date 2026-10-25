import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthScreen } from "@/components/auth-screen";
import { LoginForm } from "@/components/auth-forms";
import { getOptionalUser } from "@/lib/auth/session";
import { inviteAuthContext } from "@/lib/invite-auth";
import { invitePath } from "@/lib/invite-path";

export const metadata: Metadata = {
  title: "Log in",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ invite?: string }> }) {
  const context = await inviteAuthContext((await searchParams).invite);
  if (await getOptionalUser()) {
    redirect(invitePath(context.invite));
  }
  return (
    <AuthScreen title="Log in">
      <LoginForm {...context} />
    </AuthScreen>
  );
}
