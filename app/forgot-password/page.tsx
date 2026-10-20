import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthScreen } from "@/components/auth-screen";
import { ForgotPasswordForm } from "@/components/auth-forms";
import { getOptionalUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Forgot password",
};

export default async function ForgotPasswordPage() {
  if (await getOptionalUser()) {
    redirect("/home");
  }
  return (
    <AuthScreen title="Forgot password">
      <ForgotPasswordForm />
    </AuthScreen>
  );
}
