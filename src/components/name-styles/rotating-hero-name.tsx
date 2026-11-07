"use client";

import * as React from "react";
import { useTier } from "@/hooks/use-tier";
import { NameStyleId } from "./types";
import { pickNextStyle } from "./selector";

import { WideThinStyle } from "./wide-thin";
import { HeavyStackedStyle } from "./heavy-stacked";
import { MarkerScrawlStyle } from "./marker-scrawl";
import { SliceStyle } from "./slice";
import { DecodeStyle } from "./decode";
import { OutlineFillStyle } from "./outline-fill";
import { WeightSweepStyle } from "./weight-sweep";
import { SoftBlurStyle } from "./soft-blur";
import { ParticleWordmark } from "@/components/particle-wordmark";

export function RotatingHeroName() {
  const tier = useTier();
  const [mounted, setMounted] = React.useState(false);
  const [activeStyle, setActiveStyle] = React.useState<NameStyleId>("wide-thin");
  const [phase, setPhase] = React.useState<"entering" | "active" | "exiting">("entering");
  const [isWaitingForIntro, setIsWaitingForIntro] = React.useState(true);
  const [isParticlesAvailable, setIsParticlesAvailable] = React.useState(true);

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const isHoveredRef = React.useRef(false);
  const isVisibleRef = React.useRef(true);
  const isHeroInViewRef = React.useRef(true);
  const lastPauseTimeRef = React.useRef<number | null>(null);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const currentIntervalRef = React.useRef(45000);

  // 1. Initial mount: pick style differing from last visit (run ONCE on mount)
  React.useEffect(() => {
    setMounted(true);

    const docTier = (typeof document !== "undefined"
      ? (document.documentElement.getAttribute("data-tier") as "full" | "lite" | "minimal")
      : "lite") || "lite";

    if (docTier === "minimal") {
      setActiveStyle("wide-thin");
      setIsWaitingForIntro(false);
      setPhase("active");
      return;
    }

    let lastStyle: string | null = null;
    try {
      lastStyle = localStorage.getItem("last_name_style");
    } catch {
      // ignore
    }

    let forcedStyle: NameStyleId | null = null;
    if (typeof window !== "undefined") {
      const s = window.location.search || "";
      if (s.includes("style=particles") && isParticlesAvailable) forcedStyle = "particles";
      else if (s.includes("style=heavy-stacked")) forcedStyle = "heavy-stacked";
      else if (s.includes("style=marker-scrawl") || s.includes("style=letter-rise")) forcedStyle = "marker-scrawl";
      else if (s.includes("style=slice")) forcedStyle = "slice";
      else if (s.includes("style=decode")) forcedStyle = "decode";
      else if (s.includes("style=outline-fill")) forcedStyle = "outline-fill";
      else if (s.includes("style=weight-sweep")) forcedStyle = "weight-sweep";
      else if (s.includes("style=soft-blur")) forcedStyle = "soft-blur";
      else if (s.includes("style=wide-thin")) forcedStyle = "wide-thin";
    }

    const next = forcedStyle || pickNextStyle(lastStyle, docTier, isParticlesAvailable);
    setActiveStyle(next);
    try {
      localStorage.setItem("last_name_style", next);
    } catch {
      // ignore
    }

    // Interplay with Intro: Wait for intro:done before animating in
    const isIntroPlaying =
      typeof document !== "undefined" &&
      document.documentElement.getAttribute("data-intro") === "play";

    if (isIntroPlaying) {
      setIsWaitingForIntro(true);

      const onIntroDone = () => {
        setIsWaitingForIntro(false);
        setPhase("entering");
      };

      window.addEventListener("intro:done", onIntroDone, { once: true });

      // Fallback timeout in case intro:done fails to fire
      const fallbackTimer = setTimeout(() => {
        setIsWaitingForIntro(false);
        setPhase("entering");
      }, 1800);

      return () => {
        window.removeEventListener("intro:done", onIntroDone);
        clearTimeout(fallbackTimer);
      };
    } else {
      setIsWaitingForIntro(false);
      setPhase("entering");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run strictly once on mount to preserve persistent rotation sequence across reloads

  // 2. Schedule rotation timer (30-60s) with pause conditions
  const scheduleNextRotation = React.useCallback(
    (delayMs?: number) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (tier === "minimal") return;

      const interval =
        delayMs !== undefined
          ? delayMs
          : Math.floor(Math.random() * 30000) + 30000; // 30 to 60s
      currentIntervalRef.current = interval;

      timerRef.current = setTimeout(() => {
        // Verify pause conditions
        const isPaused =
          !isVisibleRef.current ||
          !isHeroInViewRef.current ||
          isHoveredRef.current ||
          isWaitingForIntro;

        if (isPaused) {
          lastPauseTimeRef.current = performance.now();
          return;
        }

        // Trigger transition: exit current, then enter next
        setPhase("exiting");
      }, interval);
    },
    [tier, isWaitingForIntro]
  );

  // 3. Handle exit completion -> pick next and enter
  const handleExited = React.useCallback(() => {
    const next = pickNextStyle(activeStyle, tier, isParticlesAvailable);
    setActiveStyle(next);
    try {
      localStorage.setItem("last_name_style", next);
    } catch {
      // ignore
    }

    setPhase("entering");
    scheduleNextRotation();
  }, [activeStyle, tier, isParticlesAvailable, scheduleNextRotation]);

  const handleEntered = React.useCallback(() => {
    setPhase("active");
  }, []);

  // 4. Handle particles failure fallback
  const handleParticlesFailed = React.useCallback(() => {
    console.warn("[RotatingHeroName] Particles failed; falling back to wide-thin.");
    setIsParticlesAvailable(false);
    if (activeStyle === "particles") {
      setActiveStyle("wide-thin");
      setPhase("active");
    }
  }, [activeStyle]);

  // 5. Visibility, Hero Intersection, and Intro Replay listeners
  React.useEffect(() => {
    if (tier === "minimal") return;

    const handleVisibilityChange = () => {
      const visible = document.visibilityState === "visible";
      isVisibleRef.current = visible;

      if (!visible) {
        lastPauseTimeRef.current = performance.now();
      } else {
        if (lastPauseTimeRef.current) {
          const pausedDuration = performance.now() - lastPauseTimeRef.current;
          lastPauseTimeRef.current = null;
          if (pausedDuration > currentIntervalRef.current) {
            scheduleNextRotation(5000);
          } else {
            scheduleNextRotation(Math.max(5000, currentIntervalRef.current - pausedDuration));
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Listen for in-memory intro replay
    const handleIntroReplay = () => {
      setIsWaitingForIntro(true);
      const onDone = () => {
        setIsWaitingForIntro(false);
        setPhase("entering");
      };
      window.addEventListener("intro:done", onDone, { once: true });
    };
    window.addEventListener("intro:replay", handleIntroReplay);

    const container = containerRef.current;
    let observer: IntersectionObserver | null = null;
    if (container) {
      observer = new IntersectionObserver(
        ([entry]) => {
          const inView = entry.isIntersecting;
          isHeroInViewRef.current = inView;

          if (!inView) {
            lastPauseTimeRef.current = performance.now();
          } else if (lastPauseTimeRef.current) {
            const pausedDuration = performance.now() - lastPauseTimeRef.current;
            lastPauseTimeRef.current = null;
            if (pausedDuration > currentIntervalRef.current) {
              scheduleNextRotation(5000);
            } else {
              scheduleNextRotation(Math.max(5000, currentIntervalRef.current - pausedDuration));
            }
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(container);
    }

    scheduleNextRotation();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("intro:replay", handleIntroReplay);
      if (observer) observer.disconnect();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [tier, scheduleNextRotation]);

  // Pointer interaction listeners to pause timer while hovering
  const handlePointerEnter = () => {
    isHoveredRef.current = true;
  };

  const handlePointerLeave = () => {
    isHoveredRef.current = false;
  };

  return (
    <div
      ref={containerRef}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      className="relative w-full select-none h-[110px] sm:h-[140px] lg:h-[160px] flex items-center justify-center overflow-hidden"
    >
      {/* 
        Accessible Real H1 Header:
        Always rendered identically on server and client for 100% hydration match and SEO.
        Visually hidden with sr-only once stylish presentation mounts on interactive tiers.
      */}
      <h1
        className={`text-3xl sm:text-5xl lg:text-7xl font-extralight tracking-widest text-[var(--fg)] uppercase text-center ${
          mounted && tier !== "minimal" ? "sr-only" : "block"
        }`}
      >
        CHINEMEREM MADUEKE
      </h1>

      {/* Decorative Rotating Style Slot (aria-hidden) */}
      {mounted && tier !== "minimal" && (
        <div
          aria-hidden="true"
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
            isWaitingForIntro ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          {activeStyle === "wide-thin" && (
            <WideThinStyle
              phase={phase}
              onEntered={handleEntered}
              onExited={handleExited}
            />
          )}

          {activeStyle === "heavy-stacked" && (
            <HeavyStackedStyle
              phase={phase}
              onEntered={handleEntered}
              onExited={handleExited}
            />
          )}

          {activeStyle === "marker-scrawl" && (
            <MarkerScrawlStyle
              phase={phase}
              onEntered={handleEntered}
              onExited={handleExited}
            />
          )}

          {activeStyle === "slice" && (
            <SliceStyle
              phase={phase}
              onEntered={handleEntered}
              onExited={handleExited}
            />
          )}

          {activeStyle === "decode" && (
            <DecodeStyle
              phase={phase}
              onEntered={handleEntered}
              onExited={handleExited}
            />
          )}

          {activeStyle === "outline-fill" && (
            <OutlineFillStyle
              phase={phase}
              onEntered={handleEntered}
              onExited={handleExited}
            />
          )}

          {activeStyle === "weight-sweep" && (
            <WeightSweepStyle
              phase={phase}
              onEntered={handleEntered}
              onExited={handleExited}
            />
          )}

          {activeStyle === "soft-blur" && (
            <SoftBlurStyle
              phase={phase}
              onEntered={handleEntered}
              onExited={handleExited}
            />
          )}

          {activeStyle === "particles" && (
            <ParticleWordmark
              phase={phase}
              onEntered={handleEntered}
              onExited={handleExited}
              onFail={handleParticlesFailed}
            />
          )}
        </div>
      )}
    </div>
  );
}
