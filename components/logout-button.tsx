import { logout } from "@/app/home/actions";

export function LogoutButton({ className }: { className?: string }) {
  return (
    <form action={logout}>
      <button
        type="submit"
        className={`transition-colors duration-180 hover:text-bronze active:text-bronze-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-bronze ${className ?? "text-[15px]"}`}
      >
        Log out
      </button>
    </form>
  );
}
