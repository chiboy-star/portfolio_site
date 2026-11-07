"use client";

import * as React from "react";
import { NameStyleProps } from "./types";
import { waitForFont } from "@/lib/fonts";

export function SliceStyle({
  phase,
  onEntered,
  onExited,
}: NameStyleProps) {
  const [fontLoaded, setFontLoaded] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    waitForFont("Anton", "400").then((loaded) => {
      if (!cancelled) setFontLoaded(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (phase === "entering") {
      const timer = setTimeout(() => onEntered?.(), 750);
      return () => clearTimeout(timer);
    } else if (phase === "exiting") {
      const timer = setTimeout(() => onExited?.(), 600);
      return () => clearTimeout(timer);
    }
  }, [phase, onEntered, onExited]);

  const isEntering = phase === "entering";
  const isExiting = phase === "exiting";

  const bands = [
    { clip: "polygon(0% 0%, 100% 0%, 100% 34%, 0% 34%)", offset: -32 },
    { clip: "polygon(0% 33%, 100% 33%, 100% 67%, 0% 67%)", offset: 32 },
    { clip: "polygon(0% 66%, 100% 66%, 100% 100%, 0% 100%)", offset: -32 },
  ];

  const fontStyle = {
    fontFamily: fontLoaded ? "var(--font-anton), sans-serif" : "var(--font-geist-sans), sans-serif",
  };

  const renderedText = (
    <span className="text-[clamp(1.75rem,4.2vw,3.6rem)] font-normal tracking-[0.06em] uppercase leading-tight text-[var(--fg)]">
      <span className="block sm:inline">CHINEMEREM </span>
      <span className="block sm:inline">MADUEKE</span>
    </span>
  );

  return (
    <div className="relative w-full select-none flex items-center justify-center overflow-hidden">
      {/* Invisible spacer for exact layout measurement */}
      <div className="invisible leading-tight select-none pointer-events-none" style={fontStyle}>
        {renderedText}
      </div>

      {/* 3 Sliced Layers with clip-path */}
      {bands.map((band, idx) => {
        const xOffset = isEntering
          ? `${band.offset}px`
          : isExiting
          ? `${-band.offset * 1.4}px`
          : "0px";

        return (
          <div
            key={idx}
            className="absolute inset-0 flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] pointer-events-none"
            style={{
              ...fontStyle,
              clipPath: band.clip,
              transform: `translateX(${xOffset})`,
              opacity: isEntering || isExiting ? 0 : 1,
            }}
          >
            {renderedText}
          </div>
        );
      })}
    </div>
  );
}
