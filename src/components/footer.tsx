"use client";

import * as React from "react";
import { ArrowUp } from "lucide-react";

interface FooterProps {
  updatedAt?: string;
}

const FIXED_DEFAULT_DATE = "2026-11-06";

export function Footer({ updatedAt }: FooterProps) {
  const [displayDate, setDisplayDate] = React.useState(updatedAt || FIXED_DEFAULT_DATE);
  const [year, setYear] = React.useState(2026);

  React.useEffect(() => {
    setYear(new Date().getFullYear());
    if (!updatedAt) {
      setDisplayDate(new Date().toISOString().split("T")[0]);
    }
  }, [updatedAt]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="w-full border-t border-[var(--border)] bg-[var(--surface)]/30 py-8 text-xs text-[var(--muted)]">
      <div className="mx-auto flex max-w-[1120px] flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
          <span>© {year} Chinemerem Madueke</span>
          <span className="hidden sm:inline text-[var(--border)]">•</span>
          <span className="tabular-nums">
            Last updated <time dateTime={displayDate}>{displayDate}</time>
          </span>
        </div>

        <button
          onClick={scrollToTop}
          type="button"
          aria-label="Back to top"
          className="flex h-10 items-center gap-2 rounded-[var(--radius-control)] px-3 py-1.5 border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--fg)] transition-all select-none cursor-pointer"
        >
          <span>Back to top</span>
          <ArrowUp className="h-3.5 w-3.5 text-[var(--accent)]" />
        </button>
      </div>
    </footer>
  );
}
