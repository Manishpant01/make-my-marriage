"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import type { EventPage, PlannedEvent } from "@/lib/events";
import { createEventSchema, eventInputError } from "@/lib/event-input";
import { requestJson } from "@/lib/client-request";
import { buttonClass, fieldClass } from "@/components/wordmark";
import { quietAction } from "@/components/family-panel";
import { EventDialog } from "@/components/event-dialog";
import { Entrance } from "@/components/entrance";
import { toast } from "@/components/toast";
import { blockHistoryNavigation } from "@/lib/navigation-history";

function showDate(date: string) {
  if (!date) return "Not set";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}
function showTime(time: string) {
  if (!time) return "Not set";
  const [hour, minute] = time.split(":").map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "pm" : "am"} IST`;
}
function message(error: unknown) { return error instanceof Error ? error.message : "Something went wrong. Try again."; }

export function EventsPanel({ weddingId, context, initial, loadError = "", view, event, eventMissing = false }: {
  weddingId: string; context: string; initial: EventPage | null; loadError?: string;
  view?: string; event?: PlannedEvent | null; eventMissing?: boolean;
}) {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [error, setError] = useState(loadError);
  const [busy, setBusy] = useState(false);
  const [animateRows, setAnimateRows] = useState(true);
  const lock = useRef(false);
  const [reorder, setReorder] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [retryMove, setRetryMove] = useState<{ id: string; order: number; name: string } | null>(null);
  const base = `/home/${weddingId}?section=events`;
  const endpoint = `/api/weddings/${weddingId}/events`;
  const page = data?.page ?? 1;
  async function load(number: number) {
    const loaded = await requestJson<EventPage>(`${endpoint}?page=${number}`);
    setAnimateRows(false);
    setData(loaded);
  }
  async function run(work: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError("");
    try { await work(); } catch (caught) { setError(message(caught)); toast.error(message(caught)); }
    finally { lock.current = false; setBusy(false); }
  }
  async function move(id: string, order: number, name: string) {
    await run(async () => {
      setRetryMove({ id, order, name });
      await requestJson(`${endpoint}/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order }) });
      setRetryMove(null);
      await load(page);
      setAnnouncement(`${name} moved to position ${order}.`);
      toast.success("Event order saved."); router.refresh();
    });
  }
  if (view) {
    const editorData = data ?? initial;
    if ((view !== "new" && !event) || !editorData) return <section><h1 className="text-[28px] font-medium">{eventMissing ? "Event unavailable" : "Unable to load event"}</h1><p role="alert" className="mt-4 text-[15px] text-muted">{error || "That event may have been removed."}</p><div className="mt-5 flex gap-3">{!eventMissing && <button className={`${buttonClass} min-h-11 px-5`} onClick={() => router.refresh()}>Try again</button>}<Link href={base} data-wedding-section="events" className={quietAction}>Back to events</Link></div></section>;
    return <EventEditor weddingId={weddingId} event={event ?? null} page={editorData.page} total={editorData.total} context={context} />;
  }
  return <section aria-labelledby="events-title">
    <div className="mb-7 flex flex-col justify-between gap-5 lg:mb-9 sm:flex-row sm:items-end">
      <div><p className="mb-2 text-[13px] tabular-nums text-muted">{context}</p><h1 id="events-title" className="text-[28px] font-medium lg:text-[32px]">{reorder ? "Reorder events" : "Events"}</h1><p className="mt-2 text-[15px] text-muted">{reorder ? "Moves save automatically." : "Plan the days, in your order."}</p></div>
      <div className="flex items-center gap-3">{reorder ? <button disabled={busy} className={`${buttonClass} min-h-12 px-6`} onClick={() => { setReorder(false); setRetryMove(null); setError(""); }}>Done</button> : <>
        <button disabled={busy || !data || data.total < 2} className={`${quietAction} min-h-12 flex-1 border border-line px-5 sm:flex-none`} onClick={() => setReorder(true)}>Reorder</button>
        <Link href={`${base}&event=new&page=${page}`} data-wedding-section="event-editor:new" className={`${buttonClass} min-h-12 flex-1 px-5 text-[15px] sm:flex-none`}>+ Add event</Link>
      </>}</div>
    </div>
    {error && <div role="alert" className="mb-5 rounded-lg border border-danger bg-danger-soft p-4 text-[14px] text-danger"><p>{retryMove ? "The order couldn't be saved. " : ""}{error}</p><button disabled={busy} className={`${quietAction} mt-2 text-danger`} onClick={() => void (retryMove ? move(retryMove.id, retryMove.order, retryMove.name) : run(() => load(page)))}>Try again</button></div>}
    {busy && <p role="status" className="mb-4 text-[14px] text-muted">{reorder ? "Saving order…" : "Loading events…"}</p>}
    <p role="status" aria-live="polite" className="sr-only">{announcement}</p>
    {!data ? null : data.total === 0 ? <div className="rounded-lg border border-line bg-surface px-5 py-14 text-center"><h2 className="text-[22px] font-medium">No events yet</h2><p className="mt-2 text-[15px] text-muted">Add the first event to start your schedule.</p><Link href={`${base}&event=new`} data-wedding-section="event-editor:new" className={`${buttonClass} mt-6 min-h-12 px-6`}>Add event</Link></div> : <>
      <div className="xl:overflow-hidden xl:rounded-lg xl:border xl:border-line xl:bg-surface">
        {!reorder && <div aria-hidden="true" className="hidden grid-cols-[2rem_minmax(0,2fr)_1fr_1fr_minmax(0,1.3fr)_3rem] gap-4 border-b border-line px-5 py-4 text-[12px] font-medium text-muted xl:grid"><span>#</span><span>Event name</span><span>Date</span><span>Time</span><span>Venue</span><span>Edit</span></div>}
        <ol className="space-y-3 xl:space-y-0 xl:divide-y xl:divide-line" start={(page - 1) * data.pageSize + 1}>
          {data.items.map((item, index) => <Entrance as="li" key={item.id} duration={animateRows ? 0.22 : 0} delay={animateRows ? Math.min(index * 0.04, 0.24) : 0} className={`rounded-lg border border-line bg-surface p-4 xl:rounded-none xl:border-0 xl:px-5 xl:py-5 ${reorder ? "flex flex-wrap items-center justify-between gap-3" : "xl:grid xl:grid-cols-[2rem_minmax(0,2fr)_1fr_1fr_minmax(0,1.3fr)_3rem] xl:items-center xl:gap-4"}`}>
            {reorder ? <>
              <div className="flex min-w-0 flex-1 items-center gap-4"><span className="shrink-0 text-[14px] tabular-nums text-bronze">{item.order}</span><div className="min-w-0"><h2 className="wrap-anywhere text-[16px] font-medium">{item.name}</h2><p className="mt-1 text-[13px] text-muted">{showDate(item.date)}</p></div></div>
              <div className="flex gap-2"><button disabled={busy || item.order === 1} aria-label={`Move ${item.name} up`} className={`${quietAction} border border-line px-3`} onClick={() => void move(item.id, item.order - 1, item.name)}>↑ Up</button><button disabled={busy || item.order === data.total} aria-label={`Move ${item.name} down`} className={`${quietAction} border border-line px-3`} onClick={() => void move(item.id, item.order + 1, item.name)}>↓ Down</button></div>
            </> : <>
              <span className="hidden text-[14px] tabular-nums text-bronze xl:block">{String(item.order).padStart(2, "0")}</span>
              <div className="mb-4 flex items-start justify-between gap-3 xl:mb-0"><h2 className="min-w-0 wrap-anywhere text-[17px] font-medium"><span className="mr-3 text-[14px] tabular-nums text-bronze xl:hidden">{item.order}</span>{item.name}</h2><Link href={`${base}&event=${item.id}&page=${page}`} data-wedding-section={`event-editor:${item.id}`} aria-label={`Edit ${item.name}`} className={`${quietAction} -mt-2 text-bronze xl:hidden`}>Edit</Link></div>
              <p className="py-1 text-[14px] xl:py-0"><span className="text-muted xl:hidden">Date: </span><span className={item.date ? "" : "text-muted"}>{showDate(item.date)}</span></p>
              <p className="py-1 text-[14px] xl:py-0"><span className="text-muted xl:hidden">Time: </span><span className={item.time ? "" : "text-muted"}>{showTime(item.time)}</span></p>
              <p className="min-w-0 wrap-anywhere py-1 text-[14px] xl:py-0"><span className="text-muted xl:hidden">Venue: </span><span className={item.venueName ? "" : "text-muted"}>{item.venueName || "Not set"}</span></p>
              <div className="hidden xl:block"><Link href={`${base}&event=${item.id}&page=${page}`} data-wedding-section={`event-editor:${item.id}`} aria-label={`Edit ${item.name}`} className={`${quietAction} text-bronze`}>Edit</Link></div>
            </>}
          </Entrance>)}
        </ol>
      </div>
      {data.total > data.pageSize && <div className="mt-5 flex items-center justify-between gap-3 text-[13px] text-muted"><button disabled={busy || page === 1} className={quietAction} onClick={() => void run(() => load(page - 1))}>Previous</button><span>Page {page} of {Math.ceil(data.total / data.pageSize)}</span><button disabled={busy || page * data.pageSize >= data.total} className={quietAction} onClick={() => void run(() => load(page + 1))}>Next</button></div>}
    </>}
  </section>;
}

type Draft = { name: string; date: string; time: string; venueName: string; latitude: string; longitude: string };
function EventEditor({ weddingId, event, page, total, context }: { weddingId: string; event: PlannedEvent | null; page: number; total: number; context: string }) {
  const router = useRouter();
  const [original] = useState<Draft>(() => ({ name: event?.name ?? "", date: event?.date ?? "", time: event?.time ?? "", venueName: event?.venueName ?? "", latitude: event?.latitude?.toString() ?? "", longitude: event?.longitude?.toString() ?? "" }));
  const [draft, setDraft] = useState(original);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const lock = useRef(false);
  const saveKey = useRef<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [leave, setLeave] = useState<{ proceed: () => void } | null>(null);
  const dirty = JSON.stringify(original) !== JSON.stringify(draft);
  const bypass = useRef(false);
  const base = `/home/${weddingId}?section=events`;
  const back = `${base}&page=${page}`;
  const go = useCallback((href: string) => { bypass.current = true; router.push(href, { scroll: false }); router.refresh(); }, [router]);
  useEffect(() => {
    if (!dirty) return;
    function unload(e: BeforeUnloadEvent) { if (!bypass.current) { e.preventDefault(); e.returnValue = ""; } }
    function click(e: MouseEvent) {
      if (bypass.current || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = e.target instanceof Element ? e.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!link || link.target === "_blank" || link.hasAttribute("download") || link.href === location.href) return;
      if (new URL(link.href).origin !== location.origin) return;
      e.preventDefault(); e.stopImmediatePropagation();
      if (!lock.current) setLeave({ proceed: () => go(link.href) });
    }
    window.addEventListener("beforeunload", unload);
    window.addEventListener("click", click, true);
    const unblock = blockHistoryNavigation(proceed => {
      if (bypass.current) proceed();
      else if (!lock.current) setLeave({ proceed: () => { bypass.current = true; proceed(); } });
    });
    return () => { unblock(); window.removeEventListener("beforeunload", unload); window.removeEventListener("click", click, true); };
  }, [dirty, go]);
  function cancel() { if (dirty) setLeave({ proceed: () => go(back) }); else go(back); }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (lock.current) return;
    const parsed = createEventSchema.safeParse({ name: draft.name, date: draft.date || null, time: draft.time || null, venueName: draft.venueName.trim() || null,
      latitude: draft.latitude.trim() === "" ? null : Number(draft.latitude), longitude: draft.longitude.trim() === "" ? null : Number(draft.longitude) });
    if (!parsed.success) { setError(eventInputError(parsed.error)); return; }
    lock.current = true; setPending(true); setError("");
    saveKey.current ??= crypto.randomUUID();
    try {
      await requestJson(`/api/weddings/${weddingId}/events${event ? `/${event.id}` : ""}`, { method: event ? "PATCH" : "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": saveKey.current }, body: JSON.stringify(parsed.data) });
      toast.success(event ? "Event updated." : "Event added.");
      go(`${base}&page=${event ? page : Math.max(1, Math.ceil((total + 1) / 20))}`);
    } catch (caught) { setError(message(caught)); toast.error(message(caught)); }
    finally { lock.current = false; setPending(false); }
  }
  return <section aria-labelledby="event-editor-title">
    <button type="button" disabled={pending} className={`${quietAction} mb-5 pl-0`} onClick={cancel}>← Back to events</button>
    <div className="rounded-lg border border-line bg-surface p-5 sm:p-8">
      <p className="mb-2 text-[13px] text-muted">{context}</p><h1 id="event-editor-title" className="mb-7 wrap-anywhere text-[28px] font-medium lg:text-[32px]">{event ? "Edit event" : "Add event"}</h1>
      <form onSubmit={submit} className="space-y-6">
        <label className="block text-[14px] font-medium">Event name <span className="text-danger">*</span><input autoFocus name="name" required maxLength={120} value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} className={`${fieldClass} mt-2 font-normal`} /></label>
        <div className="grid gap-5 sm:grid-cols-2">{(["date", "time"] as const).map(field => <label key={field} className="block min-w-0 text-[14px] font-medium">{field === "date" ? "Date" : "Time"}<input name={field} type={field} value={draft[field]} onChange={e => setDraft({ ...draft, [field]: e.target.value })} className={`${fieldClass} mt-2 font-normal`} />{draft[field] && <button type="button" disabled={pending} className={`${quietAction} px-0 text-[13px]`} onClick={() => setDraft({ ...draft, [field]: "" })}>Clear {field}</button>}</label>)}</div>
        <p className="text-[13px] text-muted">Times are in India Standard Time (IST).</p>
        <fieldset className="space-y-4 rounded-lg border border-line p-4 sm:p-5"><legend className="px-1 text-[15px] font-medium">Venue (optional)</legend><p className="text-[13px] text-muted">When adding a location, enter its name and both coordinates. Latitude: −90 to 90. Longitude: −180 to 180.</p>
          <label className="block text-[14px] font-medium">Venue name<input name="venueName" maxLength={200} value={draft.venueName} onChange={e => setDraft({ ...draft, venueName: e.target.value })} className={`${fieldClass} mt-2 font-normal`} /></label>
          <div className="grid gap-5 sm:grid-cols-2">{(["latitude", "longitude"] as const).map(field => <label key={field} className="block text-[14px] font-medium">{field === "latitude" ? "Latitude" : "Longitude"}<input name={field} type="number" inputMode="decimal" step="any" min={field === "latitude" ? -90 : -180} max={field === "latitude" ? 90 : 180} value={draft[field]} onChange={e => setDraft({ ...draft, [field]: e.target.value })} className={`${fieldClass} mt-2 font-normal tabular-nums`} /></label>)}</div>
          {(draft.venueName || draft.latitude || draft.longitude) && <button type="button" disabled={pending} className={`${quietAction} px-0`} onClick={() => setDraft({ ...draft, venueName: "", latitude: "", longitude: "" })}>Clear venue</button>}
        </fieldset>
        {error && <p role="alert" className="rounded-lg bg-danger-soft p-4 text-[14px] text-danger">{error} Your entries are kept; correct them or try saving again.</p>}
        <div className="flex flex-col gap-3 sm:flex-row"><button disabled={pending} className={`${buttonClass} min-h-12 min-w-40 px-6`}>{pending ? event ? "Saving…" : "Adding…" : event ? "Save changes" : "Add event"}</button><button disabled={pending} type="button" className={quietAction} onClick={cancel}>Cancel</button></div>
      </form>
      {event && <div className="mt-8 border-t border-line pt-4"><button disabled={pending} type="button" className={`${quietAction} text-danger`} onClick={() => { setError(""); setDeleting(true); }}>Delete event</button></div>}
    </div>
    {leave && <EventDialog title="Discard unsaved changes?" onCancel={() => setLeave(null)}><p className="mt-3 text-[14px] text-muted">Your changes to this event have not been saved.</p><div className="mt-6 flex flex-wrap justify-end gap-3"><button autoFocus className={quietAction} onClick={() => setLeave(null)}>Keep editing</button><button className={`${buttonClass} min-h-11 px-5`} onClick={() => leave.proceed()}>Discard changes</button></div></EventDialog>}
    {deleting && event && <EventDialog title={`Delete ${event.name}?`} onCancel={() => { if (!pending) setDeleting(false); }}><p className="mt-3 text-[14px] leading-relaxed text-muted">This removes {event.name} from the schedule and from guest invitations. Replies for this event will also be removed. Guests and the other events will stay.</p>{error && <p role="alert" className="mt-4 text-[14px] text-danger">{error}</p>}<div className="mt-6 flex flex-wrap justify-end gap-3"><button autoFocus disabled={pending} className={quietAction} onClick={() => setDeleting(false)}>Keep event</button><button disabled={pending} className={`${buttonClass} min-h-11 bg-danger px-5 hover:bg-danger`} onClick={async () => {
      if (lock.current) return;
      lock.current = true; setPending(true); setError("");
      try { await requestJson(`/api/weddings/${weddingId}/events/${event.id}`, { method: "DELETE" }); toast.success("Event deleted."); go(`${base}&page=${Math.max(1, Math.min(page, Math.ceil((total - 1) / 20)))}`); }
      catch (caught) { setError(message(caught)); toast.error(message(caught)); }
      finally { lock.current = false; setPending(false); }
    }}>{pending ? "Deleting…" : "Delete event"}</button></div></EventDialog>}
  </section>;
}
