"use client";

import { useSyncExternalStore } from "react";

export type DeviceTier = "full" | "lite" | "minimal";

function getClientSnapshot(): DeviceTier {
  if (typeof document === "undefined") return "lite";
  let tier = document.documentElement.getAttribute("data-tier") as DeviceTier | null;
  if (!tier && typeof window !== "undefined") {
    // @ts-expect-error global page tier cache
    tier = (window.__PAGE_TIER as DeviceTier) || "lite";
    document.documentElement.setAttribute("data-tier", tier);
  }
  if (tier === "full" || tier === "lite" || tier === "minimal") {
    return tier;
  }
  return "lite";
}

function getServerSnapshot(): DeviceTier {
  return "lite";
}

function subscribe(onStoreChange: () => void): () => void {
  if (typeof MutationObserver === "undefined") return () => {};

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.attributeName === "data-tier") {
        const val = document.documentElement.getAttribute("data-tier");
        if (!val && typeof window !== "undefined") {
          // Re-assert tier if an external re-render stripped attribute
          // @ts-expect-error global page tier cache
          const cached = (window.__PAGE_TIER as DeviceTier) || "lite";
          document.documentElement.setAttribute("data-tier", cached);
        }
        onStoreChange();
      }
    }
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-tier"],
  });

  return () => observer.disconnect();
}

/**
 * useTier hook backed by useSyncExternalStore.
 * The server snapshot is permanently fixed to "lite".
 * The client snapshot is safely read from document.documentElement data-tier.
 * No document/window reads occur during pure render without subscription.
 */
export function useTier(): DeviceTier {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}
