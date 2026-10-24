import Image from "next/image";

export function Wordmark({ size }: { size: "header" | "footer" }) {
  const text =
    size === "header"
      ? "text-[clamp(12px,3.4vw,17px)] lg:text-[19px]"
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
  "inline-flex items-center justify-center rounded-lg bg-bronze font-medium tracking-[-0.01em] text-surface transition duration-180 ease-out hover:bg-bronze-hover motion-safe:hover:-translate-y-px motion-safe:active:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze disabled:opacity-60 disabled:transform-none disabled:hover:bg-bronze";

export const fieldClass =
  "w-full min-w-0 rounded-lg border border-line bg-surface px-3.5 py-3 text-[16px] leading-[1.5] text-ink outline-none transition-colors duration-180 focus:border-bronze focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze lg:text-[15px]";
