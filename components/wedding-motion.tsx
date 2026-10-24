"use client";

import { useCallback, useLayoutEffect, useRef, useTransition, type MouseEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAnimate } from "motion/react";
import { useWorkspaceReducedMotion } from "@/components/use-workspace-reduced-motion";

type Destination = { section: string; href: string };

export function WeddingMotion({ section, children }: { section: string; children: ReactNode }) {
  const router = useRouter();
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const reduced = useWorkspaceReducedMotion();
  const [pending, startTransition] = useTransition();
  const exit = useRef<ReturnType<typeof animate> | null>(null);
  const outgoing = useRef<HTMLElement | null>(null);
  const requested = useRef<Destination | null>(null);
  const request = useRef(0);
  const recovery = useRef<ReturnType<typeof setTimeout> | null>(null);

  const restore = useCallback(() => {
    exit.current?.stop();
    if (recovery.current) clearTimeout(recovery.current);
    const element = outgoing.current;
    if (element) {
      element.inert = false;
      element.style.opacity = "1";
    }
    outgoing.current = null;
  }, []);

  useLayoutEffect(() => {
    // Navigation responses may arrive after a newer click. Keep the last intent.
    restore();
    const destination = requested.current;
    if (destination && destination.section !== section) {
      startTransition(() => router.push(destination.href, { scroll: false }));
    } else {
      requested.current = null;
    }
  }, [section, router, restore]);

  useLayoutEffect(() => () => {
    request.current += 1;
    restore();
  }, [restore]);

  useLayoutEffect(() => {
    if (!reduced) return;
    exit.current?.complete();
  }, [reduced]);

  function navigate(event: MouseEvent<HTMLDivElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = (event.target as HTMLElement).closest<HTMLAnchorElement>("a[data-wedding-section]");
    if (!link) return;
    event.preventDefault();
    const token = ++request.current;
    const destination = { section: link.dataset.weddingSection!, href: link.href };
    const hadRequest = requested.current !== null;
    requested.current = destination;
    restore();
    if (destination.section === section) {
      requested.current = null;
      if (hadRequest) startTransition(() => router.push(link.href, { scroll: false }));
      return;
    }
    const panel = scope.current?.querySelector<HTMLElement>("[data-wedding-panel]");
    const commit = () => {
      if (request.current !== token) return;
      startTransition(() => router.push(destination.href, { scroll: false }));
      recovery.current = setTimeout(() => {
        if (request.current === token) {
          requested.current = null;
          restore();
        }
      }, 5000);
    };
    if (!panel || reduced) { commit(); return; }
    outgoing.current = panel;
    panel.inert = true;
    const controls = animate(panel, { opacity: 0 }, { duration: 0.1, ease: "easeOut" });
    exit.current = controls;
    void controls.then(commit).catch(() => {
      if (request.current === token) restore();
    });
  }

  return (
    <div ref={scope} onClickCapture={navigate}>
      {pending ? <p role="status" className="fixed right-5 bottom-5 z-40 rounded-lg border border-line bg-surface px-4 py-3 text-sm text-muted">Loading wedding...</p> : null}
      {children}
    </div>
  );
}
