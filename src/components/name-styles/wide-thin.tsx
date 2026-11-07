"use client";

import * as React from "react";
import { NameStyleProps } from "./types";
import { waitForFont } from "@/lib/fonts";

export function WideThinStyle({
  phase,
  text = "CHINEMEREM MADUEKE",
  onEntered,
  onExited,
}: NameStyleProps) {
  const [fontLoaded, setFontLoaded] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    waitForFont("Syncopate", "400").then((loaded) => {
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

  const parts = text.split(" ");
  const first = parts[0] || "CHINEMEREM";
  const last = parts.slice(1).join(" ") || "MADUEKE";

  return (
    <div
      className="w-full text-center transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] select-none"
      style={{
        fontFamily: fontLoaded ? "var(--font-syncopate), sans-serif" : "var(--font-geist-sans), sans-serif",
        opacity: isEntering || isExiting ? 0 : 1,
        letterSpacing: isEntering ? "0.28em" : isExiting ? "0.22em" : "0.14em",
        transform: isEntering ? "scale(0.97)" : isExiting ? "scale(1.02)" : "scale(1)",
      }}
    >
      <span className="text-[clamp(1.25rem,3.1vw,2.65rem)] font-normal text-[var(--fg)] uppercase tracking-inherit leading-tight">
        <span className="block sm:inline">{first} </span>
        <span className="block sm:inline">{last}</span>
      </span>
    </div>
  );
}
