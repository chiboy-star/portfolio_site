"use client";

import * as React from "react";

export function CrackOpenIntro() {
  const [active, setActive] = React.useState(false);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    // Check if intro has already run or disabled via URL
    if (typeof window === "undefined") return;
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("intro") === "0") return;
    if (sessionStorage.getItem("portfolio_intro_seen")) return;

    // Check reduced motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    setActive(true);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let startTime: number | null = null;
    const duration = 1000; // ms

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();

    const cols = 14;
    const cellSize = Math.ceil(window.innerWidth / cols);
    const rows = Math.ceil(window.innerHeight / cellSize);

    const centerX = Math.floor(cols / 2);
    const centerY = Math.floor(rows / 2);

    const maxDist = Math.hypot(centerX, centerY);

    const render = (time: number) => {
      if (!startTime) startTime = time;
      const elapsed = time - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentRadius = eased * (maxDist + 2);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const isDark = document.documentElement.classList.contains("dark");
      ctx.fillStyle = isDark ? "#0A0A0B" : "#FAFAF7";

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          // Manhattan / Chebyshev stepped distance for pixel-staircase crack effect
          const dist = Math.hypot(c - centerX, r - centerY);
          if (dist >= currentRadius) {
            ctx.fillRect(c * cellSize, r * cellSize, cellSize + 0.5, cellSize + 0.5);
          }
        }
      }

      if (progress < 1) {
        animId = requestAnimationFrame(render);
      } else {
        sessionStorage.setItem("portfolio_intro_seen", "true");
        setActive(false);
      }
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-50 pointer-events-none"
      aria-hidden="true"
    />
  );
}

