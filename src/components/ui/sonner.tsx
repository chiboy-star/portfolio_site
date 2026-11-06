"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[var(--surface)] group-[.toaster]:text-[var(--fg)] group-[.toaster]:border-[var(--border)] group-[.toaster]:shadow-lg group-[.toaster]:rounded-[var(--radius-control)]",
          description: "group-[.toast]:text-[var(--muted)]",
          actionButton:
            "group-[.toast]:bg-[var(--accent)] group-[.toast]:text-[var(--accent-fg)] group-[.toast]:rounded-[var(--radius-control)]",
          cancelButton:
            "group-[.toast]:bg-[var(--border)] group-[.toast]:text-[var(--muted)] group-[.toast]:rounded-[var(--radius-control)]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };

