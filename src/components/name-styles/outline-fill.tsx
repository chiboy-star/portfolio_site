"use client";

import * as React from "react";
import { NameStyleProps } from "./types";
import { waitForFont } from "@/lib/fonts";

export function OutlineFillStyle({
  phase,
  onEntered,
  onExited,
}: NameStyleProps) {
  const [fontLoaded, setFontLoaded] = React.useState(false);
  const [fillPercent, setFillPercent] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    waitForFont("Rubik Mono One", "400").then((loaded) => {
      if (!cancelled) setFontLoaded(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (phase === "entering") {
      setFillPercent(0);
      const timer = setTimeout(() => {
        setFillPercent(100);
      }, 50);

      const enterTimer = setTimeout(() => {
        onEntered?.();
      }, 800);

      return () => {
        clearTimeout(timer);
        clearTimeout(enterTimer);
      };
    } else if (phase === "active") {
      setFillPercent(100);
    } else if (phase === "exiting") {
      setFillPercent(0);
      const exitTimer = setTimeout(() => {
        onExited?.();
      }, 600);
      return () => clearTimeout(exitTimer);
    }
  }, [phase, onEntered, onExited]);

  const isExiting = phase === "exiting";

  return (
    <div
      className="w-full text-center select-none transition-all duration-600 ease-[cubic-bezier(0.22,1,0.36,1)] leading-tight"
      style={{
        fontFamily: fontLoaded ? "var(--font-rubik-mono-one), monospace" : "var(--font-geist-sans), sans-serif",
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? "scale(0.97)" : "scale(1)",
      }}
    >
      <span
        className="text-[clamp(1.15rem,2.6vw,2.35rem)] font-normal tracking-[0.05em] uppercase transition-[background-position] duration-750 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          WebkitTextStroke: "1.2px var(--fg)",
          backgroundImage: "linear-gradient(to right, var(--fg) 50%, transparent 50%)",
          backgroundSize: "200% 100%",
          backgroundPosition: `${100 - fillPercent}% 0`,
          WebkitBackgroundClip: "text",
          color: "transparent",
        }}
      >
        <span className="block sm:inline">CHINEMEREM </span>
        <span className="block sm:inline">MADUEKE</span>
      </span>
    </div>
  );
}
