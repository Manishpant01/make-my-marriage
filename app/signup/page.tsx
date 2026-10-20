import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthScreen } from "@/components/auth-screen";
import { SignupForm } from "@/components/auth-forms";
import { getOptionalUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Create an account",
};

export default async function SignupPage() {
  if (await getOptionalUser()) {
    redirect("/home");
  }
  return (
    <AuthScreen title="Create an account">
      <SignupForm />
    </AuthScreen>
  );
}
