"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { SiGithub, SiLinkedin } from "@icons-pack/react-simple-icons";
import { FileDown, Mail } from "lucide-react";
import { CrackOpenIntro } from "@/components/crack-open-intro";
import { RotatingHeroName } from "@/components/name-styles/rotating-hero-name";

interface HeroSectionProps {
  headline?: string;
  bio?: string;
  status?: string;
}

export function HeroSection({
  headline = "Junior Frontend Developer.",
  bio = "I'm a second-year Software Engineering student at Pan-Atlantic University with a strong foundation in front-end development. I specialize in building responsive, API-driven web applications using JavaScript, React, and Next.js, with ambitions in back-end development and cybersecurity.",
  status = "Open to internships",
}: HeroSectionProps) {
  // Ensure repeated status is cleanly dropped from headline
  const cleanHeadline = headline
    .replace(/\.?\s*Open to internships\.?/i, "")
    .trim()
    .replace(/\.*$/, ".");

  return (
    <section id="hero" className="relative mx-auto max-w-[1120px] px-4 pt-8 pb-16 sm:px-6 lg:px-8">
      {/* Crack-open Intro: Server-rendered, visible on first paint unless skipped */}
      <CrackOpenIntro />

      {/* Austensor-style Captions Bar */}
      <div className="flex items-center justify-between py-2 border-b border-[var(--border)] mb-2 text-[11px] font-mono tracking-widest text-[var(--muted)] uppercase select-none">
        <span>Portfolio / 2026</span>
        <span className="hidden sm:inline">Frontend &amp; Software</span>
        <span>Lagos, Nigeria</span>
      </div>

      {/* Rotating Name Styles (Guaranteed fallback, zero hydration mismatch, rotating presentations) */}
      <RotatingHeroName />

      {/* Role and Bio */}
      <div className="mt-8 max-w-2xl">
        {/* Status Line with Static Dot: plain text line, no border, no background, no animation */}
        <div className="flex items-center gap-2 mb-4 text-xs font-mono uppercase tracking-wider text-[var(--muted)] select-none">
          <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
          <span className="text-[var(--fg)]">{status}</span>
        </div>

        <p className="text-xl sm:text-2xl font-light text-[var(--fg)] tracking-tight mb-4">
          {cleanHeadline}
        </p>

        <p className="text-sm sm:text-base text-[var(--muted)] leading-relaxed">
          {bio}
        </p>

        {/* CTA Button and Social Links */}
        <div className="mt-8 flex flex-wrap items-center gap-4">
          {/* Primary CTA - Single Accent Filled Button */}
          <Button
            asChild
            size="lg"
            className="rounded-[var(--radius-control)] bg-[var(--accent)] text-[var(--accent-fg)] font-semibold hover:opacity-90 shadow-md"
          >
            <a href="#contact" className="gap-2">
              <Mail className="h-4 w-4" />
              <span>Contact me</span>
            </a>
          </Button>

          {/* Secondary Links */}
          <Button
            asChild
            variant="outline"
            size="lg"
            className="rounded-[var(--radius-control)] border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            <a
              href="https://github.com/chiboy-star"
              target="_blank"
              rel="noopener noreferrer"
              className="gap-2"
            >
              <SiGithub className="h-4 w-4" />
              <span>GitHub</span>
            </a>
          </Button>

          <Button
            asChild
            variant="outline"
            size="lg"
            className="rounded-[var(--radius-control)] border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            <a
              href="https://www.linkedin.com/in/chinemerem-madueke-b75038294"
              target="_blank"
              rel="noopener noreferrer"
              className="gap-2"
            >
              <SiLinkedin className="h-4 w-4" />
              <span>LinkedIn</span>
            </a>
          </Button>

          <Button
            asChild
            variant="ghost"
            size="lg"
            className="rounded-[var(--radius-control)] text-[var(--muted)] hover:text-[var(--fg)]"
          >
            <a href="/cv.pdf" target="_blank" rel="noopener noreferrer" className="gap-2">
              <FileDown className="h-4 w-4 text-[var(--accent)]" />
              <span>Resume</span>
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
