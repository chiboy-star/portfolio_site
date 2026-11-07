"use client";

import * as React from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { ScrollProgress } from "@/components/scroll-progress";
import { CommandMenu } from "@/components/command-menu";
import { MobileMenu } from "@/components/mobile-menu";
import { Menu, FileDown, Command as CmdIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  const [activeSection, setActiveSection] = React.useState<string>("hero");
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const sectionIds = ["hero", "work", "skills", "about", "contact"];
    const observers: IntersectionObserver[] = [];

    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (!element) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveSection(id);
            }
          });
        },
        { rootMargin: "-20% 0px -60% 0px" }
      );

      observer.observe(element);
      observers.push(observer);
    });

    return () => {
      observers.forEach((obs) => obs.disconnect());
    };
  }, []);

  const navItems = [
    { label: "Work", href: "#work", id: "work" },
    { label: "Skills", href: "#skills", id: "skills" },
    { label: "About", href: "#about", id: "about" },
    { label: "Contact", href: "#contact", id: "contact" },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-md transition-colors">
        <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo / Name */}
          <a
            href="#"
            className="group flex items-center gap-2 text-sm font-medium tracking-tight text-[var(--fg)] hover:text-[var(--accent)] transition-colors select-none"
          >
            <span className="font-mono text-xs text-[var(--accent)]">[cm]</span>
            <span className="font-semibold hidden sm:inline">Chinemerem Madueke</span>
            <span className="font-semibold sm:hidden">C. Madueke</span>
          </a>

          {/* Desktop Nav with 5.4 Underline Effect */}
          <nav className="hidden md:flex items-center gap-8 text-sm" aria-label="Main Navigation">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <a
                  key={item.id}
                  href={item.href}
                  data-active={isActive ? "true" : "false"}
                  className={`nav-link text-sm transition-colors ${
                    isActive ? "text-[var(--fg)] font-medium" : "text-[var(--muted)] hover:text-[var(--fg)]"
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-3">
            {/* Command Menu Chip - Always in DOM for hydration parity; hidden by CSS on non-full tier */}
            <button
              id="command-menu-trigger"
              onClick={() => setCommandOpen(true)}
              type="button"
              aria-label="Search and command palette (⌘K)"
              className="hidden lg:flex items-center gap-2 h-8 px-2.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--fg)] transition-all select-none"
            >
              <CmdIcon className="h-3.5 w-3.5 text-[var(--accent)]" />
              <span className="font-mono text-[11px] tracking-wider">⌘K</span>
            </button>

            {/* Theme Toggle Pill */}
            <ThemeToggle />

            {/* CV Download Button */}
            <Button
              variant="outline"
              size="sm"
              asChild
              className="hidden sm:inline-flex gap-1.5 border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              <a href="/cv.pdf" target="_blank" rel="noopener noreferrer">
                <FileDown className="h-3.5 w-3.5 text-[var(--accent)]" />
                <span>CV</span>
              </a>
            </Button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              type="button"
              aria-label="Open mobile menu"
              className="flex md:hidden h-10 w-10 items-center justify-center rounded-[var(--radius-control)] border border-[var(--border)] text-[var(--fg)] hover:bg-[var(--surface)] transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scroll Progress Indicator Line */}
        <ScrollProgress />
      </header>

      {/* Command Menu Palette */}
      <CommandMenu open={commandOpen} setOpen={setCommandOpen} />

      {/* Mobile Navigation Drawer/Overlay */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        activeSection={activeSection}
      />
    </>
  );
}

