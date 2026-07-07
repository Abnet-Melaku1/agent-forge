import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "./cn";

const button = cva(
  "inline-flex items-center justify-center gap-2 rounded-bench font-mono text-xs uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Amber signal — the single primary action
        primary: "bg-amber text-ink hover:bg-amber-dim font-semibold",
        // Outline — secondary bench action
        outline: "border border-line-strong text-fg hover:border-amber hover:text-amber",
        ghost: "text-muted hover:text-fg hover:bg-surface-raised",
      },
      size: {
        sm: "h-7 px-3",
        md: "h-9 px-4",
      },
    },
    defaultVariants: { variant: "outline", size: "md" },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(button({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = "Button";
