"use client";

import { useLayoutEffect } from "react";
import { installNavigationHistory } from "@/lib/navigation-history";

export function NavigationHistory() {
  useLayoutEffect(() => installNavigationHistory(window), []);
  return null;
}
