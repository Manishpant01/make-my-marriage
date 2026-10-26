import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountHeader } from "@/components/account-header";
import { WeddingDashboard } from "@/components/wedding-dashboard";
import { getOptionalUser } from "@/lib/auth/session";
import { getWeddingDashboard } from "@/lib/weddings";
import { FamilyPanel } from "@/components/family-panel";
import { InviteFamilyForm } from "@/components/invite-family-form";
import { familyAccess, listFamily, safeMember, type MemberDoc } from "@/lib/family";
import { EventsPanel } from "@/components/events-panel";
import { getEvent, listEvents, type EventPage, type PlannedEvent } from "@/lib/events";
import { formatWeddingDates } from "@/lib/weddings";
import { RequestError } from "@/lib/errors";

export const metadata: Metadata = {
  title: "The wedding",
};

export default async function WeddingPage({
  params,
  searchParams,
}: {
  params: Promise<{ weddingId: string }>;
  searchParams: Promise<{ section?: string; dates?: string; event?: string; page?: string }>;
}) {
  const user = await getOptionalUser();
  if (!user) {
    redirect("/login");
  }
  const { weddingId } = await params;
  const query = await searchParams;
  const dashboard = await getWeddingDashboard(user._id, weddingId, { skipEvents: query.section === "events" });
  if (!dashboard) {
    redirect("/home");
  }
  const asked = query.section === "events" ? "events" : query.section === "family" ? "family" : query.section === "invite-family" ? "invite-family" :
    query.section === "invitation"
      ? "invitation"
      : query.section === "couple" || query.dates === "1"
        ? "couple"
        : null;
  const section = asked === "events" || asked === "family" || asked === "invite-family" || dashboard.role === "admin" ? asked : null;
  let familyPanel;
  if (section === "family") familyPanel = <FamilyPanel weddingId={weddingId} initial={await listFamily(user._id, weddingId)} admin={dashboard.role === "admin"} />;
  if (section === "invite-family") {
    const { db, id, member } = await familyAccess(user._id, weddingId);
    const canInvitePartner = member.role === "admin";
    const relation = canInvitePartner ? member.relation === "bride" ? "groom" : "bride" : null;
    const partner = canInvitePartner ? await db.collection<MemberDoc>("memberships").findOne({ weddingId: id, role: "admin", relation: relation! }) : null;
    familyPanel = <InviteFamilyForm weddingId={weddingId} canInvitePartner={canInvitePartner} partnerRelation={relation} partnerName={relation === "bride" ? dashboard.brideName : relation === "groom" ? dashboard.groomName : ""} existingPartner={partner ? safeMember(partner) : null} ownEmail={user.email} />;
  }
  let eventsPanel;
  if (section === "events") {
    const requestedPage = Number(query.page ?? 1);
    const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, 1_000_000) : 1;
    let initial: EventPage | null = null, event: PlannedEvent | null = null;
    let loadError = "", eventMissing = false;
    try {
      initial = await listEvents(user._id, weddingId, page);
      if (initial.total > 0 && initial.items.length === 0) initial = await listEvents(user._id, weddingId, Math.ceil(initial.total / 20));
      if (query.event && query.event !== "new") event = await getEvent(user._id, weddingId, query.event);
    } catch (caught) {
      eventMissing = caught instanceof RequestError && caught.status === 404;
      loadError = eventMissing ? "That event was not found. It may have been removed." : "We couldn't load the events. Try again.";
    }
    eventsPanel = <EventsPanel weddingId={weddingId} context={`${dashboard.brideName} and ${dashboard.groomName} · ${formatWeddingDates(dashboard.startDate, dashboard.endDate)}`} initial={initial} event={event} view={query.event} loadError={loadError} eventMissing={eventMissing} />;
  }
  return (
    <div className="flex min-h-screen flex-col">
      <AccountHeader name={user.name} />
      <main className="flex-1">
        <WeddingDashboard
          dashboard={dashboard}
          section={section}
          familyPanel={familyPanel}
          eventsPanel={eventsPanel}
          eventView={query.event}
        />
      </main>
    </div>
  );
}
