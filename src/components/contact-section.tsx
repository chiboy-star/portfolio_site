"use client";

import * as React from "react";
import { Mail, Copy, Check, FileDown, ArrowUpRight } from "lucide-react";
import { SiGithub, SiLinkedin } from "@icons-pack/react-simple-icons";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ContactSectionProps {
  email?: string;
  github?: string;
  linkedin?: string;
  cvUrl?: string;
}

export function ContactSection({
  email = "chinemeremmadueke1@gmail.com",
  github = "https://github.com/chiboy-star",
  linkedin = "https://www.linkedin.com/in/chinemerem-madueke-b75038294",
  cvUrl = "/cv.pdf",
}: ContactSectionProps) {
  const [copied, setCopied] = React.useState(false);

  const copyEmail = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    toast.success("Email copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="contact" className="mx-auto max-w-[1120px] px-4 py-24 sm:px-6 lg:px-8 border-t border-[var(--border)]">
      <div className="max-w-3xl">
        <span className="caption-mono text-xs text-[var(--accent)] mb-2 block">
          Initiate Contact
        </span>
        <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-[var(--fg)] mb-6">
          Let&apos;s build something exceptional together.
        </h2>
        <p className="text-base sm:text-lg text-[var(--muted)] font-light mb-10 leading-relaxed">
          I am actively exploring software engineering internship opportunities. Whether you have an open position or just want to connect, my inbox is always open.
        </p>

        {/* Email Display and Copy Cluster */}
        <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="caption-mono text-xs text-[var(--muted)] mb-1 block">
              Direct Inquiries
            </span>
            <span className="text-lg sm:text-2xl font-mono text-[var(--fg)] break-all select-all">
              {email}
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={copyEmail}
              type="button"
              aria-label="Copy email address"
              className="flex h-11 items-center gap-2 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--bg)] px-4 text-xs font-medium text-[var(--fg)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all select-none"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-[var(--muted)]" />
                  <span>Copy</span>
                </>
              )}
            </button>

            <Button
              asChild
              size="default"
              className="h-11 rounded-[var(--radius-control)] bg-[var(--accent)] text-[var(--accent-fg)] font-semibold hover:opacity-90"
            >
              <a href={`mailto:${email}`} className="gap-2">
                <Mail className="h-4 w-4" />
                <span>Send Email</span>
              </a>
            </Button>
          </div>
        </div>

        {/* Socials & CV Links */}
        <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
          <a
            href={github}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-[var(--fg)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all"
          >
            <SiGithub className="h-4 w-4" />
            <span>GitHub</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-[var(--muted)]" />
          </a>

          <a
            href={linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-[var(--fg)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all"
          >
            <SiLinkedin className="h-4 w-4" />
            <span>LinkedIn</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-[var(--muted)]" />
          </a>

          <a
            href={cvUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-[var(--fg)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all"
          >
            <FileDown className="h-4 w-4 text-[var(--accent)]" />
            <span>Download CV</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-[var(--muted)]" />
          </a>
        </div>
      </div>
    </section>
  );
}

