"use client";

import * as React from "react";
import { useTier } from "@/hooks/use-tier";

interface Particle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  size: number;
  type: "fg" | "accent" | "muted";
}

export interface ParticleWordmarkProps {
  onFrameDrawn?: (count: number) => void;
  onFail?: () => void;
  phase?: "entering" | "active" | "exiting";
  onEntered?: () => void;
  onExited?: () => void;
}

export function ParticleWordmark({
  onFrameDrawn,
  onFail,
  phase = "active",
  onEntered,
  onExited,
}: ParticleWordmarkProps) {
  const tier = useTier();
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const isInteracting = React.useRef(false);
  const pointerPos = React.useRef({ x: -1000, y: -1000 });
  const animFrameId = React.useRef<number | null>(null);
  const isSettled = React.useRef(false);
  const isVisible = React.useRef(true);
  const firstFrameDrawnRef = React.useRef(false);
  const colorsRef = React.useRef({ fg: "#EDEDEE", accent: "#F5A524", muted: "#8D8D94" });

  // Handle phase exit callback
  React.useEffect(() => {
    if (phase === "exiting") {
      const exitTimer = setTimeout(() => onExited?.(), 600);
      return () => clearTimeout(exitTimer);
    }
  }, [phase, onExited]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      onFail?.();
      return;
    }

    // 1.5-second timeout safeguard: if first particle frame does not draw, fail gracefully
    const failTimeout = setTimeout(() => {
      if (!firstFrameDrawnRef.current) {
        console.warn("[Particles] 1.5s timeout exceeded before first frame drew. Falling back.");
        onFail?.();
      }
    }, 1500);

    let particles: Particle[] = [];
    let isAssembling = true;
    let assembleStart = performance.now();
    const assembleDuration = 900; // ms

    // Initialize color tokens from CSS variables
    const readColors = () => {
      const style = getComputedStyle(document.documentElement);
      const fg = style.getPropertyValue("--fg").trim() || (document.documentElement.classList.contains("dark") ? "#EDEDEE" : "#111113");
      const accent = style.getPropertyValue("--accent").trim() || (document.documentElement.classList.contains("dark") ? "#F5A524" : "#B45309");
      const muted = style.getPropertyValue("--muted").trim() || (document.documentElement.classList.contains("dark") ? "#8D8D94" : "#5E5E66");
      colorsRef.current = { fg, accent, muted };
    };
    readColors();

    const updateColors = () => {
      readColors();
      wakeAnimation();
    };

    const themeObserver = new MutationObserver(updateColors);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    const initParticles = async () => {
      // 1. Wait for Geist font to be fully loaded
      try {
        if ("fonts" in document) {
          await Promise.race([
            Promise.all([
              document.fonts.load("500 200px Geist"),
              document.fonts.ready,
            ]),
            new Promise((resolve) => setTimeout(resolve, 600)),
          ]);
        }
      } catch {
        // Fallback gracefully
      }

      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = rect.width || window.innerWidth;
      const isMobile = width < 640;
      const height = isMobile ? 180 : Math.min(Math.max(width * 0.18, 140), 220);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      // 2. Offscreen canvas for sampling
      const offCanvas = document.createElement("canvas");
      offCanvas.width = canvas.width;
      offCanvas.height = canvas.height;
      const offCtx = offCanvas.getContext("2d", { willReadFrequently: true });
      if (!offCtx) {
        onFail?.();
        return;
      }

      offCtx.scale(dpr, dpr);

      // Fit text to ~80% container width
      let fontSize = isMobile ? Math.floor(width * 0.12) : Math.floor(width * 0.065);
      fontSize = Math.min(Math.max(fontSize, 24), 88);

      const computedFont =
        getComputedStyle(container).fontFamily ||
        "Geist, -apple-system, BlinkMacSystemFont, sans-serif";
      offCtx.font = `500 ${fontSize}px ${computedFont}`;
      offCtx.fillStyle = "#ffffff";
      offCtx.textAlign = "center";
      offCtx.textBaseline = "middle";

      // Measure and fit
      const textToMeasure = isMobile ? "CHINEMEREM" : "CHINEMEREM MADUEKE";
      const textWidth = offCtx.measureText(textToMeasure).width;
      const targetWidth = width * 0.82;
      if (textWidth > targetWidth && targetWidth > 0) {
        fontSize = Math.floor(fontSize * (targetWidth / textWidth));
        offCtx.font = `500 ${fontSize}px ${computedFont}`;
      }

      if (isMobile) {
        offCtx.fillText("CHINEMEREM", width / 2, height * 0.35);
        offCtx.fillText("MADUEKE", width / 2, height * 0.68);
      } else {
        offCtx.fillText("CHINEMEREM MADUEKE", width / 2, height / 2);
      }

      const imgData = offCtx.getImageData(0, 0, canvas.width, canvas.height).data;
      particles = [];

      // Sample every 2 CSS pixels
      const step = Math.max(1, Math.round(2 * dpr));
      let minX = width, maxX = 0, minY = height, maxY = 0;

      for (let py = 0; py < canvas.height; py += step) {
        for (let px = 0; px < canvas.width; px += step) {
          const index = (py * canvas.width + px) * 4;
          const alpha = imgData[index + 3];

          if (alpha >= 128) {
            const posX = px / dpr;
            const posY = py / dpr;

            if (posX < minX) minX = posX;
            if (posX > maxX) maxX = posX;
            if (posY < minY) minY = posY;
            if (posY > maxY) maxY = posY;

            // ±0.6px jitter for dusty texture
            const jitterX = (Math.random() - 0.5) * 1.2;
            const jitterY = (Math.random() - 0.5) * 1.2;
            const homeX = posX + jitterX;
            const homeY = posY + jitterY;

            // Roll particle color category: ~8% accent, ~5% muted, ~87% fg
            const roll = Math.random();
            const type = roll < 0.08 ? "accent" : roll < 0.13 ? "muted" : "fg";
            const size = type === "accent" ? (Math.random() * 1.2 + 1.3) : (Math.random() * 1.0 + 1.0);

            // Initial scatter position for assembly animation
            const scatterX = homeX + (Math.random() - 0.5) * width * 0.8;
            const scatterY = homeY + (Math.random() - 0.5) * height * 0.8;

            particles.push({
              x: scatterX,
              y: scatterY,
              originX: homeX,
              originY: homeY,
              vx: 0,
              vy: 0,
              size,
              type,
            });
          }
        }
      }

      if (particles.length === 0) {
        onFail?.();
        return;
      }

      // Check debug param
      if (typeof window !== "undefined" && window.location.search.includes("debug=particles")) {
        console.log(`[Particles Debug] Total particles sampled: ${particles.length}`);
        console.log(`[Particles Debug] Bounding Box: x=[${minX.toFixed(1)}, ${maxX.toFixed(1)}], y=[${minY.toFixed(1)}, ${maxY.toFixed(1)}]`);
      }

      isAssembling = true;
      assembleStart = performance.now();
      isSettled.current = false;
      renderFrame();

      firstFrameDrawnRef.current = true;
      clearTimeout(failTimeout);
      onFrameDrawn?.(particles.length);

      setTimeout(() => onEntered?.(), assembleDuration);
    };

    const renderFrame = () => {
      if (!ctx || !isVisible.current) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const now = performance.now();
      const elapsedAssemble = now - assembleStart;
      const assembleProgress = Math.min(1, elapsedAssemble / assembleDuration);
      // Ease out cubic
      const assembleEase = 1 - Math.pow(1 - assembleProgress, 3);

      if (assembleProgress >= 1) {
        isAssembling = false;
      }

      let totalKineticEnergy = 0;
      const mouseRadius = 100;
      const mouseRadiusSq = mouseRadius * mouseRadius;

      // Group draw calls by color for performance
      const { fg, accent, muted } = colorsRef.current;

      const fgList: Particle[] = [];
      const accentList: Particle[] = [];
      const mutedList: Particle[] = [];

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (isAssembling) {
          // Animate from scatter toward home
          p.x = p.x + (p.originX - p.x) * (assembleEase * 0.15 + 0.05);
          p.y = p.y + (p.originY - p.y) * (assembleEase * 0.15 + 0.05);
          totalKineticEnergy += 1;
        } else if (tier === "full") {
          // Pointer repulsion
          const dx = p.x - pointerPos.current.x;
          const dy = p.y - pointerPos.current.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < mouseRadiusSq && distSq > 0) {
            const dist = Math.sqrt(distSq);
            const force = (1 - dist / mouseRadius) * 9;
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
          }

          // Spring back to origin
          const springX = (p.originX - p.x) * 0.085;
          const springY = (p.originY - p.y) * 0.085;
          p.vx = (p.vx + springX) * 0.78;
          p.vy = (p.vy + springY) * 0.78;

          p.x += p.vx;
          p.y += p.vy;

          const energy = Math.abs(p.vx) + Math.abs(p.vy);
          totalKineticEnergy += energy;
        }

        if (p.type === "accent") accentList.push(p);
        else if (p.type === "muted") mutedList.push(p);
        else fgList.push(p);
      }

      // Draw FG particles
      ctx.fillStyle = fg;
      ctx.beginPath();
      for (let i = 0; i < fgList.length; i++) {
        const p = fgList[i];
        ctx.rect(p.x, p.y, p.size, p.size);
      }
      ctx.fill();

      // Draw Accent particles
      ctx.fillStyle = accent;
      ctx.beginPath();
      for (let i = 0; i < accentList.length; i++) {
        const p = accentList[i];
        ctx.rect(p.x, p.y, p.size, p.size);
      }
      ctx.fill();

      // Draw Muted particles
      ctx.fillStyle = muted;
      ctx.beginPath();
      for (let i = 0; i < mutedList.length; i++) {
        const p = mutedList[i];
        ctx.rect(p.x, p.y, p.size, p.size);
      }
      ctx.fill();

      // Render 24px ring cursor with 1px accent border if fine pointer
      if (tier === "full" && pointerPos.current.x > 0 && pointerPos.current.x < width) {
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(pointerPos.current.x, pointerPos.current.y, 12, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Debug overlay if ?debug=particles
      if (typeof window !== "undefined" && window.location.search.includes("debug=particles")) {
        ctx.strokeStyle = "rgba(255, 0, 0, 0.4)";
        ctx.strokeRect(10, 10, width - 20, height - 20);
        ctx.fillStyle = "#F5A524";
        ctx.font = "12px monospace";
        ctx.fillText(`Particles: ${particles.length}`, 15, 25);
      }

      ctx.restore();

      // Stop rAF loop when settled and idle
      if (!isAssembling && totalKineticEnergy < 0.08 && !isInteracting.current) {
        isSettled.current = true;
        animFrameId.current = null;
      } else {
        animFrameId.current = requestAnimationFrame(renderFrame);
      }
    };

    const wakeAnimation = () => {
      if (isSettled.current && isVisible.current) {
        isSettled.current = false;
        if (!animFrameId.current) {
          animFrameId.current = requestAnimationFrame(renderFrame);
        }
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (tier !== "full") return;
      const rect = canvas.getBoundingClientRect();
      pointerPos.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      isInteracting.current = true;
      wakeAnimation();
    };

    const handlePointerLeave = () => {
      pointerPos.current = { x: -1000, y: -1000 };
      isInteracting.current = false;
      wakeAnimation();
    };

    // IntersectionObserver to pause when off-screen
    const observer = new IntersectionObserver(([entry]) => {
      isVisible.current = entry.isIntersecting;
      if (entry.isIntersecting) {
        wakeAnimation();
      } else if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
        animFrameId.current = null;
      }
    });

    observer.observe(container);
    initParticles();

    if (tier === "full") {
      canvas.addEventListener("pointermove", handlePointerMove);
      canvas.addEventListener("pointerleave", handlePointerLeave);
    }

    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(initParticles, 150);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(failTimeout);
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      themeObserver.disconnect();
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [tier, onFail, onFrameDrawn, onEntered]);

  const isExiting = phase === "exiting";

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden select-none transition-all duration-600 ease-[cubic-bezier(0.22,1,0.36,1)]"
      style={{
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? "scale(0.98)" : "scale(1)",
      }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="block mx-auto cursor-crosshair touch-none"
      />
    </div>
  );
}
