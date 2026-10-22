import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { buttonClass, Wordmark } from "@/components/wordmark";

export const metadata: Metadata = {
  description:
    "A quiet place for the family to keep the events, the guests, the tasks, and the invitation together.",
};

const pillars = [
  {
    title: "Events",
    line: "The days, in order.",
    detail: "Haldi, mehendi, wedding, and the days around them.",
  },
  {
    title: "Guests",
    line: "The right people, at each one.",
    detail: "Invite them, and collect a yes or no.",
  },
  {
    title: "Family",
    line: "Everyone who is helping.",
    detail: "Hand each person a piece of the work.",
  },
] as const;

const tasks = [
  ["Confirm the venue", "Priya"],
  ["Book the caterer", "Rahul"],
  ["Send the invitations", "Mother"],
] as const;

const upcoming = [
  ["Haldi", "Saturday"],
  ["Mehendi", "Sunday"],
  ["Wedding", "Monday"],
] as const;

function Rows({ items }: { items: readonly (readonly [string, string])[] }) {
  return (
    <ul className="overflow-hidden rounded-lg border border-line">
      {items.map(([label, meta], index) => (
        <li
          key={label}
          className={`flex items-center justify-between px-4 py-3.5 lg:px-6 lg:py-4 ${
            index < items.length - 1 ? "border-b border-line" : ""
          }`}
        >
          <span className="text-[15px]">{label}</span>
          <span className="text-[14px] text-muted">{meta}</span>
        </li>
      ))}
    </ul>
  );
}

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 lg:px-16 lg:py-6">
          <Link
            href="/"
            aria-label="MakeMyMarriage"
            className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-bronze"
          >
            <Wordmark size="header" />
          </Link>
          <div className="flex items-center gap-8">
            <Link
              href="/login"
              className="hidden text-[15px] transition-colors hover:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-bronze lg:inline"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className={`${buttonClass} min-h-[38px] px-4 py-2 text-[13px] lg:min-h-0 lg:px-5 lg:py-2.5 lg:text-[14px]`}
            >
              <span className="lg:hidden">Start</span>
              <span className="hidden lg:inline">Start a wedding</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-[1440px] lg:grid lg:grid-cols-2 lg:items-center lg:gap-12 lg:px-16 lg:pb-28 lg:pt-24">
          <div className="px-6 pb-8 pt-10 lg:px-0 lg:py-0 lg:pr-6">
            <h1 className="mb-4 text-[34px] font-medium leading-[1.18] tracking-[-0.02em] lg:mb-7 lg:text-[52px] lg:leading-[1.12]">
              The wedding, in one place.
            </h1>
            <p className="mb-7 max-w-[480px] text-[16px] leading-[1.55] text-muted lg:mb-10 lg:text-[18px] lg:leading-[1.6]">
              A quiet place for the family to keep the events, the guests, the
              tasks, and the invitation together.
            </p>
            <Link
              href="/signup"
              className={`${buttonClass} min-h-12 w-full py-3.5 text-[15px] lg:w-auto lg:px-7`}
            >
              Start a wedding
            </Link>
          </div>
          <div className="relative aspect-[4/3] bg-line">
            <Image
              src="/landing-hero.jpg"
              alt="Intimate North Indian wedding moment with bride and groom"
              fill
              priority
              loading="eager"
              sizes="(min-width: 1024px) 640px, 100vw"
              className="object-cover"
            />
          </div>
        </section>

        <section className="mx-auto max-w-[1440px] px-6 py-12 lg:grid lg:grid-cols-3 lg:gap-16 lg:border-t lg:border-line lg:px-16 lg:py-24">
          {pillars.map((item, index) => (
            <div
              key={item.title}
              className={
                index > 0
                  ? "mt-8 border-t border-line pt-8 lg:mt-0 lg:border-0 lg:pt-0"
                  : undefined
              }
            >
              <h2 className="mb-1.5 text-[17px] font-medium tracking-[-0.01em] lg:mb-2">
                {item.title}
              </h2>
              <p className="text-[15px] leading-normal text-muted lg:leading-relaxed">
                {item.line}
              </p>
              <p className="mt-0.5 text-[15px] leading-normal text-muted lg:mt-1 lg:text-[14px] lg:leading-relaxed">
                {item.detail}
              </p>
            </div>
          ))}
        </section>

        <section className="mx-auto max-w-[1440px] border-t border-line px-6 pb-14 pt-8 lg:px-16 lg:py-24">
          <div className="lg:mx-auto lg:grid lg:max-w-[960px] lg:grid-cols-2 lg:gap-12">
            <div>
              <div className="mb-4 lg:mb-6 lg:text-center">
                <h2 className="mb-1 text-[17px] font-medium tracking-[-0.01em]">
                  What the family works on
                </h2>
                <p className="text-[15px] text-muted lg:text-[14px]">
                  See the work, and who is doing it.
                </p>
              </div>
              <Rows items={tasks} />
            </div>
            <div className="mt-8 lg:mt-0">
              <div className="mb-4 lg:mb-6 lg:text-center">
                <h2 className="text-[17px] font-medium tracking-[-0.01em] lg:mb-1">
                  Coming up
                </h2>
                <p className="hidden text-[14px] text-muted lg:block">
                  The schedule of celebrations.
                </p>
              </div>
              <Rows items={upcoming} />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-6 lg:px-16 lg:py-8">
          <Wordmark size="footer" />
          <Link
            href="/login"
            className="text-[14px] transition-colors hover:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-bronze"
          >
            Log in
          </Link>
        </div>
      </footer>
    </div>
  );
}
