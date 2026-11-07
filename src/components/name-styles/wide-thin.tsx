"use client";

import * as React from "react";
import { NameStyleProps } from "./types";

export function WideThinStyle({
  phase,
  text = "CHINEMEREM MADUEKE",
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
      className="w-full py-6 text-center transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
      style={{
        opacity: isEntering || isExiting ? 0 : 1,
        letterSpacing: isEntering ? "0.38em" : isExiting ? "0.32em" : "0.18em",
        transform: isEntering ? "scale(0.98)" : isExiting ? "scale(1.02)" : "scale(1)",
      }}
    >
      <span className="text-3xl sm:text-5xl lg:text-7xl font-extralight text-[var(--fg)] uppercase tracking-inherit select-none">
        {text}
      </span>
    </div>
  );
}

