import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { Wordmark } from "@/components/wordmark";

export function AccountHeader({ name }: { name: string }) {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 lg:h-20 lg:px-12">
        <Link
          href="/home"
          aria-label="MakeMyMarriage"
          className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-bronze"
        >
          <Wordmark size="header" />
        </Link>
        <div className="flex items-center text-[13px] text-muted lg:text-[14px]">
          <span className="max-w-[8rem] truncate lg:max-w-[12rem]">{name}</span>
          <span aria-hidden="true" className="mx-1.5 opacity-60">
            ·
          </span>
          <LogoutButton className="text-[13px] text-muted lg:text-[14px]" />
        </div>
      </div>
    </header>
  );
}
