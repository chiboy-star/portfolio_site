"use client";

import * as React from "react";
import { Project } from "@/lib/types";
import { ProjectCard } from "@/components/project-card";
import { ProjectDetailModal } from "@/components/project-detail-modal";
import { useTier } from "@/hooks/use-tier";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface WorkSectionProps {
  initialProjects: Project[];
}

export function WorkSection({ initialProjects }: WorkSectionProps) {
  const [filter, setFilter] = React.useState<"featured" | "all">("featured");
  const [selectedProject, setSelectedProject] = React.useState<Project | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const tier = useTier();

  // Filter projects: "featured" shows only featured projects; "all" shows all visible projects
  const displayedProjects = React.useMemo(() => {
    if (filter === "featured") {
      return initialProjects.filter((p) => p.featured);
    }
    return initialProjects;
  }, [initialProjects, filter]);

  // 3D Carousel state for Full Tier
  const [activeIndex, setActiveIndex] = React.useState(0);
  const offsetRef = React.useRef(0);
  const targetOffsetRef = React.useRef(0);
  const velocityRef = React.useRef(0);
  const isDraggingRef = React.useRef(false);
  const dragStartXRef = React.useRef(0);
  const animFrameRef = React.useRef<number | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [, setRenderTick] = React.useState(0);

  // Clamp activeIndex when displayedProjects changes
  React.useEffect(() => {
    setActiveIndex(0);
    offsetRef.current = 0;
    targetOffsetRef.current = 0;
    velocityRef.current = 0;
  }, [filter]);

  // Inertia animation loop that completely settles and stops
  const runAnimation = React.useCallback(() => {
    const diff = targetOffsetRef.current - offsetRef.current;
    velocityRef.current = velocityRef.current * 0.85 + diff * 0.08;
    offsetRef.current += velocityRef.current;

    // Check if settled
    if (
      Math.abs(diff) < 0.001 &&
      Math.abs(velocityRef.current) < 0.001 &&
      !isDraggingRef.current
    ) {
      offsetRef.current = targetOffsetRef.current;
      velocityRef.current = 0;
      animFrameRef.current = null;
      setRenderTick((t) => t + 1);
      return;
    }

    setRenderTick((t) => t + 1);
    animFrameRef.current = requestAnimationFrame(runAnimation);
  }, []);

  const startAnimation = React.useCallback(() => {
    if (!animFrameRef.current) {
      animFrameRef.current = requestAnimationFrame(runAnimation);
    }
  }, [runAnimation]);

  const goToIndex = (index: number) => {
    const clamped = Math.max(0, Math.min(index, displayedProjects.length - 1));
    setActiveIndex(clamped);
    targetOffsetRef.current = clamped;
    startAnimation();
  };

  // Pointer event handlers for drag
  const onPointerDown = (e: React.PointerEvent) => {
    if (tier !== "full") return;
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || tier !== "full") return;
    const deltaX = e.clientX - dragStartXRef.current;
    // Drag sensitivity
    const deltaIndex = -deltaX / 300;
    targetOffsetRef.current = Math.max(
      -0.3,
      Math.min(displayedProjects.length - 0.7, activeIndex + deltaIndex)
    );
    startAnimation();
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || tier !== "full") return;
    isDraggingRef.current = false;
    const finalIndex = Math.round(targetOffsetRef.current);
    goToIndex(finalIndex);
  };

  // Wheel event for horizontal trackpad scroll
  const onWheel = (e: React.WheelEvent) => {
    if (tier !== "full" || Math.abs(e.deltaX) < 10) return;
    e.preventDefault();
    const dir = e.deltaX > 0 ? 1 : -1;
    goToIndex(activeIndex + dir);
  };

  // Keyboard navigation
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      goToIndex(activeIndex - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      goToIndex(activeIndex + 1);
    }
  };

  const openProjectModal = (project: Project) => {
    setSelectedProject(project);
    setModalOpen(true);
  };

  return (
    <section
      id="work"
      className="relative mx-auto max-w-[1120px] px-4 py-20 sm:px-6 lg:px-8 border-t border-[var(--border)]"
      role="region"
      aria-roledescription="carousel"
      aria-label="Projects and Work"
      onKeyDown={onKeyDown}
      tabIndex={0}
    >
      {/* Section Header with Featured / All Pill Switch */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
        <div>
          <span className="caption-mono text-xs text-[var(--accent)] mb-2 block">
            Selected Works
          </span>
          <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-[var(--fg)]">
            Featured Projects
          </h2>
        </div>

        {/* Featured / All Pill Switch (DESIGN.md tokens) */}
        <div
          role="radiogroup"
          aria-label="Filter projects view"
          className="inline-flex h-9 p-1 items-center rounded-[var(--radius-pill)] border border-[var(--border)] bg-[var(--surface)] self-start sm:self-auto select-none"
        >
          <button
            role="radio"
            aria-checked={filter === "featured"}
            onClick={() => setFilter("featured")}
            type="button"
            className={`px-4 py-1 rounded-[var(--radius-pill)] text-xs font-medium transition-all ${
              filter === "featured"
                ? "bg-[var(--accent)] text-[var(--accent-fg)] font-semibold shadow-xs"
                : "text-[var(--muted)] hover:text-[var(--fg)]"
            }`}
          >
            Featured
          </button>
          <button
            role="radio"
            aria-checked={filter === "all"}
            onClick={() => setFilter("all")}
            type="button"
            className={`px-4 py-1 rounded-[var(--radius-pill)] text-xs font-medium transition-all ${
              filter === "all"
                ? "bg-[var(--accent)] text-[var(--accent-fg)] font-semibold shadow-xs"
                : "text-[var(--muted)] hover:text-[var(--fg)]"
            }`}
          >
            All ({initialProjects.length})
          </button>
        </div>
      </div>

      {/* Full Tier: 3D Curved Concave Carousel */}
      {tier === "full" ? (
        <div className="relative py-8 overflow-hidden select-none" ref={containerRef}>
          {/* Faint Perspective Grid Floor */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 opacity-20 [mask-image:linear-gradient(to_bottom,transparent,black)]"
            style={{
              backgroundImage:
                "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
              transform: "perspective(400px) rotateX(60deg)",
              transformOrigin: "bottom center",
            }}
          />

          {/* 3D Stage */}
          <div
            className="relative h-[480px] w-full flex items-center justify-center cursor-grab active:cursor-grabbing"
            style={{ perspective: "1200px" }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onWheel={onWheel}
          >
            {displayedProjects.map((project, i) => {
              const d = i - offsetRef.current;
              // 5.3 Cylinder formula: rotateY(clamp(d * -16deg, -50deg, 50deg)) translateZ(-|d| * 70px) scale(1 - |d| * 0.04)
              const rotY = Math.max(-50, Math.min(50, d * -16));
              const transZ = -Math.abs(d) * 70;
              const scale = Math.max(0.75, 1 - Math.abs(d) * 0.04);
              const transX = d * 340;
              const opacity = Math.max(0.3, 1 - Math.abs(d) * 0.22);
              const isCenter = Math.abs(d) < 0.5;

              return (
                <div
                  key={project.id}
                  className="absolute w-[340px] transition-opacity duration-150"
                  style={{
                    transform: `translateX(${transX}px) translateZ(${transZ}px) rotateY(${rotY}deg) scale(${scale})`,
                    zIndex: Math.round(100 - Math.abs(d) * 10),
                    opacity,
                  }}
                >
                  <ProjectCard
                    project={project}
                    onClick={() => openProjectModal(project)}
                  />
                  {/* Caption under card */}
                  <div className="mt-3 text-center text-xs font-mono text-[var(--muted)]">
                    <span className={isCenter ? "text-[var(--accent)] font-semibold" : ""}>
                      0{i + 1} // {project.title}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Carousel Arrows */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={() => goToIndex(activeIndex - 1)}
              disabled={activeIndex === 0}
              aria-label="Previous project"
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-control)] border border-[var(--border)] text-[var(--fg)] hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="caption-mono text-xs text-[var(--muted)] font-mono">
              {activeIndex + 1} / {displayedProjects.length}
            </span>
            <button
              onClick={() => goToIndex(activeIndex + 1)}
              disabled={activeIndex === displayedProjects.length - 1}
              aria-label="Next project"
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-control)] border border-[var(--border)] text-[var(--fg)] hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : (
        /* Lite / Minimal / Mobile Tier: Smooth Scroll-snap list */
        <div className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory focus-visible:outline-none scrollbar-none">
          {displayedProjects.map((project) => (
            <div
              key={project.id}
              className="w-[280px] sm:w-[320px] shrink-0 snap-center"
            >
              <ProjectCard
                project={project}
                onClick={() => openProjectModal(project)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Detail Sheet (Desktop) / Drawer (Mobile) */}
      <ProjectDetailModal
        project={selectedProject}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </section>
  );
}

