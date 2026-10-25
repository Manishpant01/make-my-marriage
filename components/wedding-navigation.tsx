"use client";

import Link from "next/link";
import { useLayoutEffect, useRef } from "react";
import { toast } from "@/components/toast";

export type WeddingNavItem = { label: string; note?: string; href?: string; restricted?: boolean };

export function WeddingNavigation({ items, section, className }: {
  items: WeddingNavItem[];
  section: string;
  className: string;
}) {
  const nav = useRef<HTMLElement>(null);
  const indicator = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const element = nav.current;
    const line = indicator.current;
    if (!element || !line) return;
    function position() {
      const selected = element!.querySelector<HTMLElement>("[aria-current=page] [data-nav-label]");
      if (!selected) { line!.style.opacity = "0"; return; }
      const container = element!.getBoundingClientRect();
      const rect = selected.getBoundingClientRect();
      line!.style.width = `${rect.width}px`;
      line!.style.transform = `translate(${rect.left - container.left}px, ${rect.bottom - container.top + 2}px)`;
      line!.style.opacity = rect.width > 0 ? "1" : "0";
    }
    position();
    const observer = new ResizeObserver(position);
    observer.observe(element);
    void document.fonts.ready.then(position);
    return () => observer.disconnect();
  }, [section]);

  return (
    <nav ref={nav} aria-label="Wedding" className={`relative ${className}`}>
      <span ref={indicator} aria-hidden="true" className="wedding-nav-indicator pointer-events-none absolute top-0 left-0 h-px bg-bronze" />
      {items.map((item) => {
        const destination = item.label.toLowerCase().replaceAll(" ", "-");
        const active = destination === section;
        return (
          <div key={item.label} className={`flex min-h-11 items-center justify-between gap-4 lg:min-h-8 ${item.label === "Weddings" ? "lg:mt-2" : ""}`}>
            {item.restricted ? (
              <button type="button"
                onClick={() => toast.error("Only admins can access this section.")}
                className="wedding-nav-link inline-flex min-h-11 items-center rounded-sm text-left text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-bronze lg:min-h-8">
                <span data-nav-label>{item.label}</span>
              </button>
            ) : item.href ? (
              <Link href={item.href} data-wedding-section={destination === "weddings" ? undefined : destination}
                aria-current={active ? "page" : undefined}
                className={`wedding-nav-link inline-flex min-h-11 items-center rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-bronze lg:min-h-8 ${active ? "font-medium text-ink" : "text-muted"}`}>
                <span data-nav-label>{item.label}</span>
              </Link>
            ) : <span className="cursor-default text-muted">{item.label}</span>}
            {item.note ? <span className="pointer-events-none shrink-0 text-[11px] font-medium tracking-[0.06em] text-muted uppercase">{item.note}</span> : null}
          </div>
        );
      })}
    </nav>
  );
}
