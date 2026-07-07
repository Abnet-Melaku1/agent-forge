import { forwardRef, type TextareaHTMLAttributes } from "react";

import { cn } from "./cn";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full resize-none border border-line bg-ink px-3 py-2 font-mono text-[13px] leading-relaxed text-fg placeholder:text-dim focus-visible:border-amber focus-visible:outline-none",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
