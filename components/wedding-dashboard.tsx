import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
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

type NavItem = {
  label: string;
  note?: string;
  href?: string;
};

export function WeddingDashboard({
  dashboard,
  section,
}: {
  dashboard: WeddingDashboard;
  section: "couple" | "invitation" | null;
}) {
  const home = `/home/${dashboard.id}`;
  const admin = dashboard.role === "admin";
  const items: NavItem[] = [
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
    <div className="mx-auto w-full max-w-[1440px] px-5 py-8 lg:py-10 lg:pr-12 lg:pl-10">
      <nav
        aria-label="Wedding"
        className="mb-8 flex flex-wrap gap-x-5 gap-y-3.5 text-[15px] lg:hidden"
      >
        {items.map((item) => (
          <NavLabel
            key={item.label}
            item={item}
            active={isCurrent(item.label, section)}
          />
        ))}
      </nav>
      <div className="lg:flex lg:items-start lg:gap-14">
        <aside className="hidden w-[200px] shrink-0 flex-col gap-3.5 pt-0.5 text-[15px] lg:flex">
          {items.map((item) => (
            <NavLabel
              key={item.label}
              item={item}
              active={isCurrent(item.label, section)}
            />
          ))}
        </aside>
        <div
          key={section ?? "wedding"}
          className="min-w-0 flex-1 motion-safe:animate-[wedding-rise_180ms_ease-out]"
        >
          {section === "couple" ? (
            <CoupleForm
              key={`${dashboard.brideName}|${dashboard.groomName}|${dashboard.startDate}|${dashboard.endDate}`}
              weddingId={dashboard.id}
              brideName={dashboard.brideName}
              groomName={dashboard.groomName}
              startDate={dashboard.startDate}
              endDate={dashboard.endDate}
            />
          ) : section === "invitation" ? (
            <InvitationPanel
              key={dashboard.invitationMessage}
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
          <div className="mb-6 flex flex-col gap-1 lg:mb-8 lg:flex-row lg:items-baseline lg:justify-between">
            <h1 className="text-[22px] font-normal tracking-tight lg:text-[30px]">
              {dashboard.brideName} and {dashboard.groomName}
            </h1>
            <p className="text-[14px] text-muted lg:text-[16px]">
              {formatWeddingDates(dashboard.startDate, dashboard.endDate)}
            </p>
          </div>
          <section className="overflow-hidden rounded-lg border border-line bg-surface lg:flex">
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
          </section>
          <section className="mt-4 grid grid-cols-2 gap-3 lg:mt-6 lg:grid-cols-5 lg:gap-4">
            <Summary label="Guests" value={String(dashboard.guests)} note="Invited" />
            <Summary
              label="Events"
              value={String(dashboard.events.length)}
              note="On the schedule"
            />
            <Summary
              label="Tasks"
              value={String(dashboard.openTasks)}
              note="Open"
            />
            <Summary
              label="Expenses"
              value={formatRupees(dashboard.spent)}
              note="Spent"
            />
            <Summary label="Family" value={String(dashboard.family)} note="Helping">
              <p className="mt-2 flex items-center justify-between border-t border-line pt-2 text-[12px] text-muted">
                <span>Invite family</span>
                <span>Admins</span>
              </p>
            </Summary>
          </section>
          <section className="mt-4 grid gap-4 lg:mt-6 lg:grid-cols-3 lg:gap-6">
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
        </div>
      </div>
    </div>
  );
}

function isCurrent(label: string, section: "couple" | "invitation" | null) {
  if (label === "Dashboard") {
    return section === null;
  }
  return section !== null && label.toLowerCase() === section;
}

function NavLabel({ item, active }: { item: NavItem; active: boolean }) {
  const note = item.note ? (
    <span className="text-[13px] text-muted">{item.note}</span>
  ) : null;
  const row = "inline-flex items-baseline gap-3";
  if (!item.href) {
    return (
      <span className={`${row} text-muted`}>
        <span>{item.label}</span>
        {note}
      </span>
    );
  }
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`${row} group text-muted transition duration-180 ease-out`}
    >
      <span
        className={`relative inline-block after:absolute after:-bottom-0.5 after:left-0 after:h-px after:bg-bronze after:transition-[width] after:duration-180 after:ease-out ${
          active
            ? "text-ink after:w-full"
            : "after:w-0 motion-safe:group-hover:translate-x-1 group-hover:text-bronze group-hover:after:w-full"
        }`}
      >
        {item.label}
      </span>
      {note}
    </Link>
  );
}

function Summary({
  label,
  value,
  note,
  children,
}: {
  label: string;
  value: string;
  note: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between rounded-lg border border-line bg-surface p-3.5 lg:p-5">
      <div>
        <div className="text-[13px] text-muted lg:text-[14px]">{label}</div>
        <div className="my-1 text-[26px] font-medium leading-tight text-bronze lg:my-2 lg:text-[30px]">
          {value}
        </div>
      </div>
      <div className="text-[12px] text-muted lg:text-[14px]">{note}</div>
      {children}
    </div>
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
    <section className="rounded-lg border border-line bg-surface p-4 lg:p-6">
      <h2 className="mb-3 text-[15px] font-medium lg:mb-4 lg:text-[17px]">
        {title}
      </h2>
      <div className="space-y-3 text-[14px] lg:space-y-3.5 lg:text-[15px]">
        {children}
      </div>
    </section>
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
        className={`shrink-0 font-medium ${mutedValue ? "font-normal text-muted" : ""}`}
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
