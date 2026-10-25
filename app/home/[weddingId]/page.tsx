import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountHeader } from "@/components/account-header";
import { WeddingDashboard } from "@/components/wedding-dashboard";
import { getOptionalUser } from "@/lib/auth/session";
import { getWeddingDashboard } from "@/lib/weddings";
import { FamilyPanel } from "@/components/family-panel";
import { InviteFamilyForm } from "@/components/invite-family-form";
import { familyAccess, listFamily, safeMember, type MemberDoc } from "@/lib/family";

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
  const asked = query.section === "family" ? "family" : query.section === "invite-family" ? "invite-family" :
    query.section === "invitation"
      ? "invitation"
      : query.section === "couple" || query.dates === "1"
        ? "couple"
        : null;
  const section = asked === "family" || asked === "invite-family" || dashboard.role === "admin" ? asked : null;
  let familyPanel;
  if (section === "family") familyPanel = <FamilyPanel weddingId={weddingId} initial={await listFamily(user._id, weddingId)} admin={dashboard.role === "admin"} />;
  if (section === "invite-family") {
    const { db, id, member } = await familyAccess(user._id, weddingId);
    const canInvitePartner = member.role === "admin";
    const relation = canInvitePartner ? member.relation === "bride" ? "groom" : "bride" : null;
    const partner = canInvitePartner ? await db.collection<MemberDoc>("memberships").findOne({ weddingId: id, role: "admin", relation: relation! }) : null;
    familyPanel = <InviteFamilyForm weddingId={weddingId} canInvitePartner={canInvitePartner} partnerRelation={relation} partnerName={relation === "bride" ? dashboard.brideName : relation === "groom" ? dashboard.groomName : ""} existingPartner={partner ? safeMember(partner) : null} ownEmail={user.email} />;
  }
  return (
    <div className="flex min-h-screen flex-col">
      <AccountHeader name={user.name} />
      <main className="flex-1">
        <WeddingDashboard
          dashboard={dashboard}
          section={section}
          familyPanel={familyPanel}
        />
      </main>
    </div>
  );
}
