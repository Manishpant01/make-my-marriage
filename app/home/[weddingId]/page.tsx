import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountHeader } from "@/components/account-header";
import { WeddingDashboard } from "@/components/wedding-dashboard";
import { getOptionalUser } from "@/lib/auth/session";
import { getWeddingDashboard } from "@/lib/weddings";

export const metadata: Metadata = {
  title: "The wedding",
};

export default async function WeddingPage({
  params,
  searchParams,
}: {
  params: Promise<{ weddingId: string }>;
  searchParams: Promise<{ section?: string; dates?: string }>;
}) {
  const user = await getOptionalUser();
  if (!user) {
    redirect("/login");
  }
  const { weddingId } = await params;
  const dashboard = await getWeddingDashboard(user._id, weddingId);
  if (!dashboard) {
    redirect("/home");
  }
  const query = await searchParams;
  const asked =
    query.section === "invitation"
      ? "invitation"
      : query.section === "couple" || query.dates === "1"
        ? "couple"
        : null;
  return (
    <div className="flex min-h-screen flex-col">
      <AccountHeader name={user.name} />
      <main className="flex-1">
        <WeddingDashboard
          dashboard={dashboard}
          section={dashboard.role === "admin" ? asked : null}
        />
      </main>
    </div>
  );
}
