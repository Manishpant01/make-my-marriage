"use client";

import { useLayoutEffect, type ReactNode } from "react";
import { useAnimate } from "motion/react";
export { AnimationScope as WeddingAnimationScope, Entrance as WeddingPanel } from "@/components/entrance";

export function WeddingSection({ children }: { children: ReactNode }) {
  const [scope, animate] = useAnimate<HTMLDivElement>();

  useLayoutEffect(() => {
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // One brief fade for the section, without per-card motion or stagger.
    const fade = animate(scope.current, { opacity: [0, 1] }, { duration: 0.1, ease: "easeOut" });
    return () => fade.stop();
  }, [animate, scope]);

  return <div ref={scope} data-wedding-panel className="min-w-0 flex-1">{children}</div>;
}
