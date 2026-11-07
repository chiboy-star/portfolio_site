"use client";

import * as React from "react";
import { NameStyleProps } from "./types";

export function HeavyStackedStyle({
  phase,
  onEntered,
  onExited,
}: NameStyleProps) {
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
      className="w-full py-4 text-center select-none transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
      style={{
        opacity: isEntering || isExiting ? 0 : 1,
        transform: `skewX(-10deg) ${
          isEntering ? "scale(0.94) translateY(12px)" : isExiting ? "scale(0.98) translateY(-16px)" : "scale(1) translateY(0)"
        }`,
      }}
    >
      <div className="font-extrabold uppercase leading-[0.88] text-[var(--fg)] text-[clamp(2.4rem,7vw,5.5rem)] tracking-tight">
        <div>
          <span className="text-[var(--accent)]">C</span>HINEMEREM
        </div>
        <div>
          <span className="text-[var(--accent)]">M</span>ADUEKE
        </div>
      </div>
    </div>
  );
}

