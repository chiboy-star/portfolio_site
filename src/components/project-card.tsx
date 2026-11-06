"use client";

import * as React from "react";
import { Project } from "@/lib/types";
import { BlurHashImage } from "@/components/blurhash-image";
import { ExternalLink } from "lucide-react";
import { SiGithub } from "@icons-pack/react-simple-icons";

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export function ProjectCard({
  project,
  onClick,
  className = "",
  style,
}: ProjectCardProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`View details for ${project.title}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      style={style}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5 transition-all hover:border-[var(--accent)]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] cursor-pointer select-none text-left ${className}`}
    >
      <div>
        {/* Project Thumbnail */}
        {project.thumbnail?.url && (
          <div className="relative mb-4 aspect-video w-full overflow-hidden rounded-[calc(var(--radius-card)-6px)] border border-[var(--border)] bg-black/20">
            <BlurHashImage
              src={project.thumbnail.url}
              alt={project.title}
              blurhash={project.thumbnail.blurhash}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-102"
            />
          </div>
        )}

        {/* Project Title */}
        <h3 className="text-lg font-semibold tracking-tight text-[var(--fg)] mb-2 group-hover:text-[var(--accent)] transition-colors">
          {project.title}
        </h3>

        {/* One-line Description */}
        <p className="text-xs text-[var(--muted)] line-clamp-2 leading-relaxed mb-4">
          {project.description}
        </p>
      </div>

      <div className="mt-auto pt-3 border-t border-[var(--border)] flex items-center justify-between">
        {/* Tags: Max 3, plain text, no badges */}
        <div className="flex flex-wrap gap-2">
          {project.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-xs font-mono text-[var(--muted)]">
              #{tag}
            </span>
          ))}
        </div>

        {/* Real Action Links with Hit Slop */}
        <div className="flex items-center gap-1">
          {project.repoUrl && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Source code for ${project.title}`}
              onClick={(e) => e.stopPropagation()}
              className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] text-[var(--muted)] hover:text-[var(--fg)] hover:bg-[var(--border)]/40 transition-colors"
            >
              <SiGithub className="h-4 w-4" />
            </a>
          )}

          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Live demo for ${project.title}`}
              onClick={(e) => e.stopPropagation()}
              className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] text-[var(--muted)] hover:text-[var(--accent)] hover:bg-[var(--border)]/40 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

