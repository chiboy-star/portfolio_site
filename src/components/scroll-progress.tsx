"use client";

import * as React from "react";

export function ScrollProgress() {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    let ticking = false;

    const updateScrollProgress = () => {
      const scrollY = window.scrollY;
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const currentProgress = totalHeight > 0 ? (scrollY / totalHeight) : 0;
      setProgress(Math.min(1, Math.max(0, currentProgress)));
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollProgress);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    updateScrollProgress();

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      role="progressbar"
      aria-label="Page scroll progress"
      aria-valuenow={Math.round(progress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="absolute bottom-0 left-0 right-0 h-[2px] bg-transparent overflow-hidden pointer-events-none"
    >
      <div
        className="h-full bg-[var(--accent)] origin-left transition-transform duration-75 ease-out"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  );
}

