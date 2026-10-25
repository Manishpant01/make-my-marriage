import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { readInvite, type JoinInvite } from "@/lib/family";
import { switchInviteAccount } from "@/app/home/actions";
import { Wordmark } from "@/components/wordmark";
import { JoinInvitation } from "@/components/join-invitation";
import { Entrance } from "@/components/entrance";
import { formatWeddingDates } from "@/lib/weddings";

export const metadata: Metadata = { title: "Join the wedding", robots: { index: false, follow: false }, referrer: "no-referrer" };
export const dynamic = "force-dynamic";
export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let invite: JoinInvite | null = null;
  let user;
  let lookupFailed = false;
  try { user = await getCurrentUser(); invite = await readInvite(token, user); }
  catch { lookupFailed = true; }
  return <div className="flex min-h-screen flex-col">
    <header className="border-b border-line"><div className="mx-auto flex min-h-16 max-w-[1440px] items-center justify-between gap-3 px-5 py-2 lg:min-h-20 lg:px-10">
      <Link href="/" aria-label="MakeMyMarriage"><Wordmark size="header" /></Link>
      {user && <div className="flex min-w-0 items-center gap-4 text-[13px] lg:text-[15px]"><span className="max-w-24 truncate font-medium sm:max-w-44">{user.name}</span><form action={switchInviteAccount.bind(null, token)}><button className="min-h-11 text-muted hover:text-bronze focus-visible:outline-2 focus-visible:outline-bronze">Log out</button></form></div>}
    </div></header>
    <main className="flex-1 px-5 py-10 lg:py-14"><Entrance className="mx-auto w-full max-w-[560px] rounded-lg border border-line bg-surface p-5 sm:p-8 lg:p-10"><JoinInvitation token={token} invite={invite} email={user?.email} datesLabel={invite ? formatWeddingDates(invite.wedding.startDate, invite.wedding.endDate) : ""} lookupFailed={lookupFailed} /></Entrance></main>
    <footer className="border-t border-line px-5 py-6 text-center text-[13px] text-muted">MakeMyMarriage — A quiet place for families planning weddings together.</footer>
  </div>;
}
