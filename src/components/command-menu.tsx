"use client";

import * as React from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useTheme } from "next-themes";
import { useTier } from "@/hooks/use-tier";
import {
  Briefcase,
  Layers,
  User,
  Mail,
  FileDown,
  Sun,
  Moon,
  Monitor,
  ExternalLink,
  Copy,
  Check,
  RotateCcw,
} from "lucide-react";
import { SiGithub, SiLinkedin } from "@icons-pack/react-simple-icons";
import { toast } from "sonner";

interface CommandMenuProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  projects?: Array<{ id: string; title: string }>;
}

export function CommandMenu({ open, setOpen, projects = [] }: CommandMenuProps) {
  const { setTheme } = useTheme();
  const tier = useTier();
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, setOpen]);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  const copyEmail = () => {
    navigator.clipboard.writeText("chinemeremmadueke1@gmail.com");
    setCopied(true);
    toast.success("Email copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          <CommandItem
            onSelect={() =>
              runCommand(() => {
                document.getElementById("work")?.scrollIntoView({ behavior: "smooth" });
              })
            }
          >
            <Briefcase className="mr-2 h-4 w-4 text-[var(--accent)]" />
            <span>Work & Projects</span>
            <CommandShortcut>G W</CommandShortcut>
          </CommandItem>

          <CommandItem
            onSelect={() =>
              runCommand(() => {
                document.getElementById("skills")?.scrollIntoView({ behavior: "smooth" });
              })
            }
          >
            <Layers className="mr-2 h-4 w-4 text-[var(--accent)]" />
            <span>Skills & Stack</span>
            <CommandShortcut>G S</CommandShortcut>
          </CommandItem>

          <CommandItem
            onSelect={() =>
              runCommand(() => {
                document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
              })
            }
          >
            <User className="mr-2 h-4 w-4 text-[var(--accent)]" />
            <span>About Me</span>
            <CommandShortcut>G A</CommandShortcut>
          </CommandItem>

          <CommandItem
            onSelect={() =>
              runCommand(() => {
                document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
              })
            }
          >
            <Mail className="mr-2 h-4 w-4 text-[var(--accent)]" />
            <span>Contact</span>
            <CommandShortcut>G C</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        {projects.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Projects">
              {projects.map((project) => (
                <CommandItem
                  key={project.id}
                  onSelect={() =>
                    runCommand(() => {
                      document.getElementById(`project-${project.id}`)?.scrollIntoView({ behavior: "smooth" });
                    })
                  }
                >
                  <Briefcase className="mr-2 h-4 w-4 text-[var(--muted)]" />
                  <span>{project.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        <CommandSeparator />
        <CommandGroup heading="Connect & Links">
          <CommandItem
            onSelect={() =>
              runCommand(() => {
                window.open("https://github.com/chiboy-star", "_blank", "noopener,noreferrer");
              })
            }
          >
            <SiGithub className="mr-2 h-4 w-4" />
            <span>GitHub Profile</span>
            <CommandShortcut><ExternalLink className="h-3 w-3" /></CommandShortcut>
          </CommandItem>

          <CommandItem
            onSelect={() =>
              runCommand(() => {
                window.open("https://www.linkedin.com/in/chinemerem-madueke-b75038294", "_blank", "noopener,noreferrer");
              })
            }
          >
            <SiLinkedin className="mr-2 h-4 w-4" />
            <span>LinkedIn Profile</span>
            <CommandShortcut><ExternalLink className="h-3 w-3" /></CommandShortcut>
          </CommandItem>

          <CommandItem onSelect={() => runCommand(copyEmail)}>
            {copied ? (
              <Check className="mr-2 h-4 w-4 text-emerald-500" />
            ) : (
              <Copy className="mr-2 h-4 w-4 text-[var(--muted)]" />
            )}
            <span>Copy Email Address</span>
            <CommandShortcut>chinemeremmadueke1@gmail.com</CommandShortcut>
          </CommandItem>

          <CommandItem
            onSelect={() =>
              runCommand(() => {
                window.open("/cv.pdf", "_blank");
              })
            }
          >
            <FileDown className="mr-2 h-4 w-4 text-[var(--muted)]" />
            <span>View CV / Resume</span>
          </CommandItem>

          {tier === "full" && (
            <CommandItem
              onSelect={() =>
                runCommand(() => {
                  try {
                    sessionStorage.removeItem("introSeen");
                  } catch {}
                  window.dispatchEvent(new CustomEvent("intro:replay"));
                  toast.info("Replaying intro banner");
                })
              }
            >
              <RotateCcw className="mr-2 h-4 w-4 text-[var(--accent)]" />
              <span>Replay Intro</span>
              <CommandShortcut>?intro=1</CommandShortcut>
            </CommandItem>
          )}
        </CommandGroup>

        <CommandSeparator />
        <CommandGroup heading="Theme">
          <CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
            <Sun className="mr-2 h-4 w-4 text-[var(--muted)]" />
            <span>Light Mode</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
            <Moon className="mr-2 h-4 w-4 text-[var(--muted)]" />
            <span>Dark Mode</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme("system"))}>
            <Monitor className="mr-2 h-4 w-4 text-[var(--muted)]" />
            <span>System Default</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

