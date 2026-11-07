"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Project } from "@/lib/types";
import { ProjectCard } from "@/components/project-card";
import { ProjectDetailModal } from "@/components/project-detail-modal";
import { useTier } from "@/hooks/use-tier";

const CarouselWebGL = dynamic(
  () => import("@/components/carousel-webgl").then((mod) => mod.CarouselWebGL),
  {
    ssr: false,
    loading: () => (
      <div className="h-[68vh] min-h-[460px] max-h-[640px] w-full flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    ),
  }
);

interface WorkSectionProps {
  initialProjects: Project[];
}

export function WorkSection({ initialProjects }: WorkSectionProps) {
  const [filter, setFilter] = React.useState<"featured" | "all">("featured");
  const [selectedProject, setSelectedProject] = React.useState<Project | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [mounted, setMounted] = React.useState(false);
  const tier = useTier();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Filter projects: "featured" shows only featured projects; "all" shows all visible projects
  const displayedProjects = React.useMemo(() => {
    if (filter === "featured") {
      return initialProjects.filter((p) => p.featured);
    }
    return initialProjects;
  }, [initialProjects, filter]);

  React.useEffect(() => {
    setActiveIndex(0);
  }, [filter]);

  const openProjectModal = (project: Project) => {
    setSelectedProject(project);
    setModalOpen(true);
  };

  // Keyboard navigation for carousel
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (tier !== "full") return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(0, prev - 1));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(displayedProjects.length - 1, prev + 1));
    }
  };

  return (
    <section
      id="work"
      className="relative w-full py-20 border-t border-[var(--border)] overflow-hidden"
      role="region"
      aria-roledescription="carousel"
      aria-label="Projects and Work"
      onKeyDown={onKeyDown}
      tabIndex={0}
    >
      {/* Section Header */}
      <div className="mx-auto max-w-[1120px] px-4 sm:px-6 lg:px-8 mb-8">
        <span className="caption-mono text-xs text-[var(--accent)] mb-2 block">
          Selected Works
        </span>
        <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-[var(--fg)]">
          Featured Projects
        </h2>
      </div>

      {/* 
        Full Tier Stage Container:
        CSS `html:not([data-tier="full"]) #work-webgl-stage { display: none !important; }`
        guarantees it stays hidden on lite/minimal before paint with no flash.
      */}
      <div id="work-webgl-stage" className="w-full relative">
        {mounted && tier === "full" ? (
          <CarouselWebGL
            projects={displayedProjects}
            onSelectProject={openProjectModal}
            activeIndex={activeIndex}
            setActiveIndex={setActiveIndex}
          />
        ) : (
          <div
            aria-hidden="true"
            className="relative h-[68vh] min-h-[460px] max-h-[640px] w-full overflow-hidden flex items-center justify-center bg-[var(--surface)]/20"
          >
            {/* Perspective Grid Floor placeholder */}
            <div
              className="pointer-events-none absolute bottom-4 left-0 right-0 h-28 opacity-15"
              style={{
                backgroundImage:
                  "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
                backgroundSize: "36px 36px",
                transform: "perspective(300px) rotateX(60deg)",
                transformOrigin: "bottom center",
              }}
            />
          </div>
        )}

        {/* Minimal Bottom Chrome: Featured/All Switch bottom-left, Counter bottom-right */}
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6 lg:px-8 flex items-center justify-between pt-6">
          <div
            role="radiogroup"
            aria-label="Filter projects view"
            className="inline-flex h-9 p-1 items-center rounded-[var(--radius-pill)] border border-[var(--border)] bg-[var(--surface)] select-none"
          >
            <button
              role="radio"
              aria-checked={filter === "featured"}
              onClick={() => setFilter("featured")}
              type="button"
              className={`px-4 py-1 rounded-[var(--radius-pill)] text-xs font-medium transition-all cursor-pointer ${
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
              className={`px-4 py-1 rounded-[var(--radius-pill)] text-xs font-medium transition-all cursor-pointer ${
                filter === "all"
                  ? "bg-[var(--accent)] text-[var(--accent-fg)] font-semibold shadow-xs"
                  : "text-[var(--muted)] hover:text-[var(--fg)]"
              }`}
            >
              All ({initialProjects.length})
            </button>
          </div>

          {/* Small Counter bottom-right */}
          <div className="caption-mono text-xs text-[var(--muted)] font-mono">
            <span className="text-[var(--fg)] font-semibold">
              {String(activeIndex + 1).padStart(2, "0")}
            </span>{" "}
            / {String(displayedProjects.length).padStart(2, "0")}
          </div>
        </div>
      </div>

      {/* 
        Lite / Minimal / Mobile Tier: Smooth Scroll-snap list.
        Always SSR-rendered for SEO and fast non-JS first paint.
        CSS `html[data-tier="full"] #work-scroll-list { display: none !important; }`
        instantly hides it before paint on full tier without hydration mismatch.
      */}
      <div id="work-scroll-list" className="mx-auto max-w-[1120px] px-4 sm:px-6 lg:px-8">
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

        <div className="mt-4">
          <div
            role="radiogroup"
            aria-label="Filter projects view"
            className="inline-flex h-9 p-1 items-center rounded-[var(--radius-pill)] border border-[var(--border)] bg-[var(--surface)] select-none"
          >
            <button
              role="radio"
              aria-checked={filter === "featured"}
              onClick={() => setFilter("featured")}
              type="button"
              className={`px-4 py-1 rounded-[var(--radius-pill)] text-xs font-medium transition-all cursor-pointer ${
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
              className={`px-4 py-1 rounded-[var(--radius-pill)] text-xs font-medium transition-all cursor-pointer ${
                filter === "all"
                  ? "bg-[var(--accent)] text-[var(--accent-fg)] font-semibold shadow-xs"
                  : "text-[var(--muted)] hover:text-[var(--fg)]"
              }`}
            >
              All ({initialProjects.length})
            </button>
          </div>
        </div>
      </div>

      {/* Detail Sheet (Desktop) / Drawer (Mobile) */}
      <ProjectDetailModal
        project={selectedProject}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </section>
  );
}
