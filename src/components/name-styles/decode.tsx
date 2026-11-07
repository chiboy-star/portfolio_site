"use client";

import * as React from "react";
import { NameStyleProps } from "./types";
import { waitForFont } from "@/lib/fonts";

const TARGET_FIRST = "CHINEMEREM";
const TARGET_LAST = "MADUEKE";
const GLYPHS = "01_/*\\#><[]{}~+=?!";

export function DecodeStyle({
  phase,
  onEntered,
  onExited,
}: NameStyleProps) {
  const [fontLoaded, setFontLoaded] = React.useState(false);
  const [displayFirst, setDisplayFirst] = React.useState(TARGET_FIRST);
  const [displayLast, setDisplayLast] = React.useState(TARGET_LAST);

  React.useEffect(() => {
    let cancelled = false;
    waitForFont("Major Mono Display", "400").then((loaded) => {
      if (!cancelled) setFontLoaded(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    let animId: number;
    const startTime = performance.now();
    const duration = 800; // ms

    if (phase === "entering") {
      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        const lockCountFirst = Math.floor(progress * TARGET_FIRST.length);
        const lockCountLast = Math.floor(progress * TARGET_LAST.length);

        let resFirst = "";
        for (let i = 0; i < TARGET_FIRST.length; i++) {
          if (i < lockCountFirst) {
            resFirst += TARGET_FIRST[i];
          } else {
            resFirst += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          }
        }

        let resLast = "";
        for (let i = 0; i < TARGET_LAST.length; i++) {
          if (i < lockCountLast) {
            resLast += TARGET_LAST[i];
          } else {
            resLast += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          }
        }

        setDisplayFirst(resFirst);
        setDisplayLast(resLast);

        if (progress < 1) {
          animId = requestAnimationFrame(step);
        } else {
          setDisplayFirst(TARGET_FIRST);
          setDisplayLast(TARGET_LAST);
          onEntered?.();
        }
      };

      animId = requestAnimationFrame(step);
      return () => cancelAnimationFrame(animId);
    } else if (phase === "active") {
      setDisplayFirst(TARGET_FIRST);
      setDisplayLast(TARGET_LAST);
    } else if (phase === "exiting") {
      const exitDuration = 550;
      const stepExit = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / exitDuration);
        const unlockFirst = Math.floor(progress * TARGET_FIRST.length);
        const unlockLast = Math.floor(progress * TARGET_LAST.length);

        let resFirst = "";
        for (let i = 0; i < TARGET_FIRST.length; i++) {
          if (i < unlockFirst) {
            resFirst += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          } else {
            resFirst += TARGET_FIRST[i];
          }
        }

        let resLast = "";
        for (let i = 0; i < TARGET_LAST.length; i++) {
          if (i < unlockLast) {
            resLast += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          } else {
            resLast += TARGET_LAST[i];
          }
        }

        setDisplayFirst(resFirst);
        setDisplayLast(resLast);

        if (progress < 1) {
          animId = requestAnimationFrame(stepExit);
        } else {
          onExited?.();
        }
      };

      animId = requestAnimationFrame(stepExit);
      return () => cancelAnimationFrame(animId);
    }
  }, [phase, onEntered, onExited]);

  return (
    <div
      className="w-full text-center select-none leading-tight"
      style={{
        fontFamily: fontLoaded ? "var(--font-major-mono-display), monospace" : "var(--font-geist-mono), monospace",
      }}
    >
      <span className="text-[clamp(1.2rem,2.8vw,2.5rem)] text-[var(--fg)] tracking-[0.14em] uppercase">
        <span className="block sm:inline">{displayFirst} </span>
        <span className="block sm:inline">{displayLast}</span>
      </span>
    </div>
  );
}
