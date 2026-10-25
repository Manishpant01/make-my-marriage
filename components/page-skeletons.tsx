import type { ReactNode } from "react";
import { Wordmark } from "@/components/wordmark";

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`rounded bg-line motion-safe:animate-pulse ${className}`} />;
}

function LoadingRegion({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return <div aria-busy="true" className={className}>
    <p role="status" className="sr-only">{label}</p>
    {children}
  </div>;
}

function HeaderSkeleton({ account = true }: { account?: boolean }) {
  return <header className="border-b border-line"><div className="mx-auto flex min-h-16 max-w-[1440px] items-center justify-between gap-3 px-5 py-2 lg:min-h-20 lg:px-10">
    <Wordmark size="header" />
    {account && <div aria-hidden="true" className="flex gap-4"><Skeleton className="h-4 w-14" /><Skeleton className="h-4 w-12" /></div>}
  </div></header>;
}

function Lines() {
  return <div className="space-y-3"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-4/5" /><Skeleton className="h-4 w-3/5" /></div>;
}

function Fields({ count = 4 }: { count?: number }) {
  return <div className="grid gap-6 sm:grid-cols-2">{Array.from({ length: count }, (_, index) => <div key={index} className="space-y-2"><Skeleton className="h-3.5 w-24" /><Skeleton className="h-12 w-full rounded-lg" /></div>)}</div>;
}

export function WeddingSectionSkeleton({ section = "dashboard" }: { section?: string }) {
  const label = section === "invite-family" ? "family invitation" : section;
  return <LoadingRegion label={`Loading ${label}…`} className="min-h-[460px]">
    <div className="mb-7 space-y-3"><Skeleton className="h-9 w-56 max-w-full" /><Skeleton className="h-4 w-72 max-w-full" /></div>
    {section === "couple" || section === "invite-family" ? <div className="space-y-8">
      {section === "invite-family" && <Skeleton className="h-12 w-64 max-w-full" />}
      <Fields count={section === "couple" ? 4 : 3} />
      <Skeleton className="h-12 w-40 rounded-lg" />
    </div> : section === "invitation" ? <div className="grid gap-7 xl:grid-cols-2"><div className="space-y-5"><Skeleton className="h-4 w-32" /><Skeleton className="h-44 w-full rounded-lg" /><Skeleton className="h-12 w-40 rounded-lg" /></div><div className="space-y-8 rounded-lg border border-line bg-surface p-7"><Skeleton className="mx-auto h-9 w-4/5" /><Lines /><Lines /></div></div>
      : section === "family" ? <div className="overflow-hidden rounded-lg border border-line bg-surface">{Array.from({ length: 4 }, (_, index) => <div key={index} className="flex flex-wrap items-center justify-between gap-5 border-b border-line p-5 last:border-0"><div className="w-44 max-w-full space-y-2"><Skeleton className="h-5 w-full" /><Skeleton className="h-3.5 w-4/5" /></div><Skeleton className="h-4 w-16" /><Skeleton className="h-4 w-16" /></div>)}</div>
        : <>
          <div className="overflow-hidden rounded-lg border border-line bg-surface lg:flex"><Skeleton className="h-48 rounded-none lg:h-auto lg:min-h-80 lg:w-2/5" /><div className="flex-1 space-y-7 p-5 lg:p-8"><Skeleton className="h-7 w-48 max-w-full" /><Lines /><Lines /></div></div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">{Array.from({ length: 5 }, (_, index) => <div key={index} className="space-y-4 rounded-lg border border-line bg-surface p-4"><Skeleton className="h-3 w-16" /><Skeleton className="h-8 w-16" /><Skeleton className="h-3 w-20 max-w-full" /></div>)}</div>
          <div className="mt-5 grid gap-4 xl:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <div key={index} className="rounded-lg border border-line bg-surface p-5"><Lines /></div>)}</div>
        </>}
  </LoadingRegion>;
}

export function HomeSkeleton() {
  return <div className="flex min-h-screen flex-col"><HeaderSkeleton /><main className="mx-auto w-full max-w-[640px] flex-1 px-6 py-12"><LoadingRegion label="Loading your weddings…"><Skeleton className="mb-6 h-9 w-52" /><div className="divide-y divide-line overflow-hidden rounded-lg border border-line">{Array.from({ length: 3 }, (_, index) => <div key={index} className="flex flex-wrap justify-between gap-4 p-4"><Skeleton className="h-5 w-48" /><Skeleton className="h-4 w-32" /></div>)}</div></LoadingRegion></main></div>;
}

export function WorkspaceSkeleton() {
  return <div className="flex min-h-screen flex-col"><HeaderSkeleton /><main className="mx-auto w-full max-w-[1440px] flex-1 px-5 pt-4 pb-16 lg:px-10 lg:pt-10"><div aria-hidden="true" className="mb-6 flex flex-wrap gap-5 lg:hidden">{Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-5 w-20" />)}</div><div className="lg:flex lg:items-start lg:gap-14"><div aria-hidden="true" className="hidden w-[200px] shrink-0 space-y-5 lg:block">{Array.from({ length: 13 }, (_, index) => <Skeleton key={index} className="h-4 w-28" />)}</div><div className="min-w-0 flex-1"><WeddingSectionSkeleton /></div></div></main></div>;
}

export function JoinSkeleton({ created = false }: { created?: boolean }) {
  return <div className="flex min-h-screen flex-col"><HeaderSkeleton account={created} /><main className="flex-1 px-5 py-10 lg:py-14"><LoadingRegion label={created ? "Loading your wedding…" : "Loading invitation…"} className={`mx-auto w-full rounded-lg border border-line bg-surface p-6 sm:p-10 ${created ? "max-w-[480px]" : "max-w-[560px]"}`}><Skeleton className="mx-auto h-4 w-44" /><Skeleton className="mx-auto mt-6 h-11 w-4/5" /><Skeleton className="mx-auto mt-4 h-4 w-40" /><div className="mt-8 space-y-5 rounded-lg border border-line p-5"><Lines /><Lines /></div><Skeleton className="mt-7 h-12 w-full rounded-lg" /><Skeleton className="mt-3 h-12 w-full rounded-lg" /></LoadingRegion></main></div>;
}

export function AuthSkeleton({ fields = 2 }: { fields?: number }) {
  return <div className="lg:grid lg:min-h-screen lg:grid-cols-2"><Skeleton className="hidden min-h-screen rounded-none lg:block" /><main className="flex min-h-screen items-center justify-center px-6 py-12"><LoadingRegion label="Loading account page…" className="w-full max-w-[360px]"><Wordmark size="header" /><Skeleton className="mt-10 mb-8 h-9 w-48" /><div className="space-y-5">{Array.from({ length: fields }, (_, index) => <div key={index} className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-12 w-full rounded-lg" /></div>)}</div><Skeleton className="mt-7 h-12 w-full rounded-lg" /><Skeleton className="mt-6 h-4 w-48" /></LoadingRegion></main></div>;
}
