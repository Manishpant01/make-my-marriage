"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useAnimate } from "motion/react";
import { useWorkspaceReducedMotion } from "@/components/use-workspace-reduced-motion";

export function EventDialog({ title, onCancel, children }: { title: string; onCancel: () => void; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef(onCancel);
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const reduced = useWorkspaceReducedMotion();
  useEffect(() => { cancel.current = onCancel; }, [onCancel]);
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    element?.showModal();
    const animation = animate(scope.current, reduced ? { opacity: [0, 1] } : { opacity: [0, 1], y: [6, 0] }, { duration: 0.18, ease: "easeOut" });
    return () => { animation.stop(); element?.close(); previous?.focus(); };
  }, [animate, reduced, scope]);
  return <dialog ref={dialog} aria-labelledby="event-dialog-title" onCancel={event => { event.preventDefault(); cancel.current(); }} className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-line bg-surface p-6 text-ink backdrop:bg-ink/20">
    <div ref={scope} className="min-w-0 wrap-anywhere"><h2 id="event-dialog-title" className="text-[20px] font-medium">{title}</h2>{children}</div>
  </dialog>;
}
