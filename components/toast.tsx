"use client";

import { useEffect, useState, type ReactNode } from "react";

type Tone = "success" | "error";

type Notice = {
  id: number;
  message: string;
  tone: Tone;
  leaving: boolean;
};

type Bucket = {
  notices: Notice[];
  nextId: number;
};

const EVENT = "makemymarriage-toast";
const VISIBLE_MS = 4000;
const MOTION_MS = 280;

function bucket(): Bucket {
  const host = window as Window & { __mmmToast?: Bucket };
  if (!host.__mmmToast) {
    host.__mmmToast = { notices: [], nextId: 0 };
  }
  return host.__mmmToast;
}

function publish() {
  window.dispatchEvent(new Event(EVENT));
}

function dismiss(id: number) {
  const notice = bucket().notices.find((item) => item.id === id);
  if (!notice || notice.leaving) {
    return;
  }
  notice.leaving = true;
  publish();
  window.setTimeout(() => {
    const held = bucket();
    const index = held.notices.findIndex((item) => item.id === id);
    if (index !== -1) {
      held.notices.splice(index, 1);
      publish();
    }
  }, MOTION_MS);
}

function show(message: string, tone: Tone) {
  const held = bucket();
  const notice = { id: ++held.nextId, message, tone, leaving: false };
  held.notices.push(notice);
  publish();
  window.setTimeout(() => dismiss(notice.id), VISIBLE_MS);
}

export const toast = {
  success(message: string) {
    show(message, "success");
  },
  error(message: string) {
    show(message, "error");
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Notice[]>([]);

  useEffect(() => {
    const sync = () => setItems(bucket().notices.map((notice) => ({ ...notice })));
    sync();
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);

  return (
    <>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed top-[5.5rem] right-4 left-4 z-50 flex flex-col gap-2 lg:top-[6.5rem] lg:right-6 lg:left-auto lg:w-80"
      >
        {items.map((notice) => (
          <p
            key={notice.id}
            role={notice.tone === "error" ? "alert" : "status"}
            className={`pointer-events-auto flex items-center gap-3 rounded-lg border px-4 py-4 text-[14px] ${
              notice.leaving
                ? "motion-safe:animate-[toast-out_280ms_ease-out_forwards]"
                : "motion-safe:animate-[toast-in_280ms_ease-out]"
            } ${
              notice.tone === "error"
                ? "border-danger bg-danger-soft text-danger"
                : "border-line bg-surface text-ink"
            }`}
          >
            <Mark tone={notice.tone} />
            <span>{notice.message}</span>
          </p>
        ))}
      </div>
    </>
  );
}

function Mark({ tone }: { tone: Tone }) {
  const success = tone === "success";
  return (
    <span
      aria-hidden="true"
      className={`grid size-[22px] shrink-0 place-items-center rounded-full text-white ${
        success ? "bg-success" : "bg-danger"
      }`}
    >
      <svg viewBox="0 0 16 16" className="size-3" fill="none">
        {success ? (
          <path
            d="M3.2 8.2 6.4 11.2 12.8 4.6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <path
            d="M4.4 4.4 11.6 11.6M11.6 4.4 4.4 11.6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        )}
      </svg>
    </span>
  );
}
