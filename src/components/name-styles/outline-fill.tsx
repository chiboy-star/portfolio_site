"use client";

import * as React from "react";
import { NameStyleProps } from "./types";

const TEXT = "CHINEMEREM MADUEKE";

export function OutlineFillStyle({
  phase,
  onEntered,
  onExited,
}: NameStyleProps) {
  React.useEffect(() => {
    if (phase === "entering") {
      const timer = setTimeout(() => onEntered?.(), 800);
      return () => clearTimeout(timer);
    } else if (phase === "exiting") {
      const timer = setTimeout(() => onExited?.(), 600);
      return () => clearTimeout(timer);
    }
  }, [phase, onEntered, onExited]);

  const isEntering = phase === "entering";
  const isExiting = phase === "exiting";

  // Gradient fill percentage from left to right
  const fillPos = isEntering ? "100%" : isExiting ? "0%" : "0%";

  return (
    <div
      className="w-full py-6 text-center select-none transition-opacity duration-600"
      style={{ opacity: isExiting ? 0 : 1 }}
    >
      <span
        className="text-3xl sm:text-5xl lg:text-7xl font-bold tracking-widest uppercase transition-[background-position] duration-750 ease-out"
        style={{
          WebkitTextStroke: "1.5px var(--fg)",
          background: "linear-gradient(to right, var(--fg) 50%, transparent 50%)",
          backgroundSize: "200% 100%",
          backgroundPosition: fillPos,
          WebkitBackgroundClip: "text",
          color: "transparent",
        }}
      >
        {TEXT}
      </span>
    </div>
  );
}

