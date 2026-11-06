import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--accent)] text-[var(--accent-fg)] font-semibold hover:opacity-90 shadow-sm",
        secondary:
          "bg-[var(--surface)] text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--border)]/40",
        outline:
          "border border-[var(--border)] bg-transparent hover:bg-[var(--surface)] text-[var(--fg)]",
        ghost:
          "hover:bg-[var(--surface)] hover:text-[var(--fg)] text-[var(--muted)]",
        link: "text-[var(--accent)] underline-offset-4 hover:underline",
        destructive: "bg-red-600 text-white hover:bg-red-700",
      },
      size: {
        default: "h-10 px-4 py-2 rounded-[var(--radius-control)]",
        sm: "h-8 px-3 text-xs rounded-[var(--radius-control)]",
        lg: "h-12 px-6 text-base rounded-[var(--radius-control)]",
        icon: "h-10 w-10 rounded-[var(--radius-control)]",
        pill: "h-8 px-4 rounded-[var(--radius-pill)] text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

