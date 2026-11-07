"use client";

import * as React from "react";
import { NameStyleProps } from "./types";

const WORD = "CHINEMEREM MADUEKE";

export function WeightSweepStyle({
  phase,
  onEntered,
  onExited,
}: NameStyleProps) {
  const letters = React.useMemo(() => WORD.split(""), []);
  const [activeStep, setActiveStep] = React.useState(0);

  React.useEffect(() => {
    let animId: number;
    const startTime = performance.now();

    if (phase === "entering") {
      const duration = 850;
      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        setActiveStep(Math.floor(progress * (letters.length + 4)));
        if (progress < 1) {
          animId = requestAnimationFrame(step);
        } else {
          setActiveStep(999);
          onEntered?.();
        }
      };
      animId = requestAnimationFrame(step);
      return () => cancelAnimationFrame(animId);
    } else if (phase === "exiting") {
      const exitTimer = setTimeout(() => onExited?.(), 600);
      return () => clearTimeout(exitTimer);
    }
  }, [phase, letters.length, onEntered, onExited]);

  const isExiting = phase === "exiting";

  return (
    <div
      className="w-full py-6 text-center select-none transition-opacity duration-600"
      style={{ opacity: isExiting ? 0 : 1 }}
    >
      <div className="inline-flex flex-wrap justify-center text-3xl sm:text-5xl lg:text-7xl tracking-widest text-[var(--fg)] uppercase">
        {letters.map((char, idx) => {
          if (char === " ") {
            return <span key={idx} className="inline-block w-[0.35em]" />;
          }

          // Compute weight based on distance from active wave front
          let weight = 200;
          if (activeStep < 999) {
            const dist = Math.abs(idx - activeStep);
            if (dist === 0) weight = 800;
            else if (dist === 1) weight = 600;
            else if (dist === 2) weight = 400;
          } else {
            weight = 300;
          }

          return (
            <span
              key={idx}
              className="inline-block transition-[font-weight] duration-200"
              style={{ fontWeight: isExiting ? 100 : weight }}
            >
              {char}
            </span>
          );
        })}
      </div>
    </div>
  );
}

