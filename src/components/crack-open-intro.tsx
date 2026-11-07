"use client";

import * as React from "react";

export function CrackOpenIntro() {
  // Always true initially on server and client to preserve 100% hydration parity.
  // CSS rule `html[data-intro="skip"] #crack-open-intro { display: none !important; }`
  // instantly hides it before paint if skipped, with zero layout flash or React mismatch.
  const [visible, setVisible] = React.useState(true);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const wordmarkRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    // Check if intro is skipped by tier-script, preferences, or sessionStorage
    if (typeof window === "undefined") return;
    const isSkip =
      document.documentElement.getAttribute("data-intro") === "skip" ||
      (!window.location.search.includes("intro=1") && Boolean(sessionStorage.getItem("introSeen")));
    if (isSkip) {
      document.documentElement.setAttribute("data-intro", "skip");
      setVisible(false);
      return;
    }

    const canvas = canvasRef.current;
    const wordmark = wordmarkRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Immediately size and paint solid #0A0A0B ink slab on canvas at mount
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.fillStyle = "#0A0A0B";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let animId: number;
    const startTime = performance.now();
    const holdDuration = 400; // 0 to 400ms hold
    const ringStepInterval = 90; // 90ms per Chebyshev ring step
    const totalSteps = 7;
    const liftDuration = 300; // 1300 to 1600ms wordmark lift & fade
    const totalDuration = holdDuration + (totalSteps * ringStepInterval) + liftDuration; // ~1330ms (<= 1.6s)

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

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
        // Full solid ink slab
        ctx.fillStyle = "#0A0A0B";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        canvas.setAttribute("data-intro-phase", "hold");
      } else {
        const ringElapsed = elapsed - holdDuration;
        const currentStep = Math.min(totalSteps + 1, Math.floor(ringElapsed / ringStepInterval));
        canvas.setAttribute("data-intro-phase", `step-${currentStep}`);

        ctx.fillStyle = "#0A0A0B";
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
        animId = requestAnimationFrame(render);
      } else {
        try {
          sessionStorage.setItem("introSeen", "true");
        } catch {
          // ignore
        }
        document.documentElement.setAttribute("data-intro", "skip");
        setVisible(false);
      }
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

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
          __html: `(function(){var c=document.getElementById('crack-open-canvas');if(c&&document.documentElement.getAttribute('data-intro')!=='skip'){c.width=window.innerWidth;c.height=window.innerHeight;var x=c.getContext('2d');if(x){x.fillStyle='#0A0A0B';x.fillRect(0,0,c.width,c.height);c.setAttribute('data-intro-phase','hold');}}})();`,
        }}
      />

      {/* Stacked Wordmark: "CHINEMEREM" over "MADUEKE", Geist 800, skewX(-10deg) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-4">
        <div
          ref={wordmarkRef}
          style={{
            transform: "skewX(-10deg) scale(1.04)",
            lineHeight: 0.85,
            width: "min(70vw, 980px)",
          }}
          className="text-center font-extrabold uppercase tracking-tight text-[#EDEDEE]"
        >
          <div className="text-[clamp(2.5rem,8vw,7.5rem)] tracking-[-0.04em]">
            <span className="text-[var(--accent)]">C</span>HINEMEREM
          </div>
          <div className="text-[clamp(2.5rem,8vw,7.5rem)] tracking-[-0.04em]">
            <span className="text-[var(--accent)]">M</span>ADUEKE
          </div>
        </div>
      </div>
    </div>
  );
}
