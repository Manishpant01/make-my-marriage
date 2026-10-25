"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { FamilyMember } from "@/lib/family";
import { requestJson } from "@/lib/client-request";
import { buttonClass, fieldClass } from "@/components/wordmark";
import { quietAction, titleCase } from "@/components/family-panel";
import { toast } from "@/components/toast";

export function InviteFamilyForm({ weddingId, partnerRelation, partnerName, existingPartner, ownEmail, canInvitePartner }: {
  weddingId: string; partnerRelation: "bride" | "groom" | null; partnerName: string; existingPartner: FamilyMember | null; ownEmail: string; canInvitePartner: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"helper" | "admin">("helper");
  const [pending, setPending] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ member: FamilyMember; email: { status: string } } | null>(null);
  const [retryNote, setRetryNote] = useState("");
  const family = `/home/${weddingId}?section=family`;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    if (email === ownEmail.toLowerCase()) { setError("You are already part of this wedding."); return; }
    lock.current = true; setPending(true); setError("");
    try {
      const created = await requestJson<{ member: FamilyMember; email: { status: string } }>(`/api/weddings/${weddingId}/invites`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: String(form.get("name") ?? "").trim(), email, role: canInvitePartner ? mode : "helper", relation: canInvitePartner && mode === "admin" ? partnerRelation : form.get("relation") }),
      });
      setResult(created);
      if (created.email.status === "sent") toast.success("Invitation email sent.");
      else if (created.email.status === "failed") toast.error("The invitation was created, but the email couldn't be sent.");
      else toast.success("Invitation saved. Email delivery is pending.");
      router.refresh();
    } catch (caught) { const message = caught instanceof Error ? caught.message : "Something went wrong. Try again."; setError(message); toast.error(message); }
    finally { lock.current = false; setPending(false); }
  }
  return <section aria-labelledby="invite-family-title">
    <h1 id="invite-family-title" className="text-[28px] font-medium lg:text-[32px]">Invite family</h1>
    <p className="mt-2 text-[15px] text-muted">{canInvitePartner ? "Add someone to help organise the wedding, or invite your partner as a co-admin." : "Invite another family helper to help organise the wedding. Only admins can invite a partner."}</p>
    {result ? <div className="mt-8 rounded-lg border border-line bg-surface p-6" role="status">
      <h2 className={`text-[18px] font-medium ${result.email.status === "failed" ? "text-danger" : ""}`}>{result.email.status === "sent" ? "Invitation email sent" : result.email.status === "pending" ? "The invitation was created. The email is pending." : "The invitation was created, but the email couldn't be sent."}</h2>
      <p className="mt-3 wrap-anywhere text-[15px]">{result.member.name} · {result.member.email}</p><p className="mt-1 text-[14px] text-muted">Pending until they accept. This invitation is already saved.</p>
      {retryNote && <p className="mt-4 text-[14px]">{retryNote}</p>}
      {error && <p role="alert" className="mt-4 text-[14px] text-danger">{error}</p>}
      <div className="mt-5 flex flex-wrap items-center gap-4"><Link href={family} data-wedding-section="family" className={`${buttonClass} min-h-11 px-5 text-[14px]`}>View family</Link>
        {result.email.status !== "sent" && <button disabled={pending} className={quietAction} onClick={async () => {
          if (lock.current) return;
          lock.current = true; setPending(true); setError("");
          try {
            const summary = await requestJson<{ sent: number; failed: number; pending: number; items: { membershipId: string; status: string }[] }>(`/api/weddings/${weddingId}/emails/retry`, { method: "POST" });
            setRetryNote(`${summary.sent} email(s) sent. ${summary.failed} not sent. ${summary.pending} still pending.`);
            const current = summary.items.find(item => item.membershipId === result.member.id);
            if (current) setResult({ ...result, email: { status: current.status } });
            router.refresh();
          } catch (caught) { setError(caught instanceof Error ? caught.message : "Try again."); }
          finally { lock.current = false; setPending(false); }
        }}>{pending ? "Retrying…" : "Retry unsent emails"}</button>}
      </div><p className="mt-3 text-[12px] text-muted">{canInvitePartner ? "Retry checks this wedding’s unsent family emails and skips emails already sent." : "Retry checks unsent helper invitation emails for this wedding. Partner invitations and emails already sent are skipped."}</p>
    </div> : <>
      {canInvitePartner ? <div className="mt-7 flex border-b border-line sm:gap-7" aria-label="Invitation type">{(["helper", "admin"] as const).map(value => <button type="button" key={value} disabled={pending} aria-pressed={mode === value} onClick={() => { setMode(value); setError(""); }} className={`min-h-12 flex-1 border-b-2 px-1 text-[16px] focus-visible:outline-2 focus-visible:outline-bronze sm:flex-none ${mode === value ? "border-bronze font-medium" : "border-transparent text-muted"}`}>{value === "helper" ? "Family helper" : <>Partner <span className="ml-2 text-[11px] tracking-[0.06em] text-muted uppercase">Admins</span></>}</button>)}</div> : <h2 className="mt-7 border-b border-line pb-3 text-[16px] font-medium">Family helper</h2>}
      {mode === "admin" && existingPartner ? <div className="mt-8 rounded-lg border border-line bg-surface p-6"><h2 className="text-[18px] font-medium">Your {partnerRelation} is already {existingPartner.joined ? "joined" : "pending"}.</h2><p className="mt-3 wrap-anywhere text-[15px]">{existingPartner.name} · {existingPartner.email}</p><Link href={family} data-wedding-section="family" className={`${quietAction} mt-4`}>View family</Link></div> :
        <form onSubmit={submit} className="mt-8">
          {mode === "admin" && <p className="mb-5 text-[15px]">Invite the {partnerRelation} as an admin.</p>}
          <div className="grid gap-6 md:grid-cols-2"><label className="block text-[14px] font-medium">Full name<input key={mode} name="name" required maxLength={80} autoComplete="name" defaultValue={mode === "admin" ? partnerName : ""} className={`${fieldClass} mt-2 font-normal`} /></label>
            <label className="block text-[14px] font-medium">Email address<input name="email" type="email" autoComplete="email" required maxLength={254} className={`${fieldClass} mt-2 font-normal`} /></label></div>
          {mode === "helper" && <label className="mt-6 block text-[14px] font-medium md:w-[calc(50%-0.75rem)]">Relation<select name="relation" className={`${fieldClass} mt-2 font-normal`}>{["mother", "father", "brother", "sister", "other"].map(relation => <option key={relation} value={relation}>{titleCase(relation)}</option>)}</select></label>}
          <p className="mt-3 text-[14px] text-muted">{mode === "helper" ? "Admins and helpers can invite family helpers. Only admins can invite a partner or remove family." : "Your partner can help plan the wedding and manage family invitations."}</p>
          <p className="mt-2 text-[14px] text-muted">They must join using this email address.</p>
          {error && <p role="alert" className="mt-5 rounded-lg bg-danger-soft p-4 text-[14px] text-danger">{error} <Link href={family} className="underline">View family</Link></p>}
          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-5"><button disabled={pending} className={`${buttonClass} min-h-12 min-w-40 px-6 text-[15px]`}>{pending ? "Sending…" : "Send invitation"}</button><Link href={family} data-wedding-section="family" className={quietAction}>Cancel</Link></div>
        </form>}
    </>}
  </section>;
}
