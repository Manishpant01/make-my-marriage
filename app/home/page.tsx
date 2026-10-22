import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountHeader } from "@/components/account-header";
import { StartWeddingForm } from "@/components/start-wedding-form";
import { getOptionalUser } from "@/lib/auth/session";
import { formatWeddingDates, listWeddings } from "@/lib/weddings";

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
      <AccountHeader name={user.name} />
      {items.length === 0 ? (
        <main className="flex-1">
          <StartWeddingForm />
        </main>
      ) : (
        <main className="mx-auto w-full max-w-[640px] flex-1 px-6 py-12">
          <h1 className="mb-6 text-[28px] font-medium tracking-[-0.02em]">
            Your weddings
          </h1>
          <ul className="overflow-hidden rounded-lg border border-line">
            {items.map((item, index) => (
              <li
                key={item.id}
                className={`flex items-center justify-between gap-4 px-4 py-3.5 ${
                  index < items.length - 1 ? "border-b border-line" : ""
                }`}
              >
                <span className="min-w-0 flex-1 wrap-anywhere text-[15px]">
                  {item.brideName} and {item.groomName}
                </span>
                <span className="shrink-0 text-right text-[14px] whitespace-nowrap text-muted">
                  {formatWeddingDates(item.startDate, item.endDate)}
                </span>
              </li>
            ))}
          </ul>
        </main>
      )}
    </div>
  );
}
