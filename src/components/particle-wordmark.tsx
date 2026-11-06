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
  color: string;
  size: number;
}

interface Orb {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
  color: string;
}

export function ParticleWordmark() {
  const tier = useTier();
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const isInteracting = React.useRef(false);
  const pointerPos = React.useRef({ x: -1000, y: -1000 });
  const animFrameId = React.useRef<number | null>(null);
  const isSettled = React.useRef(false);
  const isVisible = React.useRef(true);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles: Particle[] = [];
    let orbs: Orb[] = [];

    const initOrbs = (w: number, h: number) => {
      const colors = ["#F5A524", "#8D8D94", "#E4E4DE", "#B45309"];
      orbs = Array.from({ length: 10 }).map((_, i) => {
        const x = (w * 0.1) + Math.random() * (w * 0.8);
        const y = (h * 0.15) + Math.random() * (h * 0.7);
        return {
          x,
          y,
          baseX: x,
          baseY: y,
          size: 2 + (i % 3),
          color: colors[i % colors.length],
        };
      });
    };

    const buildParticles = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = rect.width;
      const height = Math.min(Math.max(width * 0.35, 220), 400);

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      initOrbs(width, height);

      // Offscreen canvas for rasterizing text
      const offCanvas = document.createElement("canvas");
      offCanvas.width = width * dpr;
      offCanvas.height = height * dpr;
      const offCtx = offCanvas.getContext("2d");
      if (!offCtx) return;

      offCtx.scale(dpr, dpr);
      const fontSize = Math.max(Math.min(width * 0.082, 84), 28);
      offCtx.font = `300 ${fontSize}px var(--font-geist-sans), -apple-system, sans-serif`;
      offCtx.fillStyle = "#ffffff";
      offCtx.textAlign = "center";
      offCtx.textBaseline = "middle";

      // Split into two lines on narrow screens if needed, or single line
      if (width < 640) {
        offCtx.fillText("CHINEMEREM", width / 2, height * 0.38);
        offCtx.fillText("MADUEKE", width / 2, height * 0.62);
      } else {
        offCtx.fillText("CHINEMEREM  MADUEKE", width / 2, height / 2);
      }

      const imgData = offCtx.getImageData(0, 0, width * dpr, height * dpr).data;
      particles = [];

      // Grid sampling step
      const step = width < 768 ? 4 * dpr : 3 * dpr;
      const isDark = document.documentElement.classList.contains("dark");
      const baseColor = isDark ? "#EDEDEE" : "#111113";

      for (let y = 0; y < height * dpr; y += step) {
        for (let x = 0; x < width * dpr; x += step) {
          const idx = (y * width * dpr + x) * 4;
          if (imgData[idx + 3] > 128) {
            const posX = x / dpr;
            const posY = y / dpr;
            particles.push({
              x: posX,
              y: posY,
              originX: posX,
              originY: posY,
              vx: 0,
              vy: 0,
              color: baseColor,
              size: width < 768 ? 1.5 : 1.8,
            });
          }
        }
      }

      isSettled.current = false;
      renderFrame();
    };

    const renderFrame = () => {
      if (!ctx || !isVisible.current) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // Draw orbs with subtle parallax
      orbs.forEach((orb) => {
        const dx = (pointerPos.current.x - width / 2) * 0.02;
        const dy = (pointerPos.current.y - height / 2) * 0.02;
        orb.x = orb.baseX + dx;
        orb.y = orb.baseY + dy;

        ctx.fillStyle = orb.color;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Update and draw particles
      let maxVelocity = 0;
      const mouseRadius = 90;
      const mouseRadiusSq = mouseRadius * mouseRadius;

      ctx.beginPath();
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Interaction with pointer
        if (tier === "full") {
          const dx = p.x - pointerPos.current.x;
          const dy = p.y - pointerPos.current.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < mouseRadiusSq && distSq > 0) {
            const dist = Math.sqrt(distSq);
            const force = (1 - dist / mouseRadius) * 8;
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
          }

          // Spring back to origin
          const springX = (p.originX - p.x) * 0.08;
          const springY = (p.originY - p.y) * 0.08;
          p.vx = (p.vx + springX) * 0.78;
          p.vy = (p.vy + springY) * 0.78;

          p.x += p.vx;
          p.y += p.vy;

          const vel = Math.abs(p.vx) + Math.abs(p.vy);
          if (vel > maxVelocity) maxVelocity = vel;
        }

        ctx.rect(p.x, p.y, p.size, p.size);
      }

      ctx.fillStyle = document.documentElement.classList.contains("dark") ? "#EDEDEE" : "#111113";
      ctx.fill();

      // Render custom ring cursor in canvas if fine pointer
      if (tier === "full" && pointerPos.current.x > 0 && pointerPos.current.x < width) {
        ctx.strokeStyle = "rgba(245, 165, 36, 0.6)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(pointerPos.current.x, pointerPos.current.y, 12, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();

      // Stop rAF when settled and pointer idle
      if (tier !== "full" || (maxVelocity < 0.05 && !isInteracting.current)) {
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

    // IntersectionObserver to stop rAF when hero is off-screen
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
    buildParticles();

    if (tier === "full") {
      canvas.addEventListener("pointermove", handlePointerMove);
      canvas.addEventListener("pointerleave", handlePointerLeave);
    }

    const handleResize = () => {
      buildParticles();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [tier]);

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden select-none">
      {/* Accessible h1 for Screen Readers and SEO */}
      <h1 className="sr-only">CHINEMEREM MADUEKE</h1>

      {/* Austensor-style Captions around hero */}
      <div className="flex items-center justify-between py-2 border-b border-[var(--border)] mb-4 text-[11px] font-mono tracking-widest text-[var(--muted)] uppercase">
        <span>Portfolio / 2026</span>
        <span className="hidden sm:inline">Frontend &amp; Software</span>
        <span>Lagos, Nigeria</span>
      </div>

      {/* Particle Canvas (aria-hidden) */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="block mx-auto cursor-crosshair touch-none"
      />
    </div>
  );
}

