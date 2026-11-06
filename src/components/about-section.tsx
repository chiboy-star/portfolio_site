import * as React from "react";
import { GraduationCap, MapPin } from "lucide-react";

export function AboutSection() {
  return (
    <section id="about" className="mx-auto max-w-[1120px] px-4 py-20 sm:px-6 lg:px-8 border-t border-[var(--border)]">
      <div className="grid gap-12 md:grid-cols-[1fr_1.5fr] items-start">
        <div>
          <span className="caption-mono text-xs text-[var(--accent)] mb-2 block">
            Background
          </span>
          <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-[var(--fg)]">
            About Me
          </h2>
        </div>

        <div className="flex flex-col gap-6">
          {/* Main 60-word Bio */}
          <p className="text-base sm:text-lg text-[var(--fg)] font-light leading-relaxed">
            I am a second-year Software Engineering student at Pan-Atlantic University focused on front-end engineering. I specialize in building responsive, accessible, and API-driven web applications using React and Next.js. I am dedicated to clean code, performance, and expanding my capabilities into systems, backend engineering, and cybersecurity.
          </p>

          {/* Education and Location Cards (Single surface, flat) */}
          <div className="grid gap-4 sm:grid-cols-2 pt-4 border-t border-[var(--border)]">
            <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-4 flex items-start gap-3">
              <GraduationCap className="h-5 w-5 text-[var(--accent)] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs caption-mono text-[var(--muted)]">Education</p>
                <p className="text-sm font-medium text-[var(--fg)]">Pan-Atlantic University</p>
                <p className="text-xs text-[var(--muted)]">B.Sc. Software Engineering</p>
              </div>
            </div>

            <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-4 flex items-start gap-3">
              <MapPin className="h-5 w-5 text-[var(--accent)] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs caption-mono text-[var(--muted)]">Location</p>
                <p className="text-sm font-medium text-[var(--fg)]">Lagos, Nigeria</p>
                <p className="text-xs text-[var(--muted)]">Open to Remote / Hybrid Roles</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

