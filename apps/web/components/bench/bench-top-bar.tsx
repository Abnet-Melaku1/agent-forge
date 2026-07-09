"use client";

import { cn } from "@agentforge/ui/cn";
import { CircleHelp, Search } from "lucide-react";
import Link from "next/link";

import { MobileNavTrigger } from "./mobile-nav";
import { SettingsMenu } from "./settings-menu";

const topLinks = [
  { label: "Workflows", href: "/" },
  { label: "Observability", href: "/observability" },
  { label: "Infrastructure", href: "/infrastructure" },
];

/** Top bar for management pages: wordmark, section nav, global search, settings/help. */
export function BenchTopBar({
  activeTop,
  searchPlaceholder = "Global Search...",
}: {
  activeTop: string;
  searchPlaceholder?: string;
}): React.ReactElement {
  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-line bg-surface-raised pl-3 pr-3 sm:gap-6 sm:pl-5 sm:pr-4 lg:gap-8">
      <MobileNavTrigger />
      <Link
        href="/"
        className="shrink-0 font-display text-lg font-bold tracking-tight text-amber"
      >
        AgentForge
      </Link>

      <nav className="hidden items-center gap-6 md:flex">
        {topLinks.map((l) => (
          <Link
            key={l.label}
            href={l.href}
            className={cn(
              "relative py-1 font-display text-sm transition-colors",
              l.label === activeTop ? "text-fg" : "text-muted hover:text-fg",
            )}
          >
            {l.label}
            {l.label === activeTop && (
              <span className="absolute -bottom-[22px] left-0 h-0.5 w-full bg-amber" />
            )}
          </Link>
        ))}
      </nav>

      <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-4">
        <div className="relative hidden w-40 sm:block lg:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dim" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            className="h-9 w-full border border-line-strong bg-search pl-9 pr-3 font-mono text-xs text-fg placeholder:text-dim focus:border-amber focus:outline-none"
          />
        </div>
        <SettingsMenu />
        <Link href="/observability" title="Help &amp; telemetry" className="text-muted hover:text-fg">
          <CircleHelp className="h-[18px] w-[18px]" strokeWidth={1.5} />
        </Link>
      </div>
    </header>
  );
}
