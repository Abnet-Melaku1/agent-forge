import type { HTMLAttributes } from "react";

import { cn } from "./cn";

/** A bench panel: bordered surface used for cards, tables, and side rails. */
export function Panel({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>): React.ReactElement {
  return (
    <div
      className={cn("border border-line bg-surface rounded-bench", className)}
      {...props}
    />
  );
}

/** A small uppercase mono caption used as a panel/section label. */
export function PanelLabel({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>): React.ReactElement {
  return (
    <span
      className={cn("font-mono text-[11px] uppercase tracking-[0.14em] text-dim", className)}
      {...props}
    />
  );
}
