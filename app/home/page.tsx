import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { Wordmark } from "@/components/wordmark";
import { getOptionalUser } from "@/lib/auth/session";
import { listWeddings } from "@/lib/weddings";

export const metadata: Metadata = {
  title: "Your weddings",
};

export default async function AccountHomePage() {
  const user = await getOptionalUser();
  if (!user) {
    redirect("/login");
  }
  const { items } = await listWeddings(user._id, 1, 20);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-6 px-5 py-4 lg:px-16 lg:py-6">
          <Link
            href="/home"
            aria-label="MakeMyMarriage"
            className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-bronze"
          >
            <Wordmark size="header" />
          </Link>
          <div className="flex items-center gap-3 text-[15px]">
            <span className="max-w-[12rem] truncate">{user.name}</span>
            <span aria-hidden="true" className="text-muted">
              ·
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[640px] flex-1 px-6 py-12">
        <h1 className="mb-6 text-[28px] font-medium tracking-[-0.02em]">
          Your weddings
        </h1>
        {items.length === 0 ? (
          <p className="text-[16px] leading-relaxed text-muted">
            You have no wedding yet.
          </p>
        ) : (
          <ul className="overflow-hidden rounded-lg border border-line">
            {items.map((item, index) => (
              <li
                key={item.id}
                className={`flex items-center justify-between gap-4 px-4 py-3.5 ${
                  index < items.length - 1 ? "border-b border-line" : ""
                }`}
              >
                <span className="text-[15px]">
                  {item.brideName} and {item.groomName}
                </span>
                <span className="text-[14px] text-muted">
                  {item.startDate} – {item.endDate}
                </span>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
