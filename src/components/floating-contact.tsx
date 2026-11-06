"use client";

import * as React from "react";
import { Mail } from "lucide-react";

export function FloatingContact() {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const hero = document.getElementById("hero");
    if (!hero) {
      // If hero doesn't exist yet, show on scroll > 300px
      const handleScroll = () => {
        setVisible(window.scrollY > 400);
      };
      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => window.removeEventListener("scroll", handleScroll);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        // When hero is NOT intersecting (scrolled away), show the button
        setVisible(!entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-40 md:hidden animate-in fade-in-0 zoom-in-95 duration-200"
      style={{
        bottom: "max(1.5rem, calc(env(safe-area-inset-bottom) + 1rem))",
        right: "max(1.5rem, calc(env(safe-area-inset-right) + 1rem))",
      }}
    >
      <a
        href="#contact"
        aria-label="Contact Chinemerem"
        className="flex h-12 items-center gap-2 rounded-[var(--radius-pill)] bg-[var(--accent)] text-[var(--accent-fg)] font-semibold px-4 shadow-lg hover:opacity-95 transition-opacity"
      >
        <Mail className="h-4 w-4" />
        <span className="text-sm">Contact</span>
      </a>
    </div>
  );
}

