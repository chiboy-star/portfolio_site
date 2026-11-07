"use client";

import * as React from "react";
import { NameStyleProps } from "./types";

const TEXT = "CHINEMEREM MADUEKE";

export function SliceStyle({
  phase,
  onEntered,
  onExited,
}: NameStyleProps) {
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
    { clip: "polygon(0% 0%, 100% 0%, 100% 34%, 0% 34%)", offset: -36 },
    { clip: "polygon(0% 33%, 100% 33%, 100% 67%, 0% 67%)", offset: 36 },
    { clip: "polygon(0% 66%, 100% 66%, 100% 100%, 0% 100%)", offset: -36 },
  ];

  return (
    <div className="relative w-full py-6 select-none flex items-center justify-center overflow-hidden">
      {/* Invisible sizer element */}
      <div className="invisible text-3xl sm:text-5xl lg:text-7xl font-extralight tracking-widest uppercase py-1">
        {TEXT}
      </div>

      {/* 3 Sliced Layers */}
      {bands.map((band, idx) => {
        const xOffset = isEntering
          ? `${band.offset}px`
          : isExiting
          ? `${-band.offset * 1.5}px`
          : "0px";

        return (
          <div
            key={idx}
            className="absolute inset-0 flex items-center justify-center transition-all duration-650 ease-[cubic-bezier(0.22,1,0.36,1)] pointer-events-none"
            style={{
              clipPath: band.clip,
              transform: `translateX(${xOffset})`,
              opacity: isEntering || isExiting ? 0 : 1,
            }}
          >
            <span className="text-3xl sm:text-5xl lg:text-7xl font-extralight tracking-widest text-[var(--fg)] uppercase py-1">
              {TEXT}
            </span>
          </div>
        );
      })}
    </div>
  );
}

