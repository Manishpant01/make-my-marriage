import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { Wordmark } from "@/components/wordmark";

export function AccountHeader({ name }: { name: string }) {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex min-h-16 max-w-[1440px] items-center justify-between gap-3 px-5 py-2 lg:min-h-20 lg:px-10">
        <Link
          href="/home"
          aria-label="MakeMyMarriage"
          className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-bronze"
        >
          <Wordmark size="header" />
        </Link>
        <div className="flex min-w-0 shrink-0 items-center gap-4 text-[13px] text-muted lg:text-[15px]">
          <span
            title={name}
            className="max-w-[80px] cursor-default truncate font-medium text-ink sm:max-w-[10rem] lg:max-w-[12rem]"
          >
            {name}
          </span>
          <LogoutButton className="min-h-11 shrink-0 whitespace-nowrap text-[13px] text-muted lg:text-[15px]" />
        </div>
      </div>
    </header>
  );
}
