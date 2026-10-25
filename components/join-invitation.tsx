"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { switchInviteAccount } from "@/app/home/actions";
import { buttonClass } from "@/components/wordmark";
import { authInvitePath } from "@/lib/invite-path";
import type { JoinInvite } from "@/lib/family";
import { titleCase } from "@/components/family-panel";
import { toast } from "@/components/toast";

const secondary = "inline-flex min-h-12 w-full items-center justify-center rounded-lg border border-line text-[15px] transition-colors hover:text-bronze focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze";
export function JoinInvitation({ token, invite, email, datesLabel, lookupFailed = false }: { token: string; invite: JoinInvite | null; email?: string; datesLabel: string; lookupFailed?: boolean }) {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [pending, setPending] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  if (lookupFailed) return <div><h1 className="text-[24px] font-medium">We couldn’t load your invitation.</h1><p className="mt-3 text-[15px] text-muted">Please try again in a moment.</p><button className={`${buttonClass} mt-6 min-h-12 w-full px-5`} onClick={() => router.refresh()}>Try again</button></div>;
  if (!invite || unavailable) return <div><h1 className="text-[24px] font-medium">This invitation is unavailable.</h1><p className="mt-3 text-[15px] text-muted">Ask the couple for help.</p><Link href="/" className={`${secondary} mt-6`}>Go to home</Link></div>;
  const joined = accepted || (!!email && invite.joined && email.toLowerCase() === invite.email.toLowerCase());
  const matching = email?.toLowerCase() === invite.email.toLowerCase();
  return <div>
    <p className="text-center text-[13px] font-medium tracking-[0.04em] text-muted uppercase">{joined ? accepted ? "You've joined the wedding" : "You're already part of this wedding" : "You're invited to help plan"}</p>
    <h1 className="mt-4 wrap-anywhere text-center font-display text-[32px] font-medium leading-[1.15] tracking-[-0.02em] sm:text-[40px]">{invite.wedding.brideName} and {invite.wedding.groomName}</h1>
    <p className="mt-3 text-center text-[15px] tabular-nums text-muted">{datesLabel}</p>
    <dl className="mt-8 divide-y divide-line rounded-lg border border-line bg-ivory px-4 py-2 text-[14px]">{[["Invited to", invite.name], ["Invited email", invite.email], ["Relation", titleCase(invite.relation)], ["Planning role", titleCase(invite.role)]].map(([label, value]) => <div key={label} className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-3"><dt className="text-muted">{label}</dt><dd className={`min-w-0 wrap-anywhere font-medium ${label === "Planning role" ? "text-bronze" : ""}`}>{value}</dd></div>)}</dl>
    {joined ? <Link href={`/home/${invite.wedding.id}`} className={`${buttonClass} mt-7 min-h-12 w-full text-[15px]`}>Open wedding</Link> : !email ? <>
      <p className="mt-6 wrap-anywhere rounded-lg border border-line p-4 text-[14px] text-muted">Use <span className="font-medium text-ink">{invite.email}</span>, the email this invitation was sent to.</p>
      <Link href={authInvitePath("/signup", token)} className={`${buttonClass} mt-5 min-h-12 w-full text-[15px]`}>Create account</Link>
      <Link href={authInvitePath("/login", token)} className={`${secondary} mt-3`}>Log in</Link>
      <p className="mt-5 text-center text-[13px] text-muted">Logging in or creating an account will return you here to confirm acceptance.</p>
    </> : !matching ? <>
      <p className="mt-6 wrap-anywhere text-[14px] text-muted">This invitation is for <span className="font-medium text-ink">{invite.email}</span>. You&apos;re signed in as <span className="font-medium text-ink">{email}</span>.</p>
      <form action={switchInviteAccount.bind(null, token)}><button className={`${buttonClass} mt-6 min-h-12 w-full text-[15px]`}>Switch account</button></form>
    </> : <>
      <p className="mt-6 wrap-anywhere text-[14px] text-muted">Signed in as {email}</p>
      {error && <p role="alert" className="mt-4 rounded-lg bg-danger-soft p-3 text-[14px] text-danger">{error}</p>}
      <button disabled={pending} className={`${buttonClass} mt-5 min-h-12 w-full text-[15px]`} onClick={async () => {
        if (lock.current) return;
        lock.current = true; setPending(true); setError("");
        try {
          const response = await fetch(`/api/join/${token}/accept`, { method: "POST" });
          const result = await response.json();
          if (response.status === 404) { setUnavailable(true); return; }
          if (!response.ok) throw new Error(result.error ?? "We couldn't accept your invitation. Try again.");
          setAccepted(true); toast.success("You've joined the wedding."); router.refresh();
        } catch (caught) { setError(caught instanceof Error ? caught.message : "We couldn't accept your invitation. Try again."); }
        finally { lock.current = false; setPending(false); }
      }}>{pending ? "Joining…" : error ? "Try again" : "Accept invitation"}</button>
    </>}
  </div>;
}
