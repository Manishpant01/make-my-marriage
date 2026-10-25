import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test, vi } from "vitest";
import { WeddingDashboard } from "@/components/wedding-dashboard";
import type { WeddingDashboard as DashboardData } from "@/lib/weddings";
import { InviteFamilyForm } from "@/components/invite-family-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

const dashboard: DashboardData = {
  id: "000000000000000000000001",
  brideName: "Anika",
  groomName: "Rohan",
  startDate: "2027-03-12",
  endDate: "2027-03-14",
  publicSlug: "preview",
  invitationMessage: "Join us.",
  role: "admin",
  events: [{ id: "event-1", name: "Wedding ceremony", order: 1, date: "", time: "" }],
  guests: 0, yes: 0, no: 0, waiting: 0,
  openTasks: 0, tasks: [], budget: 0, spent: 0, stillDue: 0, family: 1,
};

test.each([null, "couple", "invitation"] as const)(
  "the %s section stays readable and usable before hydration",
  (section) => {
    const html = renderToStaticMarkup(createElement(WeddingDashboard, { dashboard, section }));
    expect(html).not.toMatch(/opacity:\s*0|visibility:\s*hidden|\sinert(?:=|\s|>)/);
    expect(html).toContain("Dashboard");
    if (section === "couple") {
      expect(html).toContain('name="brideName"');
      expect(html).toContain('value="Anika"');
    } else if (section === "invitation") {
      expect(html).toContain('name="invitationMessage"');
      expect(html).toContain("Join us.");
    } else {
      expect(html).toContain("Anika");
      expect(html).toContain("Wedding ceremony");
    }
  },
);

test("helper navigation opens Invite family while keeping other admin sections restricted", () => {
  const html = renderToStaticMarkup(createElement(WeddingDashboard, { dashboard: { ...dashboard, role: "helper" }, section: null }));
  expect(html).toContain('href="/home/000000000000000000000001?section=invite-family"');
  expect(html).not.toContain('href="/home/000000000000000000000001?section=couple"');
  expect(html).not.toContain('href="/home/000000000000000000000001?section=invitation"');
});

test.each([true, false])("partner invitation controls require admin permission (%s)", canInvitePartner => {
  const html = renderToStaticMarkup(createElement(InviteFamilyForm, {
    weddingId: dashboard.id, canInvitePartner, ownEmail: "person@example.com",
    partnerRelation: canInvitePartner ? "groom" : null, partnerName: canInvitePartner ? "Rohan" : "", existingPartner: null,
  }));
  expect(html).toContain('name="relation"');
  expect(html).toContain('name="email"');
  if (canInvitePartner) expect(html).toContain("Partner <span");
  else { expect(html).not.toContain("Partner <span"); expect(html).toContain("Only admins can invite a partner."); }
});
