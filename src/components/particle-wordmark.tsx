"use client";

import * as React from "react";
import { useTier } from "@/hooks/use-tier";
import { fontSyncopate } from "@/lib/fonts";
import { NameStyleProps } from "./name-styles/types";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  originX: number;
  originY: number;
  size: number;
  colorType: "fg" | "accent" | "muted";
}

interface ParticleWordmarkProps extends NameStyleProps {
  onFail?: () => void;
  onFrameDrawn?: (count: number) => void;
}

export function ParticleWordmark({
  phase,
  onEntered,
  onExited,
  onFail,
  onFrameDrawn,
}: ParticleWordmarkProps) {
  const tier = useTier();
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  const animFrameId = React.useRef<number | null>(null);
  const isSettled = React.useRef<boolean>(false);
  const isInteracting = React.useRef<boolean>(false);
  const pointerPos = React.useRef<{ x: number; y: number }>({ x: -1000, y: -1000 });
  const isVisible = React.useRef<boolean>(true);
  const firstFrameDrawnRef = React.useRef<boolean>(false);

  const colorsRef = React.useRef<{ fg: string; accent: string; muted: string }>({
    fg: "#EDEDEE",
    accent: "#F5A524",
    muted: "#8D8D94",
  });

  React.useEffect(() => {
    if (tier === "minimal") return;

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
      // 1. Ensure fonts are ready
      try {
        if ("fonts" in document) {
          await document.fonts.ready;
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

      // Measure text at 100px using valid CSS font family
      const syncopateFamily = `${fontSyncopate.style.fontFamily}, "Syncopate", sans-serif`;
      offCtx.font = `700 100px ${syncopateFamily}`;
      const textToMeasure = isMobile ? "CHINEMEREM" : "CHINEMEREM MADUEKE";
      const measuredWidthAt100 = offCtx.measureText(textToMeasure).width || 1400;

      // Formula from prompt: fontSize = containerWidth * 0.8 / measuredWidthAt100 * 100
      let fontSize = (width * 0.8 / measuredWidthAt100) * 100;

      // Capped so cap height does not exceed container height
      const maxCapHeight = isMobile ? height * 0.42 : height * 0.58;
      fontSize = Math.min(fontSize, maxCapHeight);

      offCtx.font = `700 ${fontSize}px ${syncopateFamily}`;
      offCtx.fillStyle = "#ffffff";
      offCtx.textAlign = "center";
      offCtx.textBaseline = "middle";

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

            // Initial scatter position for assemble animation
            const scatterRadius = Math.random() * 80 + 30;
            const scatterAngle = Math.random() * Math.PI * 2;
            const initX = homeX + Math.cos(scatterAngle) * scatterRadius;
            const initY = homeY + Math.sin(scatterAngle) * scatterRadius;

            // 1 to 2.5px dots, ~8% accent, ~5% muted
            const rand = Math.random();
            const colorType: "fg" | "accent" | "muted" =
              rand < 0.08 ? "accent" : rand < 0.13 ? "muted" : "fg";
            const size =
              colorType === "accent"
                ? Math.random() * 1.2 + 1.4 // 1.4 to 2.6px
                : Math.random() * 1.0 + 1.0; // 1.0 to 2.0px

            particles.push({
              x: initX,
              y: initY,
              vx: 0,
              vy: 0,
              originX: homeX,
              originY: homeY,
              size,
              colorType,
            });
          }
        }
      }

      const bboxWidth = maxX > minX ? maxX - minX : 0;
      const ratio = width > 0 ? bboxWidth / width : 0;

      if (window.location.search.includes("debug=particles")) {
        console.log(`[Particles Debug] Total particles sampled: ${particles.length}`);
        console.log(`[Particles Debug] Bounding Box: x=[${minX.toFixed(1)}, ${maxX.toFixed(1)}] (width=${bboxWidth.toFixed(1)}, ratio=${ratio.toFixed(3)}), y=[${minY.toFixed(1)}, ${maxY.toFixed(1)}]`);
      }

      // If the sampled bounding box is under 50% of the container width, treat as failed and fall back
      if (ratio < 0.5 || particles.length < 500) {
        onFail?.();
        return;
      }

      assembleStart = performance.now();
      isAssembling = true;
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
          // Interactive repulsion
          const dx = pointerPos.current.x - p.x;
          const dy = pointerPos.current.y - p.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < mouseRadiusSq && distSq > 0) {
            const dist = Math.sqrt(distSq);
            const force = (1 - dist / mouseRadius) * 4.5;
            p.vx -= (dx / dist) * force;
            p.vy -= (dy / dist) * force;
          }

          // Spring return to home position (tension 0.07, damping 0.84)
          const homeDx = p.originX - p.x;
          const homeDy = p.originY - p.y;
          p.vx = (p.vx + homeDx * 0.07) * 0.84;
          p.vy = (p.vy + homeDy * 0.07) * 0.84;

          p.x += p.vx;
          p.y += p.vy;

          totalKineticEnergy += Math.abs(p.vx) + Math.abs(p.vy) + Math.abs(homeDx) + Math.abs(homeDy);
        }

        if (p.colorType === "accent") accentList.push(p);
        else if (p.colorType === "muted") mutedList.push(p);
        else fgList.push(p);
      }

      // Draw FG dots
      if (fgList.length > 0) {
        ctx.fillStyle = fg;
        ctx.beginPath();
        for (let i = 0; i < fgList.length; i++) {
          const p = fgList[i];
          ctx.moveTo(p.x + p.size / 2, p.y);
          ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        }
        ctx.fill();
      }

      // Draw Accent dots
      if (accentList.length > 0) {
        ctx.fillStyle = accent;
        ctx.beginPath();
        for (let i = 0; i < accentList.length; i++) {
          const p = accentList[i];
          ctx.moveTo(p.x + p.size / 2, p.y);
          ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        }
        ctx.fill();
      }

      // Draw Muted dots
      if (mutedList.length > 0) {
        ctx.fillStyle = muted;
        ctx.beginPath();
        for (let i = 0; i < mutedList.length; i++) {
          const p = mutedList[i];
          ctx.moveTo(p.x + p.size / 2, p.y);
          ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        }
        ctx.fill();
      }

      ctx.restore();

      // Idle settle detection: pause rAF when kinetic energy is below epsilon
      const isStillMoving = totalKineticEnergy > 0.08 || isAssembling || isInteracting.current;

      if (isStillMoving) {
        isSettled.current = false;
        animFrameId.current = requestAnimationFrame(renderFrame);
      } else {
        isSettled.current = true;
        animFrameId.current = null;
      }
    };

    const wakeAnimation = () => {
      if (!animFrameId.current) {
        isSettled.current = false;
        animFrameId.current = requestAnimationFrame(renderFrame);
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
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
      onTransitionEnd={() => {
        if (isExiting && onExited) {
          onExited();
        }
      }}
      className="relative w-full overflow-hidden select-none transition-all duration-600 ease-[cubic-bezier(0.22,1,0.36,1)]"
      style={{
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? "scale(0.98)" : "scale(1)",
      }}
    >
      <canvas
        ref={canvasRef}
        id="hero-particle-canvas"
        aria-hidden="true"
        className="block mx-auto cursor-crosshair touch-none"
      />
    </div>
  );
}
