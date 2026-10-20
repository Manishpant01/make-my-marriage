import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthScreen } from "@/components/auth-screen";
import { LoginForm } from "@/components/auth-forms";
import { getOptionalUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Log in",
};

export default async function LoginPage() {
  if (await getOptionalUser()) {
    redirect("/home");
  }
  return (
    <AuthScreen title="Log in">
      <LoginForm />
    </AuthScreen>
  );
}
