"use client";

import * as React from "react";
import { NameStyleProps } from "./types";
import { waitForFont } from "@/lib/fonts";

const FIRST_NAME = "Chinemerem";
const LAST_NAME = "Madueke";

export function SoftBlurStyle({
  phase,
  onEntered,
  onExited,
}: NameStyleProps) {
  const [fontLoaded, setFontLoaded] = React.useState(false);
  const [revealedCount, setRevealedCount] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    waitForFont("Instrument Serif", "400", "italic").then((loaded) => {
      if (!cancelled) setFontLoaded(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (phase === "entering") {
      setRevealedCount(0);
      const interval = setInterval(() => {
        setRevealedCount((prev) => {
          if (prev >= 20) {
            clearInterval(interval);
            return 20;
          }
          return prev + 1;
        });
      }, 24);

      const enterTimer = setTimeout(() => {
        onEntered?.();
      }, 750);

      return () => {
        clearInterval(interval);
        clearTimeout(enterTimer);
      };
    } else if (phase === "active") {
      setRevealedCount(20);
    } else if (phase === "exiting") {
      const exitTimer = setTimeout(() => {
        onExited?.();
      }, 600);
      return () => clearTimeout(exitTimer);
    }
  }, [phase, onEntered, onExited]);

  const isExiting = phase === "exiting";

  const fontStyle = {
    fontFamily: fontLoaded ? "var(--font-instrument-serif), serif" : "var(--font-geist-sans), sans-serif",
    fontStyle: "italic" as const,
  };

  return (
    <div
      className="w-full text-center select-none transition-all duration-600 ease-[cubic-bezier(0.22,1,0.36,1)] leading-tight"
      style={{
        ...fontStyle,
        opacity: isExiting ? 0 : 1,
        filter: isExiting ? "blur(6px)" : "blur(0px)",
        transform: isExiting ? "scale(0.98) translateY(-6px)" : "scale(1) translateY(0)",
      }}
    >
      <div className="text-[clamp(1.75rem,4.4vw,3.75rem)] text-[var(--fg)] tracking-tight">
        <span className="block sm:inline sm:mr-3 whitespace-nowrap">
          {FIRST_NAME.split("").map((char, i) => {
            const isResolved = phase === "active" || i < revealedCount;
            return (
              <span
                key={i}
                className="inline-block transition-all duration-300 ease-out"
                style={{
                  opacity: isResolved ? 1 : 0,
                  filter: isResolved ? "blur(0px)" : "blur(8px)",
                  transform: isResolved ? "translateY(0)" : "translateY(6px)",
                }}
              >
                {char}
              </span>
            );
          })}
        </span>
        <span className="block sm:inline whitespace-nowrap">
          {LAST_NAME.split("").map((char, i) => {
            const globalIdx = i + 10;
            const isResolved = phase === "active" || globalIdx < revealedCount;
            return (
              <span
                key={i}
                className="inline-block transition-all duration-300 ease-out"
                style={{
                  opacity: isResolved ? 1 : 0,
                  filter: isResolved ? "blur(0px)" : "blur(8px)",
                  transform: isResolved ? "translateY(0)" : "translateY(6px)",
                }}
              >
                {char}
              </span>
            );
          })}
        </span>
      </div>
    </div>
  );
}
