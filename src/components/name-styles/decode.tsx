"use client";

import * as React from "react";
import { NameStyleProps } from "./types";

const TARGET = "CHINEMEREM MADUEKE";
const GLYPHS = "01_/*\\#><[]{}~+=?!";

export function DecodeStyle({
  phase,
  onEntered,
  onExited,
}: NameStyleProps) {
  const [display, setDisplay] = React.useState(TARGET);

  React.useEffect(() => {
    let animId: number;
    const startTime = performance.now();
    const duration = 800; // ms

    if (phase === "entering") {
      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        const lockCount = Math.floor(progress * TARGET.length);

        let result = "";
        for (let i = 0; i < TARGET.length; i++) {
          if (TARGET[i] === " ") {
            result += " ";
          } else if (i < lockCount) {
            result += TARGET[i];
          } else {
            result += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          }
        }
        setDisplay(result);

        if (progress < 1) {
          animId = requestAnimationFrame(step);
        } else {
          setDisplay(TARGET);
          onEntered?.();
        }
      };

      animId = requestAnimationFrame(step);
      return () => cancelAnimationFrame(animId);
    } else if (phase === "exiting") {
      const exitDuration = 600;
      const stepExit = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / exitDuration);
        const unlockCount = Math.floor(progress * TARGET.length);

        let result = "";
        for (let i = 0; i < TARGET.length; i++) {
          if (TARGET[i] === " ") {
            result += " ";
          } else if (i < unlockCount) {
            result += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          } else {
            result += TARGET[i];
          }
        }
        setDisplay(result);

        if (progress < 1) {
          animId = requestAnimationFrame(stepExit);
        } else {
          onExited?.();
        }
      };

      animId = requestAnimationFrame(stepExit);
      return () => cancelAnimationFrame(animId);
    } else {
      setDisplay(TARGET);
    }
  }, [phase, onEntered, onExited]);

  const isExiting = phase === "exiting";

  return (
    <div
      className="w-full py-6 text-center select-none font-mono transition-opacity duration-500"
      style={{ opacity: isExiting ? 0.2 : 1 }}
    >
      <span className="text-2xl sm:text-4xl lg:text-6xl font-medium tracking-widest text-[var(--fg)] uppercase">
        {display}
      </span>
    </div>
  );
}

