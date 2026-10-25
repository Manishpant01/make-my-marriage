"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { FamilyPage, FamilyMember } from "@/lib/family";
import { requestJson } from "@/lib/client-request";
import { buttonClass } from "@/components/wordmark";
import { toast } from "@/components/toast";

export const quietAction = "inline-flex min-h-11 items-center justify-center rounded-sm px-2 text-[14px] text-muted transition-colors hover:text-bronze focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze disabled:opacity-50";
export function titleCase(text: string) { return text.charAt(0).toUpperCase() + text.slice(1); }

export function FamilyPanel({ weddingId, initial, admin }: { weddingId: string; initial: FamilyPage; admin: boolean }) {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const [removing, setRemoving] = useState<FamilyMember | null>(null);
  const familyUrl = `/api/weddings/${weddingId}/members`;
  async function run(work: () => Promise<void>) {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError(""); setNotice("");
    try { await work(); } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Something went wrong. Try again.";
      setError(message); toast.error(message);
    } finally { locked.current = false; setBusy(false); }
  }
  async function load(page: number) { setData(await requestJson<FamilyPage>(`${familyUrl}?page=${page}`)); }
  return <section aria-labelledby="family-title">
    <div className="mb-7 flex flex-wrap items-start justify-between gap-4 lg:mb-9">
      <div><h1 id="family-title" className="text-[28px] font-medium lg:text-[32px]">Family</h1>
        <p className="mt-2 text-[15px] text-muted">The people planning the wedding together.</p></div>
      <Link href={`/home/${weddingId}?section=invite-family`} data-wedding-section="invite-family" className={`${buttonClass} min-h-11 w-full px-5 text-[14px] sm:w-auto`}>Invite family</Link>
    </div>
    {error && <p role="alert" className="mb-5 rounded-lg bg-danger-soft p-4 text-[14px] text-danger">{error}</p>}
    {notice && <p role="status" className="mb-5 text-[14px]">{notice}</p>}
    <div className="xl:overflow-hidden xl:rounded-lg xl:border xl:border-line xl:bg-surface">
      <div className={`hidden gap-4 border-b border-line px-6 py-4 text-[13px] font-medium text-muted xl:grid ${admin ? "grid-cols-[minmax(0,2.3fr)_1fr_0.8fr_1.2fr_0.7fr]" : "grid-cols-[minmax(0,2.3fr)_1fr_0.8fr_1.2fr]"}`} aria-hidden="true">
        <span>Person</span><span>Relation</span><span>Role</span><span>Status</span>{admin && <span className="text-right">Actions</span>}
      </div>
      <ul className="space-y-3 xl:space-y-0 xl:divide-y xl:divide-line">{data.items.map(member => <li key={member.id} className={`grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-4 rounded-lg border border-line bg-surface px-5 py-5 text-[14px] xl:items-center xl:gap-4 xl:rounded-none xl:border-0 xl:px-6 ${admin ? "xl:grid-cols-[minmax(0,2.3fr)_1fr_0.8fr_1.2fr_0.7fr]" : "xl:grid-cols-[minmax(0,2.3fr)_1fr_0.8fr_1.2fr]"}`}>
        <div className="order-1 min-w-0 xl:order-none"><p className="wrap-anywhere font-medium text-[16px]">{member.name}</p><p className="mt-1 wrap-anywhere text-muted">{member.email}</p></div>
        <div className="order-3 border-t border-line pt-4 xl:order-none xl:border-0 xl:pt-0"><span className="text-muted xl:hidden">Relation: </span>{titleCase(member.relation)}</div>
        <div className="order-2 text-right xl:order-none xl:text-left"><span className={member.role === "admin" ? "inline-block rounded border border-line px-2 py-0.5 text-bronze xl:border-0 xl:p-0" : "text-muted xl:text-ink"}>{titleCase(member.role)}</span></div>
        <div className="order-4 border-t border-line pt-4 text-right xl:order-none xl:border-0 xl:pt-0 xl:text-left"><p className="flex items-center justify-end gap-2 xl:justify-start"><span aria-hidden="true" className={`size-1.5 rounded-full ${member.joined ? "bg-success" : "bg-bronze"}`} />{member.joined ? "Joined" : "Pending"}</p>
          {!member.joined && <p className="mt-1 text-[12px] text-muted">Not yet accepted</p>}
          {!member.joined && member.emailStatus && <p className={`mt-1 text-[12px] ${member.emailStatus === "failed" ? "text-danger" : "text-muted"}`}>{member.emailStatus === "sent" ? "Email sent" : member.emailStatus === "failed" ? "Email not sent" : "Email pending"}</p>}
        </div>
        {admin && <div className={`order-5 col-span-2 text-right xl:order-none xl:col-span-1 ${member.role === "helper" ? "border-t border-line pt-2 xl:border-0 xl:pt-0" : "hidden xl:block"}`}>{member.role === "helper" ? <button className={`${quietAction} gap-1`} disabled={busy} onClick={() => setRemoving(member)}>Remove<span className="xl:hidden">helper</span></button> : <span aria-label="Admin cannot be removed" className="hidden text-muted xl:inline">—</span>}</div>}
      </li>)}</ul>
    </div>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[13px] text-muted">
      <p>Pending means the invitation is awaiting acceptance.</p>
      {data.total > data.pageSize && <div className="flex items-center gap-2"><button className={quietAction} disabled={busy || data.page <= 1} onClick={() => void run(() => load(data.page - 1))}>Previous</button><span>Page {data.page} of {Math.ceil(data.total / data.pageSize)}</span><button className={quietAction} disabled={busy || data.page * data.pageSize >= data.total} onClick={() => void run(() => load(data.page + 1))}>Next</button></div>}
    </div>
    <div className="mt-5 border-t border-line pt-4"><p className="text-[13px] text-muted">Admins and helpers can invite family helpers. Only admins can invite a partner or remove family.</p>
      <button disabled={busy} className={`${quietAction} mt-2`} onClick={() => void run(async () => {
        const result = await requestJson<{ sent: number; failed: number; pending: number }>(`/api/weddings/${weddingId}/emails/retry`, { method: "POST" });
        setNotice(`${result.sent} email(s) sent. ${result.failed} not sent. ${result.pending} still pending. Already-sent emails are skipped.`);
        await load(data.page);
      })}>{busy ? "Working…" : "Retry unsent emails"}</button>
      <p className="text-[12px] text-muted">{admin ? "Retries up to 50 unsent family invitation emails for this wedding." : "Retries up to 50 unsent helper invitation emails for this wedding. Partner invitations are skipped."}</p>
    </div>
    {removing && <RemovalDialog onCancel={() => { if (!busy) setRemoving(null); }}>
      <h2 id="remove-title" className="text-[18px] font-medium">Remove {removing.name} from this wedding?</h2><p className="mt-3 text-[14px] text-muted">Their account will remain.</p>
      {error && <p role="alert" className="mt-3 text-[14px] text-danger">{error}</p>}
      <div className="mt-5 flex justify-end gap-3"><button autoFocus disabled={busy} className={quietAction} onClick={() => setRemoving(null)}>Cancel</button><button disabled={busy} className={`${buttonClass} min-h-11 px-4 text-[14px]`} onClick={() => void run(async () => {
        await requestJson(`${familyUrl}/${removing.id}`, { method: "DELETE" });
        setRemoving(null); await load(Math.max(1, data.items.length === 1 ? data.page - 1 : data.page));
        toast.success("Helper removed."); router.refresh();
      })}>{busy ? "Removing…" : "Remove helper"}</button></div>
    </RemovalDialog>}
  </section>;
}

function RemovalDialog({ children, onCancel }: { children: ReactNode; onCancel: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  return <dialog ref={dialog} aria-labelledby="remove-title" className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-line bg-surface p-6 text-ink backdrop:bg-ink/20" onCancel={event => { event.preventDefault(); onCancel(); }}>{children}</dialog>;
}
