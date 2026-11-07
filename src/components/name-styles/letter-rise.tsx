"use client";

import * as React from "react";
import { NameStyleProps } from "./types";

const WORD = "CHINEMEREM MADUEKE";

export function LetterRiseStyle({
  phase,
  onEntered,
  onExited,
}: NameStyleProps) {
  const letters = React.useMemo(() => WORD.split(""), []);

  React.useEffect(() => {
    if (phase === "entering") {
      const timer = setTimeout(() => onEntered?.(), 800);
      return () => clearTimeout(timer);
    } else if (phase === "exiting") {
      const timer = setTimeout(() => onExited?.(), 650);
      return () => clearTimeout(timer);
    }
  }, [phase, onEntered, onExited]);

  const isEntering = phase === "entering";
  const isExiting = phase === "exiting";

  return (
    <div className="w-full py-6 text-center select-none overflow-hidden">
      <div className="inline-flex flex-wrap justify-center text-3xl sm:text-5xl lg:text-7xl font-light tracking-wider text-[var(--fg)] uppercase">
        {letters.map((char, index) => {
          if (char === " ") {
            return <span key={index} className="inline-block w-[0.35em]" />;
          }

          const delay = isEntering
            ? `${index * 32}ms`
            : `${(letters.length - 1 - index) * 20}ms`;

          const transform = isEntering
            ? "translateY(110%)"
            : isExiting
            ? "translateY(-110%)"
            : "translateY(0%)";

          return (
            <span
              key={index}
              className="inline-block overflow-hidden pb-1"
            >
              <span
                className="inline-block transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  transform,
                  transitionDelay: delay,
                }}
              >
                {char}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

