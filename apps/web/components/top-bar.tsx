"use client";

import { Button } from "@agentforge/ui/button";
import { cn } from "@agentforge/ui/cn";
import { Activity, History, Play } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { SettingsMenu } from "@/components/bench/settings-menu";

export function Wordmark(): React.ReactElement {
  return (
    <Link href="/" className="font-display text-lg font-bold tracking-tight text-fg">
      AGENT<span className="text-fg">FORGE</span>
    </Link>
  );
}

export function TopBar({
  center,
  onRun,
}: {
  center?: ReactNode;
  onRun?: () => void;
}): React.ReactElement {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-topbar pl-3 pr-3 sm:gap-6 sm:pl-5 sm:pr-4">
      <Wordmark />
      {center}
      <div className="ml-auto flex items-center gap-2 sm:gap-4">
        <div className="hidden items-center gap-3 text-muted sm:flex">
          <Link href="/observability" title="Run history" className="hover:text-fg">
            <History className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </Link>
          <Link href="/infrastructure" title="Live activity" className="hover:text-fg">
            <Activity className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </Link>
          <SettingsMenu />
        </div>
        <Button variant="outline" size="sm" className="hidden sm:inline-flex">
          Deploy
        </Button>
        <Button variant="primary" size="sm" onClick={onRun}>
          <Play className="h-3 w-3" fill="currentColor" />
          Run
        </Button>
      </div>
    </header>
  );
}

/** Nav links shown in the Library top bar. */
export function TopNav({ active }: { active: string }): React.ReactElement {
  const links = [
    { label: "Workflows", href: "/" },
    { label: "Observability", href: "/observability" },
    { label: "Infrastructure", href: "/infrastructure" },
  ];
  return (
    <nav className="hidden items-center gap-6 md:flex">
      {links.map((l) => (
        <Link
          key={l.label}
          href={l.href}
          className={cn(
            "relative py-1 font-display text-sm transition-colors",
            l.label === active ? "text-fg" : "text-muted hover:text-fg",
          )}
        >
          {l.label}
          {l.label === active && (
            <span className="absolute -bottom-[18px] left-0 h-0.5 w-full bg-amber" />
          )}
        </Link>
      ))}
    </nav>
  );
}

/** Mono run-context strip shown in the Editor top bar. */
export function RunContext({
  name,
  tokens,
  cost,
  latency,
}: {
  name: string;
  tokens: string;
  cost: string;
  latency: string;
}): React.ReactElement {
  return (
    <div className="hidden items-center gap-4 font-mono text-xs lg:flex">
      <span className="text-fg">{name}</span>
      <span className="text-dim">|</span>
      <Metric label="TOKENS" value={tokens} />
      <Metric label="COST" value={cost} />
      <Metric label="LATENCY" value={latency} />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <span className="text-muted">
      {label}: <span className="text-fg">{value}</span>
    </span>
  );
}
