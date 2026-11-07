"use client";

import * as React from "react";
import { NameStyleProps } from "./types";
import { waitForFont } from "@/lib/fonts";

export function HeavyStackedStyle({
  phase,
  onEntered,
  onExited,
}: NameStyleProps) {
  const [fontLoaded, setFontLoaded] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    waitForFont("Unbounded", "900").then((loaded) => {
      if (!cancelled) setFontLoaded(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (phase === "entering") {
      const timer = setTimeout(() => onEntered?.(), 700);
      return () => clearTimeout(timer);
    } else if (phase === "exiting") {
      const timer = setTimeout(() => onExited?.(), 600);
      return () => clearTimeout(timer);
    }
  }, [phase, onEntered, onExited]);

  const isEntering = phase === "entering";
  const isExiting = phase === "exiting";

  return (
    <div
      className="w-full text-center select-none transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
      style={{
        fontFamily: fontLoaded ? "var(--font-unbounded), sans-serif" : "var(--font-geist-sans), sans-serif",
        opacity: isEntering || isExiting ? 0 : 1,
        transform: `skewX(-10deg) ${
          isEntering ? "scale(0.94) translateY(8px)" : isExiting ? "scale(0.98) translateY(-12px)" : "scale(1) translateY(0)"
        }`,
      }}
    >
      <div className="font-black uppercase leading-[0.86] text-[var(--fg)] text-[clamp(1.75rem,4.4vw,3.5rem)] tracking-tight">
        <div>
          <span className="text-[var(--accent)] font-black">C</span>HINEMEREM
        </div>
        <div>
          <span className="text-[var(--accent)] font-black">M</span>ADUEKE
        </div>
      </div>
    </div>
  );
}
