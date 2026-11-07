"use client";

import * as React from "react";
import { NameStyleProps } from "./types";
import { waitForFont } from "@/lib/fonts";

const TILTS = [-2.2, 1.8, -1.4, 2.5, -2.7, 1.2, -1.9, 2.1, -1.1, 0, 2.4, -1.7, 2.0, -2.3, 1.5, -1.2, 2.6, -1.8];

export function MarkerScrawlStyle({
  phase,
  onEntered,
  onExited,
}: NameStyleProps) {
  const [fontLoaded, setFontLoaded] = React.useState(false);
  const [revealedCount, setRevealedCount] = React.useState(0);
  const [drawUnderline, setDrawUnderline] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    waitForFont("Permanent Marker", "400").then((loaded) => {
      if (!cancelled) setFontLoaded(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const nameParts = [
    { word: "CHINEMEREM", offset: 0 },
    { word: "MADUEKE", offset: 11 },
  ];

  React.useEffect(() => {
    if (phase === "entering") {
      setRevealedCount(0);
      setDrawUnderline(false);

      const letterInterval = setInterval(() => {
        setRevealedCount((prev) => {
          if (prev >= 18) {
            clearInterval(letterInterval);
            return 18;
          }
          return prev + 1;
        });
      }, 22);

      const underlineTimer = setTimeout(() => {
        setDrawUnderline(true);
      }, 420);

      const enterTimer = setTimeout(() => {
        onEntered?.();
      }, 820);

      return () => {
        clearInterval(letterInterval);
        clearTimeout(underlineTimer);
        clearTimeout(enterTimer);
      };
    } else if (phase === "active") {
      setRevealedCount(18);
      setDrawUnderline(true);
    } else if (phase === "exiting") {
      const exitTimer = setTimeout(() => {
        onExited?.();
      }, 600);
      return () => clearTimeout(exitTimer);
    }
  }, [phase, onEntered, onExited]);

  const isExiting = phase === "exiting";

  return (
    <div
      className="w-full text-center select-none transition-all duration-600 ease-[cubic-bezier(0.22,1,0.36,1)]"
      style={{
        fontFamily: fontLoaded ? "var(--font-permanent-marker), cursive" : "var(--font-geist-sans), sans-serif",
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? "scale(0.96) translateY(-8px)" : "scale(1) translateY(0)",
      }}
    >
      <div className="text-[clamp(1.5rem,3.6vw,3.1rem)] text-[var(--fg)] tracking-wider leading-none">
        {nameParts.map((part, pIdx) => (
          <span key={pIdx} className="block sm:inline whitespace-nowrap sm:mx-2">
            {part.word.split("").map((char, cIdx) => {
              const globalIdx = part.offset + cIdx;
              const isVisible = phase === "active" || globalIdx < revealedCount;
              const tilt = TILTS[globalIdx % TILTS.length] || 0;

              return (
                <span
                  key={cIdx}
                  className="inline-block transition-all duration-200"
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible
                      ? `rotate(${tilt}deg) translateY(0)`
                      : `rotate(${tilt}deg) translateY(12px)`,
                  }}
                >
                  {char}
                </span>
              );
            })}
          </span>
        ))}
      </div>

      {/* SVG scribble underline drawn with stroke-dashoffset */}
      <div className="mt-2 flex justify-center">
        <svg
          viewBox="0 0 320 20"
          className="w-48 sm:w-64 lg:w-80 h-3 text-[var(--accent)] overflow-visible"
          aria-hidden="true"
        >
          <path
            d="M 6 12 Q 80 4, 160 12 T 314 9"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: 330,
              strokeDashoffset: drawUnderline ? 0 : 330,
              transition: "stroke-dashoffset 420ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />
        </svg>
      </div>
    </div>
  );
}

