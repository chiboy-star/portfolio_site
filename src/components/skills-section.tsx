import * as React from "react";
import {
  SiReact,
  SiNextdotjs,
  SiTailwindcss,
  SiHtml5,
  SiCss3,
  SiFigma,
  SiJavascript,
  SiTypescript,
  SiPython,
  SiRust,
  SiCplusplus,
  SiGit,
  SiGithub,
  SiVercel,
} from "@icons-pack/react-simple-icons";

interface SkillItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SkillGroup {
  category: string;
  skills: SkillItem[];
}

const SKILL_GROUPS: SkillGroup[] = [
  {
    category: "Frontend & UI",
    skills: [
      { name: "React", icon: SiReact },
      { name: "Next.js", icon: SiNextdotjs },
      { name: "Tailwind CSS", icon: SiTailwindcss },
      { name: "HTML5", icon: SiHtml5 },
      { name: "CSS3", icon: SiCss3 },
      { name: "Figma", icon: SiFigma },
    ],
  },
  {
    category: "Languages",
    skills: [
      { name: "JavaScript", icon: SiJavascript },
      { name: "TypeScript", icon: SiTypescript },
      { name: "Python", icon: SiPython },
      { name: "Rust", icon: SiRust },
      { name: "C++", icon: SiCplusplus },
    ],
  },
  {
    category: "Tools & Ecosystem",
    skills: [
      { name: "Git", icon: SiGit },
      { name: "GitHub", icon: SiGithub },
      { name: "Vercel", icon: SiVercel },
    ],
  },
];

export function SkillsSection() {
  return (
    <section id="skills" className="mx-auto max-w-[1120px] px-4 py-20 sm:px-6 lg:px-8 border-t border-[var(--border)]">
      <div className="mb-12">
        <span className="caption-mono text-xs text-[var(--accent)] mb-2 block">
          Capabilities
        </span>
        <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-[var(--fg)]">
          Technical Stack
        </h2>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {SKILL_GROUPS.map((group) => (
          <div
            key={group.category}
            className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-6 flex flex-col justify-between"
          >
            <div>
              <h3 className="caption-mono text-xs text-[var(--muted)] mb-4">
                {group.category}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {group.skills.map((skill) => {
                  const Icon = skill.icon;
                  return (
                    <div
                      key={skill.name}
                      className="flex items-center gap-2.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)]/50 px-3 py-2 text-xs font-medium text-[var(--fg)] select-none"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-[var(--accent)]" />
                      <span className="truncate">{skill.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

