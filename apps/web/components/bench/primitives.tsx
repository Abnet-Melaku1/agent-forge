import { cn } from "@agentforge/ui/cn";
import type { ReactNode } from "react";

/** Page header: breadcrumb + title on the left, metrics/action slot on the right. */
export function PageHeader({
  breadcrumb,
  title,
  subtitle,
  right,
}: {
  breadcrumb?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
}): React.ReactElement {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div>
        {breadcrumb && (
          <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-dim">
            {breadcrumb}
          </p>
        )}
        <h1 className="font-display text-2xl text-fg">{title}</h1>
        {subtitle && <p className="mt-1 max-w-xl text-sm text-muted">{subtitle}</p>}
      </div>
      {right && <div className="flex flex-wrap items-center gap-4 sm:gap-6">{right}</div>}
    </header>
  );
}

/** Bordered bench card. Optional uppercase-mono label header with a right-aligned slot. */
export function BenchCard({
  label,
  right,
  className,
  children,
}: {
  label?: string;
  right?: ReactNode;
  className?: string;
  children: ReactNode;
}): React.ReactElement {
  return (
    <div className={cn("border border-line bg-surface p-5", className)}>
      {(label || right) && (
        <div className="mb-4 flex items-center justify-between">
          {label && (
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
              {label}
            </span>
          )}
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

/** Small stat: uppercase label over a mono value. */
export function StatCell({
  label,
  value,
  tone = "fg",
  className,
}: {
  label: string;
  value: ReactNode;
  tone?: "fg" | "amber" | "teal" | "green" | "error";
  className?: string;
}): React.ReactElement {
  const toneClass = {
    fg: "text-fg",
    amber: "text-amber",
    teal: "text-teal",
    green: "text-green",
    error: "text-error",
  }[tone];
  return (
    <div className={className}>
      <p className="font-mono text-[10px] uppercase tracking-wider text-dim">{label}</p>
      <p className={cn("mt-1 font-mono text-lg", toneClass)}>{value}</p>
    </div>
  );
}

/** Horizontal progress meter. `value` is 0..1. */
export function Meter({
  value,
  tone = "amber",
  className,
}: {
  value: number;
  tone?: "amber" | "teal" | "green" | "error";
  className?: string;
}): React.ReactElement {
  const fill = { amber: "bg-amber", teal: "bg-teal", green: "bg-green", error: "bg-error" }[tone];
  return (
    <div className={cn("h-1.5 w-full bg-line-strong", className)}>
      <div className={cn("h-full", fill)} style={{ width: `${Math.min(Math.max(value, 0), 1) * 100}%` }} />
    </div>
  );
}

/** Inline bar chart from relative heights (0..1). Optional highlighted bar index. */
export function MiniBars({
  data,
  tone = "teal",
  highlight,
  className,
}: {
  data: number[];
  tone?: "teal" | "amber";
  highlight?: number;
  className?: string;
}): React.ReactElement {
  const base = tone === "teal" ? "bg-teal/70" : "bg-line-strong";
  return (
    <div className={cn("flex h-16 items-end gap-1.5", className)}>
      {data.map((h, i) => (
        <div
          key={i}
          className={cn("flex-1", i === highlight ? "bg-amber" : base)}
          style={{ height: `${Math.max(h * 100, 6)}%` }}
        />
      ))}
    </div>
  );
}

/** Small bordered pill for protocols/tags. */
export function Chip({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "amber" | "teal";
}): React.ReactElement {
  const toneClass = {
    muted: "border-line-strong text-muted",
    amber: "border-amber/50 text-amber",
    teal: "border-teal/50 text-teal",
  }[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide",
        toneClass,
      )}
    >
      {children}
    </span>
  );
}

/** Label/value row used inside cards. */
export function KeyVal({
  k,
  v,
  tone = "fg",
}: {
  k: string;
  v: ReactNode;
  tone?: "fg" | "amber" | "teal" | "green" | "error";
}): React.ReactElement {
  const toneClass = {
    fg: "text-fg",
    amber: "text-amber",
    teal: "text-teal",
    green: "text-green",
    error: "text-error",
  }[tone];
  return (
    <div className="flex items-center justify-between py-1.5 font-mono text-xs">
      <span className="uppercase tracking-wide text-dim">{k}</span>
      <span className={toneClass}>{v}</span>
    </div>
  );
}
