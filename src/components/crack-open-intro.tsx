"use client";

import * as React from "react";

export function CrackOpenIntro() {
  const [visible, setVisible] = React.useState(true);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const wordmarkRef = React.useRef<HTMLDivElement | null>(null);
  const animIdRef = React.useRef<number | null>(null);

  // Dedicated replay listener that persists throughout the session
  React.useEffect(() => {
    const handleReplay = () => {
      try {
        sessionStorage.removeItem("introSeen");
      } catch {
        // ignore
      }
      document.documentElement.setAttribute("data-intro", "play");
      setVisible(true);
    };

    window.addEventListener("intro:replay", handleReplay);
    return () => window.removeEventListener("intro:replay", handleReplay);
  }, []);

  // Animation lifecycle effect
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if intro is skipped by tier-script, preferences, or sessionStorage
    const isSkip =
      document.documentElement.getAttribute("data-intro") === "skip" ||
      (!window.location.search.includes("intro=1") && Boolean(sessionStorage.getItem("introSeen")));

    if (isSkip) {
      document.documentElement.setAttribute("data-intro", "skip");
      setVisible(false);
      window.dispatchEvent(new CustomEvent("intro:done"));
      return;
    }

    if (!visible) return;

    const canvas = canvasRef.current;
    const wordmark = wordmarkRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (animIdRef.current) {
      cancelAnimationFrame(animIdRef.current);
      animIdRef.current = null;
    }

    document.documentElement.setAttribute("data-intro", "play");

    const isDark = document.documentElement.classList.contains("dark");
    const slabColor = isDark ? "#F5A524" : "#0A0A0B";

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.fillStyle = slabColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (wordmark) {
      wordmark.style.transform = "skewX(-10deg) scale(1.04)";
      wordmark.style.opacity = "1";
    }

    const startTime = performance.now();
    const holdDuration = 400; // 0 to 400ms hold
    const ringStepInterval = 90; // 90ms per Chebyshev ring step
    const totalSteps = 7;
    const liftDuration = 300; // 1300 to 1600ms wordmark lift & fade
    const totalDuration = holdDuration + (totalSteps * ringStepInterval) + liftDuration; // ~1330ms (<= 1.6s)

    const cols = 14;
    const cellSize = Math.ceil(window.innerWidth / cols);
    const rows = Math.ceil(window.innerHeight / cellSize);
    const centerX = cols / 2;
    const centerY = rows / 2;
    const maxChebyshev = Math.max(centerX, centerY);

    const render = (now: number) => {
      const elapsed = now - startTime;

      // 1. Wordmark scaling (0 to 400ms: 1.04 -> 1.0)
      if (wordmark) {
        if (elapsed < holdDuration) {
          const t = elapsed / holdDuration;
          const scale = 1.04 - (0.04 * t);
          wordmark.style.transform = `skewX(-10deg) scale(${scale})`;
          wordmark.style.opacity = "1";
        } else if (elapsed < holdDuration + (totalSteps * ringStepInterval)) {
          wordmark.style.transform = "skewX(-10deg) scale(1)";
          wordmark.style.opacity = "1";
        } else {
          // 1300 to 1600ms: lift 8vh and fade
          const liftElapsed = elapsed - (holdDuration + (totalSteps * ringStepInterval));
          const liftProgress = Math.min(1, liftElapsed / liftDuration);
          const eased = Math.pow(liftProgress, 2);
          const translateY = -8 * eased;
          const opacity = 1 - liftProgress;
          wordmark.style.transform = `translateY(${translateY}vh) skewX(-10deg) scale(1)`;
          wordmark.style.opacity = `${opacity}`;
        }
      }

      // 2. Canvas Chebyshev Stepped Rings
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (elapsed < holdDuration) {
        // Full solid ink or amber slab
        ctx.fillStyle = slabColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        canvas.setAttribute("data-intro-phase", "hold");
      } else {
        const ringElapsed = elapsed - holdDuration;
        const currentStep = Math.min(totalSteps + 1, Math.floor(ringElapsed / ringStepInterval));
        canvas.setAttribute("data-intro-phase", `step-${currentStep}`);

        ctx.fillStyle = slabColor;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            // Chebyshev distance: max(|dx|, |dy|)
            const dx = Math.abs(c + 0.5 - centerX);
            const dy = Math.abs(r + 0.5 - centerY);
            const dist = Math.max(dx, dy);

            // Quantize distance into steps
            const ringIndex = Math.floor((dist / (maxChebyshev + 0.5)) * totalSteps);

            // Cells in rings >= currentStep are drawn solid, inner rings cleared (pixel staircase opening)
            if (ringIndex >= currentStep) {
              ctx.fillRect(c * cellSize, r * cellSize, cellSize + 0.5, cellSize + 0.5);
            }
          }
        }
      }

      if (elapsed < totalDuration) {
        animIdRef.current = requestAnimationFrame(render);
      } else {
        try {
          sessionStorage.setItem("introSeen", "true");
        } catch {
          // ignore
        }
        document.documentElement.setAttribute("data-intro", "skip");
        setVisible(false);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("intro:done"));
        }
      }
    };

    animIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      id="crack-open-intro"
      aria-hidden="true"
      className="fixed inset-0 z-50 pointer-events-none select-none overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        id="crack-open-canvas"
        className="absolute inset-0 h-full w-full pointer-events-none"
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){var c=document.getElementById('crack-open-canvas');if(c&&document.documentElement.getAttribute('data-intro')!=='skip'){c.width=window.innerWidth;c.height=window.innerHeight;var x=c.getContext('2d');if(x){var d=document.documentElement.classList.contains('dark');x.fillStyle=d?'#F5A524':'#0A0A0B';x.fillRect(0,0,c.width,c.height);c.setAttribute('data-intro-phase','hold');}}})();`,
        }}
      />

      {/* Stacked Wordmark: "CHINEMEREM" over "MADUEKE", Unbounded 900, skewX(-10deg) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-4">
        <div
          ref={wordmarkRef}
          style={{
            transform: "skewX(-10deg) scale(1.04)",
            lineHeight: 0.85,
            width: "min(70vw, 980px)",
            fontFamily: "var(--font-unbounded), sans-serif",
          }}
          className="text-center font-black uppercase tracking-tight text-[var(--intro-fg)]"
        >
          <div className="text-[clamp(2.5rem,8vw,7.5rem)] tracking-[-0.04em]">
            <span className="text-[#F5A524] dark:text-[#0A0A0B] dark:text-[1.15em] inline-block font-black">C</span>HINEMEREM
          </div>
          <div className="text-[clamp(2.5rem,8vw,7.5rem)] tracking-[-0.04em]">
            <span className="text-[#F5A524] dark:text-[#0A0A0B] dark:text-[1.15em] inline-block font-black">M</span>ADUEKE
          </div>
        </div>
      </div>
    </div>
  );
}
