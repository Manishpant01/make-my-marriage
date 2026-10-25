"use client";

import { useContext, useLayoutEffect, type ReactNode } from "react";
import { useAnimate } from "motion/react";
import { WeddingLoadingContext } from "@/components/wedding-loading-context";
import { WeddingSectionSkeleton } from "@/components/page-skeletons";
export { AnimationScope as WeddingAnimationScope, Entrance as WeddingPanel } from "@/components/entrance";

export function WeddingSection({ children }: { children: ReactNode }) {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const loading = useContext(WeddingLoadingContext);

  useLayoutEffect(() => {
    if (!loading) return;
    // The outgoing fade has completed. Reveal the skeleton in the same column,
    // leaving the existing content mounted so cancelled navigation keeps inputs.
    const element = scope.current;
    element.removeAttribute("inert");
    const reveal = animate(element, { opacity: 1 }, { duration: 0 });
    return () => reveal.stop();
  }, [loading, scope, animate]);

  useLayoutEffect(() => {
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // One brief fade for the section, without per-card motion or stagger.
    const fade = animate(scope.current, { opacity: [0, 1] }, { duration: 0.1, ease: "easeOut" });
    return () => fade.stop();
  }, [animate, scope]);

  return <div ref={scope} data-wedding-panel aria-busy={loading ? true : undefined} className="min-w-0 flex-1">
    <div hidden={!!loading}>{children}</div>
    {loading && <WeddingSectionSkeleton section={loading} />}
  </div>;
}
