"use client";

import * as React from "react";
import { NameStyleProps } from "./types";
import { waitForFont } from "@/lib/fonts";

const FIRST_NAME = "CHINEMEREM";
const LAST_NAME = "MADUEKE";

export function WeightSweepStyle({
  phase,
  onEntered,
  onExited,
}: NameStyleProps) {
  const [fontLoaded, setFontLoaded] = React.useState(false);
  const [wavePos, setWavePos] = React.useState(-4);

  React.useEffect(() => {
    let cancelled = false;
    waitForFont("Fraunces", "400").then((loaded) => {
      if (!cancelled) setFontLoaded(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    let animId: number;
    const startTime = performance.now();
    const duration = 850; // ms

    if (phase === "entering") {
      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        // Sweep across 18 characters + 4 padding
        setWavePos(progress * 24 - 2);

        if (progress < 1) {
          animId = requestAnimationFrame(step);
        } else {
          setWavePos(999);
          onEntered?.();
        }
      };

      animId = requestAnimationFrame(step);
      return () => cancelAnimationFrame(animId);
    } else if (phase === "active") {
      setWavePos(999);
    } else if (phase === "exiting") {
      const exitTimer = setTimeout(() => {
        onExited?.();
      }, 600);
      return () => clearTimeout(exitTimer);
    }
  }, [phase, onEntered, onExited]);

  const isExiting = phase === "exiting";

  const getWeight = (idx: number) => {
    if (wavePos >= 999) return 400;
    const dist = Math.abs(idx - wavePos);
    if (dist < 1) return 900;
    if (dist < 2) return 700;
    if (dist < 3) return 400;
    if (dist < 4) return 200;
    return 100;
  };

  const fontStyle = {
    fontFamily: fontLoaded ? "var(--font-fraunces), serif" : "var(--font-geist-sans), sans-serif",
  };

  return (
    <div
      className="w-full text-center select-none transition-all duration-600 ease-[cubic-bezier(0.22,1,0.36,1)] leading-tight"
      style={{
        ...fontStyle,
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? "scale(0.97)" : "scale(1)",
      }}
    >
      <div className="text-[clamp(1.5rem,3.8vw,3.2rem)] text-[var(--fg)] tracking-[0.06em] uppercase">
        <span className="block sm:inline sm:mr-3 whitespace-nowrap">
          {FIRST_NAME.split("").map((char, i) => (
            <span
              key={i}
              className="inline-block transition-[font-weight] duration-150"
              style={{ fontWeight: getWeight(i) }}
            >
              {char}
            </span>
          ))}
        </span>
        <span className="block sm:inline whitespace-nowrap">
          {LAST_NAME.split("").map((char, i) => (
            <span
              key={i}
              className="inline-block transition-[font-weight] duration-150"
              style={{ fontWeight: getWeight(i + 11) }}
            >
              {char}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}
