"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Theme toggle"
        className={cn("theme-toggle h-8 w-14 rounded-[var(--radius-pill)] border border-[var(--border)] bg-[var(--surface)] opacity-70", className)}
      />
    );
  }

  const cycleTheme = () => {
    if (theme === "system") setTheme("light");
    else if (theme === "light") setTheme("dark");
    else setTheme("system");
  };

  const getIcon = () => {
    if (theme === "light") return <Sun className="h-4 w-4 text-[var(--accent)] transition-all" />;
    if (theme === "dark") return <Moon className="h-4 w-4 text-[var(--accent)] transition-all" />;
    return <Monitor className="h-4 w-4 text-[var(--accent)] transition-all" />;
  };

  const getLabel = () => {
    if (theme === "light") return "Light";
    if (theme === "dark") return "Dark";
    return "System";
  };

  return (
    <button
      onClick={cycleTheme}
      type="button"
      aria-label={`Current theme: ${getLabel()}. Click to cycle.`}
      className={cn(
        "theme-toggle inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-pill)] border border-[var(--border)] bg-[var(--surface)] px-2.5 text-xs font-medium text-[var(--fg)] hover:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] transition-colors select-none",
        className
      )}
    >
      {getIcon()}
      <span className="text-[11px] font-mono tracking-wider uppercase text-[var(--muted)]">{getLabel()}</span>
    </button>
  );
}

