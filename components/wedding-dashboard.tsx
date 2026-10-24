import Image from "next/image";
import type { ReactNode } from "react";
import { WeddingAnimationScope, WeddingPanel, WeddingSection } from "@/components/wedding-panel";
import { WeddingMotion } from "@/components/wedding-motion";
import { WeddingNavigation, type WeddingNavItem } from "@/components/wedding-navigation";
import { CoupleForm } from "@/components/couple-form";
import { InvitationPanel } from "@/components/invitation-panel";
import { formatRupees, formatWeddingDates, nextEvent } from "@/lib/weddings";
import type { WeddingDashboard } from "@/lib/weddings";

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function WeddingDashboard({
  dashboard,
  section,
}: {
  dashboard: WeddingDashboard;
  section: "couple" | "invitation" | null;
}) {
  const home = `/home/${dashboard.id}`;
  const admin = dashboard.role === "admin";
  const items: WeddingNavItem[] = [
    { label: "Dashboard", href: home },
    { label: "Guests" },
    { label: "Events" },
    { label: "Tasks" },
    { label: "Expenses" },
    { label: "Family" },
    { label: "Invite family", note: "Admins" },
    { label: "Photos" },
    {
      label: "Invitation",
      note: "Admins",
      href: admin ? `${home}?section=invitation` : undefined,
    },
    {
      label: "Couple",
      note: "Admins",
      href: admin ? `${home}?section=couple` : undefined,
    },
    { label: "Wedding website" },
    { label: "Live stream", note: "Admins" },
    { label: "Weddings", href: "/home" },
  ];
  const next = nextEvent(dashboard.events, todayInIndia());
  const later = dashboard.events.filter((event) => event.id !== next?.id);
  const spentShare =
    dashboard.budget > 0
      ? Math.min(100, (dashboard.spent / dashboard.budget) * 100)
      : 0;

  return (
    <WeddingAnimationScope>
    <WeddingMotion key={dashboard.id} section={section ?? "dashboard"}>
    <div className="mx-auto w-full max-w-[1440px] px-5 pt-4 pb-16 lg:px-10 lg:pt-10">
      <WeddingNavigation items={items} section={section ?? "dashboard"}
        className="mb-4 flex flex-wrap gap-x-5 gap-y-0 text-[14px] lg:hidden" />
      <div className="lg:flex lg:items-start lg:gap-14">
        <WeddingNavigation items={items} section={section ?? "dashboard"}
          className="hidden w-[200px] shrink-0 flex-col gap-1 pt-0.5 text-[15px] lg:flex" />
        <WeddingSection key={`${dashboard.id}:${section ?? "dashboard"}`}>
          {section === "couple" ? (
            <WeddingPanel>
            <CoupleForm
              key={`${dashboard.brideName}|${dashboard.groomName}|${dashboard.startDate}|${dashboard.endDate}`}
              weddingId={dashboard.id}
              brideName={dashboard.brideName}
              groomName={dashboard.groomName}
              startDate={dashboard.startDate}
              endDate={dashboard.endDate}
            />
            </WeddingPanel>
          ) : section === "invitation" ? (
            <InvitationPanel
              weddingId={dashboard.id}
              brideName={dashboard.brideName}
              groomName={dashboard.groomName}
              datesLabel={formatWeddingDates(
                dashboard.startDate,
                dashboard.endDate,
              )}
              message={dashboard.invitationMessage}
              events={dashboard.events}
            />
          ) : (
            <>
          <WeddingPanel className="mb-6 flex flex-col gap-1 lg:mb-8 lg:flex-row lg:items-baseline lg:justify-between">
            <h1 className="min-w-0 wrap-anywhere font-display text-[30px] font-medium leading-[1.2] tracking-[-0.02em] lg:text-[38px]">
              {dashboard.brideName} and {dashboard.groomName}
            </h1>
            <p className="shrink-0 text-[14px] tabular-nums text-muted lg:text-[16px]">
              {formatWeddingDates(dashboard.startDate, dashboard.endDate)}
            </p>
          </WeddingPanel>
          <WeddingPanel delay={0.04} className="overflow-hidden rounded-lg border border-line bg-surface lg:flex">
            <div className="relative h-48 lg:h-auto lg:min-h-[220px] lg:w-[40%] lg:self-stretch">
              <Image
                src="/dashboard-mehendi.jpg"
                alt="Mehendi and marigolds at a wedding ritual"
                fill
                priority
                sizes="(min-width: 1024px) 420px, 100vw"
                className="object-cover"
              />
            </div>
            <div className="flex flex-col justify-center p-4 lg:w-[60%] lg:p-8">
              {next ? (
                <>
                  <span className="text-[13px] text-muted lg:text-[14px]">
                    Next
                  </span>
                  <h2 className="mt-1 text-[22px] font-normal lg:text-[24px]">
                    {next.name}
                  </h2>
                  <p className="mt-0.5 text-[14px] text-muted lg:text-[15px]">
                    {eventWhen(next, "long")}
                  </p>
                </>
              ) : (
                <p className="text-[15px] text-muted">No events yet.</p>
              )}
              {later.length > 0 ? (
                <div className="mt-4 space-y-2.5 border-t border-line pt-4 text-[14px] lg:text-[15px]">
                  {later.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between gap-4"
                    >
                      <span>{event.name}</span>
                      <span className="shrink-0 text-muted">
                        {eventWhen(event, "short")}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
              <p className="mt-4 border-t border-line pt-3 text-[14px] text-muted">
                Add an event
              </p>
            </div>
          </WeddingPanel>
          <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:mt-6 xl:grid-cols-5 lg:gap-4">
            <Summary delay={0.08} label="Guests" value={String(dashboard.guests)} note="Invited" />
            <Summary
              delay={0.12}
              label="Events"
              value={String(dashboard.events.length)}
              note="On the schedule"
            />
            <Summary
              delay={0.16}
              label="Tasks"
              value={String(dashboard.openTasks)}
              note="Open"
            />
            <Summary
              delay={0.20}
              label="Expenses"
              value={formatRupees(dashboard.spent)}
              note="Spent"
            />
            <Summary delay={0.24} label="Family" value={String(dashboard.family)} note="Helping">
              <p className="mt-2 flex items-center justify-between border-t border-line pt-2 text-[12px] text-muted">
                <span>Invite family</span>
                <span className="text-[10px] font-medium tracking-[0.06em] uppercase">Admins</span>
              </p>
            </Summary>
          </section>
          <section className="mt-4 grid gap-4 lg:mt-6 xl:grid-cols-3 lg:gap-6">
            <Detail title="Guests">
              <DetailRow label="Yes" value={String(dashboard.yes)} />
              <DetailRow label="No" value={String(dashboard.no)} divided />
              <DetailRow
                label="Waiting"
                value={String(dashboard.waiting)}
                divided
              />
            </Detail>
            <Detail title="Tasks">
              {dashboard.tasks.length === 0 ? (
                <p className="text-[14px] text-muted lg:text-[15px]">
                  No tasks yet.
                </p>
              ) : (
                dashboard.tasks.map((task, index) => (
                  <DetailRow
                    key={task.id}
                    label={task.title}
                    value={task.assignee}
                    divided={index > 0}
                    mutedValue
                  />
                ))
              )}
            </Detail>
            <Detail title="Expenses">
              <DetailRow label="Budget" value={formatRupees(dashboard.budget)} />
              <DetailRow
                label="Spent"
                value={formatRupees(dashboard.spent)}
                divided
              />
              <DetailRow
                label="Still due"
                value={formatRupees(dashboard.stillDue)}
                divided
              />
              <div className="mt-4 h-1 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full bg-bronze"
                  style={{ width: `${spentShare}%` }}
                />
              </div>
            </Detail>
          </section>
            </>
          )}
        </WeddingSection>
      </div>
    </div>
    </WeddingMotion>
    </WeddingAnimationScope>
  );
}

function Summary({
  delay,
  label,
  value,
  note,
  children,
}: {
  delay: number;
  label: string;
  value: string;
  note: string;
  children?: ReactNode;
}) {
  return (
    <WeddingPanel delay={delay} className="@container min-w-0 cursor-default flex flex-col justify-between rounded-lg border border-line bg-surface p-3.5 lg:p-5">
      <div>
        <div className="text-[13px] text-muted lg:text-[14px]">{label}</div>
        <div style={label === "Expenses" ? { fontSize: `min(25px, ${145 / Math.max(value.length, 1)}cqi)` } : undefined} className={`my-1 whitespace-nowrap font-medium leading-tight tabular-nums text-bronze lg:my-2 ${label === "Expenses" ? "tracking-tight" : "text-[26px] lg:text-[28px]"}`}>
          {value}
        </div>
      </div>
      <div className="text-[12px] text-muted lg:text-[14px]">{note}</div>
      {children}
    </WeddingPanel>
  );
}

function Detail({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <WeddingPanel delay={0.28} className="rounded-lg border border-line bg-surface p-4 lg:p-6">
      <h2 className="mb-3 text-[15px] font-medium lg:mb-4 lg:text-[17px]">
        {title}
      </h2>
      <div className="space-y-3 text-[14px] lg:space-y-3.5 lg:text-[15px]">
        {children}
      </div>
    </WeddingPanel>
  );
}

function DetailRow({
  label,
  value,
  divided = false,
  mutedValue = false,
}: {
  label: string;
  value: string;
  divided?: boolean;
  mutedValue?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 ${
        divided ? "border-t border-line pt-3" : ""
      }`}
    >
      <span className="min-w-0">{label}</span>
      <span
        className={`shrink-0 font-medium tabular-nums ${mutedValue ? "font-normal text-muted" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

function eventWhen(
  event: { date: string; time: string },
  length: "long" | "short",
) {
  if (!event.date) {
    return "Date not set";
  }
  const [year, month, day] = event.date.split("-").map(Number);
  const weekday =
    WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()] ?? "";
  const shown = clock(event.time);
  const dayName = length === "short" ? weekday.slice(0, 3) : weekday;
  if (!shown) {
    return formatWeddingDates(event.date, event.date);
  }
  return `${dayName}, ${shown}`;
}

function clock(time: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match) {
    return "";
  }
  const hour = Number(match[1]);
  const suffix = hour >= 12 ? "pm" : "am";
  return `${hour % 12 || 12}:${match[2]} ${suffix}`;
}

function todayInIndia() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(new Date());
}
