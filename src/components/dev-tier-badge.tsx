"use client";

import * as React from "react";
import { useTier } from "@/hooks/use-tier";

export function DevTierBadge() {
  const tier = useTier();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (process.env.NODE_ENV !== "development" || !mounted) {
    return null;
  }

  return (
    <aside
      aria-label="Development tier indicator"
      className="fixed bottom-3 right-3 z-50 pointer-events-none rounded-[var(--radius-pill)] border border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-xs px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[var(--accent)] select-none shadow-xs"
    >
      tier: {tier}
    </aside>
  );
}

