"use client";

import * as React from "react";
import { Project } from "@/lib/types";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { ExternalLink, Code2 } from "lucide-react";
import { SiGithub } from "@icons-pack/react-simple-icons";
import { Button } from "@/components/ui/button";
import { BlurHashImage } from "@/components/blurhash-image";
import { useTier } from "@/hooks/use-tier";

interface ProjectDetailModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectDetailModal({
  project,
  isOpen,
  onClose,
}: ProjectDetailModalProps) {
  const tier = useTier();
  const [isDesktop, setIsDesktop] = React.useState(true);

  React.useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768 && tier === "full");
    };
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, [tier]);

  if (!project) return null;

  const content = (
    <div className="flex flex-col gap-6 pt-2">
      {/* Project Thumbnail */}
      {project.thumbnail?.url && (
        <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] aspect-video w-full">
          <BlurHashImage
            src={project.thumbnail.url}
            alt={project.title}
            blurhash={project.thumbnail.blurhash}
            className="h-full w-full"
          />
        </div>
      )}

      {/* Description */}
      <div>
        <h4 className="caption-mono text-xs text-[var(--muted)] mb-2">Overview</h4>
        <p className="text-sm text-[var(--fg)] leading-relaxed">
          {project.description}
        </p>
      </div>

      {/* Tags */}
      <div>
        <h4 className="caption-mono text-xs text-[var(--muted)] mb-2">Technologies</h4>
        <div className="flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs font-mono text-[var(--muted)] border border-[var(--border)] px-2.5 py-1 rounded-[var(--radius-control)] bg-[var(--surface)]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Action Links */}
      <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[var(--border)]">
        {project.liveUrl && (
          <Button asChild size="default" className="gap-2">
            <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              <span>Live Application</span>
            </a>
          </Button>
        )}

        {project.repoUrl && (
          <Button asChild variant="outline" size="default" className="gap-2">
            <a href={project.repoUrl} target="_blank" rel="noopener noreferrer">
              <SiGithub className="h-4 w-4" />
              <span>Source Code</span>
            </a>
          </Button>
        )}
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="overflow-y-auto sm:max-w-lg border-l border-[var(--border)] bg-[var(--surface)] text-[var(--fg)]">
          <SheetHeader className="text-left pb-4 border-b border-[var(--border)]">
            <SheetTitle className="text-xl font-bold tracking-tight">{project.title}</SheetTitle>
            <SheetDescription className="text-xs font-mono text-[var(--muted)]">
              {project.source === "github" ? "GitHub Repository" : "Featured Web Application"}
            </SheetDescription>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="border-t border-[var(--border)] bg-[var(--surface)] text-[var(--fg)]">
        <DrawerHeader className="text-left pb-2">
          <DrawerTitle className="text-xl font-bold">{project.title}</DrawerTitle>
          <DrawerDescription className="text-xs font-mono text-[var(--muted)]">
            {project.source === "github" ? "GitHub Repository" : "Featured Web Application"}
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-6">{content}</div>
      </DrawerContent>
    </Drawer>
  );
}

