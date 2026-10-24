"use client";

import { useSyncExternalStore } from "react";
import { useReducedMotion } from "motion/react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(notify: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
}

function snapshot() {
  return window.matchMedia(QUERY).matches;
}

export function useWorkspaceReducedMotion() {
  const initial = useReducedMotion();
  // Motion 14's hook reads the initial setting but does not subscribe to changes.
  return useSyncExternalStore(subscribe, snapshot, () => initial === true);
}
