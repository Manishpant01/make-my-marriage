import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Entrance } from "@/components/entrance";
import { AccountHeader } from "@/components/account-header";
import { buttonClass } from "@/components/wordmark";
import { getOptionalUser } from "@/lib/auth/session";
import { formatWeddingDates, getWeddingForUser } from "@/lib/weddings";

export const metadata: Metadata = {
  title: "The wedding is ready",
};

export default async function WeddingCreatedPage({
  searchParams,
}: {
  searchParams: Promise<{ wedding?: string }>;
}) {
  const user = await getOptionalUser();
  if (!user) {
    redirect("/login");
  }
  const { wedding: weddingId } = await searchParams;
  const wedding = weddingId
    ? await getWeddingForUser(user._id, weddingId)
    : null;
  if (!wedding) {
    redirect("/home");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AccountHeader name={user.name} />
      <main className="flex flex-1 items-start justify-center px-4 pt-7 pb-12 lg:items-center lg:px-6 lg:py-12">
        <Entrance className="w-full max-w-[358px] rounded-lg border border-line bg-surface p-2.5 lg:max-w-[480px] lg:p-3">
          <div className="flex flex-col items-center rounded-md border border-line px-5 py-8 text-center lg:px-11 lg:py-14">
            <Image
              src="/marigold.png"
              alt=""
              width={152}
              height={316}
              className="mb-5 h-20 w-auto lg:mb-7 lg:h-[90px]"
            />
            <p className="mb-2.5 text-[12px] font-normal tracking-[0.2em] text-muted uppercase lg:mb-3 lg:text-[13px] lg:tracking-[0.22em]">
              Congratulations
            </p>
            <h1 className="mb-3.5 max-w-full wrap-anywhere font-display text-[28px] font-medium leading-[1.25] tracking-[-0.02em] lg:mb-4 lg:text-[34px]">
              {wedding.brideName} and {wedding.groomName}
            </h1>
            <div className="mb-3.5 h-px w-12 bg-bronze lg:mb-4" />
            <p className="mb-6 text-[14px] text-muted lg:mb-7 lg:text-[15px]">
              {formatWeddingDates(wedding.startDate, wedding.endDate)}
            </p>
            <div className="mb-8 text-[15px] leading-[1.6] lg:mb-9 lg:text-[16px] lg:leading-[1.65]">
              <p>The wedding is ready.</p>
              <p>The days are set.</p>
            </div>
            <Link
              href="/home"
              className={`${buttonClass} w-full py-3.5 text-[15px] lg:w-auto lg:px-10 lg:py-3`}
            >
              Continue
            </Link>
          </div>
        </Entrance>
      </main>
    </div>
  );
}
