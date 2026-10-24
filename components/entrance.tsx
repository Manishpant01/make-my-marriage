"use client";

import { createElement, useLayoutEffect, useRef, type ReactNode } from "react";
import { MotionConfig, useAnimate } from "motion/react";
import { useWorkspaceReducedMotion } from "@/components/use-workspace-reduced-motion";
import { entranceTiming } from "@/lib/animation";

export function AnimationScope({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

export function Entrance({ children, className, as = "div", delay = 0,
  duration = entranceTiming.duration, kind = "rise", inView = false,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "li" | "h1";
  delay?: number;
  duration?: number;
  kind?: "rise" | "fade";
  inView?: boolean;
}) {
  const [scope, animate] = useAnimate<HTMLElement>();
  const reduced = useWorkspaceReducedMotion();
  const running = useRef<ReturnType<typeof animate> | null>(null);
  // Entry settings belong to this mount, not subsequent row positions or edits.
  const entry = useRef({ delay, duration, kind, inView });

  useLayoutEffect(() => {
    const element = scope.current;
    const settings = entry.current;
    let entered = false;
    function reveal() {
      if (entered) return;
      entered = true;
      observer?.disconnect();
      // The server markup stays visible; only enhance once the client is ready.
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      running.current = animate(element,
        settings.kind === "fade" ? { opacity: [0, 1] } : { opacity: [0, 1], y: [8, 0] },
        { duration: settings.duration, delay: settings.delay, ease: "easeOut" },
      );
    }
    let observer: IntersectionObserver | undefined;
    if (settings.inView && typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) reveal();
      }, { rootMargin: "80px 0px" });
      observer.observe(element);
      const bounds = element.getBoundingClientRect();
      if (bounds.top < window.innerHeight + 80 && bounds.bottom > -80) reveal();
    } else {
      reveal();
    }
    return () => {
      observer?.disconnect();
      running.current?.stop();
    };
  }, [animate, scope]);

  useLayoutEffect(() => {
    if (reduced) {
      running.current?.stop();
      const reset = animate(scope.current, { opacity: 1, y: 0 }, { duration: 0 });
      return () => reset.stop();
    }
  }, [animate, reduced, scope]);

  return createElement(as, { ref: scope, className }, children);
}
