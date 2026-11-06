"use client";

import * as React from "react";
import { X, FileDown } from "lucide-react";
import { SiGithub, SiLinkedin } from "@icons-pack/react-simple-icons";
import { ThemeToggle } from "@/components/theme-toggle";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: string;
}

export function MobileMenu({ isOpen, onClose, activeSection }: MobileMenuProps) {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const navLinks = [
    { label: "Work", href: "#work", id: "work" },
    { label: "Skills", href: "#skills", id: "skills" },
    { label: "About", href: "#about", id: "about" },
    { label: "Contact", href: "#contact", id: "contact" },
  ];

  const handleLinkClick = (href: string) => {
    onClose();
    const element = document.querySelector(href);
    if (element) {
      setTimeout(() => {
        element.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation"
      className="fixed inset-0 z-50 flex flex-col bg-[var(--bg)] text-[var(--fg)] p-6 pt-safe pb-safe animate-in fade-in-0 duration-200"
      style={{
        paddingTop: "max(1.5rem, env(safe-area-inset-top))",
        paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
      }}
    >
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <span className="caption-mono text-sm tracking-widest text-[var(--muted)]">
          Menu
        </span>
        <button
          onClick={onClose}
          type="button"
          aria-label="Close menu"
          className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] border border-[var(--border)] text-[var(--fg)] hover:bg-[var(--surface)] transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="my-auto flex flex-col items-start gap-8 py-8">
        {navLinks.map((link) => {
          const isActive = activeSection === link.id;
          return (
            <button
              key={link.id}
              onClick={() => handleLinkClick(link.href)}
              className="text-4xl font-extralight tracking-tight text-[var(--fg)] transition-colors hover:text-[var(--accent)] relative group text-left"
            >
              <span>{link.label}</span>
              <span
                className={`block h-0.5 bg-[var(--accent)] transition-all duration-200 ${
                  isActive ? "w-full" : "w-0 group-hover:w-full"
                }`}
              />
            </button>
          );
        })}
      </nav>

      <div className="flex flex-col gap-4 border-t border-[var(--border)] pt-6">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--muted)]">Appearance</span>
          <ThemeToggle />
        </div>

        <div className="flex items-center gap-4 pt-2">
          <a
            href="https://github.com/chiboy-star"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub Profile"
            className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] border border-[var(--border)] text-[var(--fg)] hover:border-[var(--accent)] transition-colors"
          >
            <SiGithub className="h-5 w-5" />
          </a>
          <a
            href="https://www.linkedin.com/in/chinemerem-madueke-b75038294"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn Profile"
            className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] border border-[var(--border)] text-[var(--fg)] hover:border-[var(--accent)] transition-colors"
          >
            <SiLinkedin className="h-5 w-5" />
          </a>
          <a
            href="/cv.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 items-center gap-2 px-4 rounded-[var(--radius-control)] border border-[var(--border)] text-sm font-medium hover:border-[var(--accent)] transition-colors"
          >
            <FileDown className="h-4 w-4 text-[var(--accent)]" />
            <span>CV</span>
          </a>
        </div>
      </div>
    </div>
  );
}

