"use client";

import { useEffect, useState } from "react";

export type DeviceTier = "full" | "lite" | "minimal";

export function useTier(): DeviceTier {
  const [tier, setTier] = useState<DeviceTier>("lite");

  useEffect(() => {
    const docTier = document.documentElement.getAttribute("data-tier") as DeviceTier | null;
    if (docTier && (docTier === "full" || docTier === "lite" || docTier === "minimal")) {
      setTier(docTier);
    } else {
      const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      // @ts-expect-error navigator.connection is non-standard
      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      const sd = conn && (conn.saveData || conn.effectiveType === "2g" || conn.effectiveType === "3g");
      if (rm || sd) {
        setTier("minimal");
        document.documentElement.setAttribute("data-tier", "minimal");
        return;
      }
      const finePointer = window.matchMedia("(pointer: fine)").matches;
      const hover = window.matchMedia("(hover: hover)").matches;
      const wide = window.innerWidth >= 1024;
      const detected = finePointer && hover && wide ? "full" : "lite";
      setTier(detected);
      document.documentElement.setAttribute("data-tier", detected);
    }

    const handleResize = () => {
      const current = document.documentElement.getAttribute("data-tier");
      if (current === "minimal") return;
      const finePointer = window.matchMedia("(pointer: fine)").matches;
      const hover = window.matchMedia("(hover: hover)").matches;
      const wide = window.innerWidth >= 1024;
      const nextTier = finePointer && hover && wide ? "full" : "lite";
      document.documentElement.setAttribute("data-tier", nextTier);
      setTier(nextTier);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return tier;
}

