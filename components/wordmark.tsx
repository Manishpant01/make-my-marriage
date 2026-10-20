import Image from "next/image";

export function Wordmark({ size }: { size: "header" | "footer" }) {
  const text =
    size === "header"
      ? "text-[17px] lg:text-[19px]"
      : "text-[15px] lg:text-[16px]";
  const mark = size === "header" ? "h-8 w-auto lg:h-9" : "h-7 w-auto lg:h-8";

  return (
    <span className="inline-flex items-center gap-2">
      <Image
        src="/logo.png"
        alt=""
        width={173}
        height={160}
        className={mark}
      />
      <span className={`font-medium tracking-normal text-ink ${text}`}>
        MakeMyMarriage
      </span>
    </span>
  );
}

export const buttonClass =
  "inline-flex items-center justify-center rounded-lg bg-bronze font-medium tracking-[-0.01em] text-surface transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze disabled:opacity-60";

export const fieldClass =
  "w-full rounded-lg border border-line bg-surface px-3.5 py-3 text-[15px] text-ink outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze";
