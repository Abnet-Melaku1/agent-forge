"use client";

import { cn } from "@agentforge/ui/cn";
import { Bot, Database, FileText, GitBranch, LogOut, TerminalSquare, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { label: "Sources", href: "/sources", icon: Database },
  { label: "Agents", href: "/editor", icon: Bot },
  { label: "Tools", href: "/tools", icon: Wrench },
  { label: "Routers", href: "/routers", icon: GitBranch },
  { label: "Outputs", href: "/outputs", icon: LogOut },
];

export const navFooter: NavItem[] = [
  { label: "Terminal", href: "/editor", icon: TerminalSquare },
  { label: "Logs", href: "/observability", icon: FileText },
];

/** Wide labeled sidebar used by the management/inventory pages. `active` is the item label. */
export function SideNav({ active }: { active: string }): React.ReactElement {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-line bg-surface-raised">
      <div className="border-b border-line px-6 py-5">
        <p className="font-display text-xl font-bold text-amber">Bench v1.0</p>
        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-dim">
          Precision Orchestrator
        </p>
      </div>

      <nav className="flex flex-col gap-1 p-3">
        {navItems.map((it) => (
          <NavLink key={it.label} item={it} active={it.label === active} />
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-1 border-t border-line p-3">
        {navFooter.map((it) => (
          <NavLink key={it.label} item={it} active={it.label === active} />
        ))}
      </div>
    </aside>
  );
}

function NavLink({ item, active }: { item: NavItem; active: boolean }): React.ReactElement {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "relative flex items-center gap-3 px-3 py-2.5 font-mono text-sm transition-colors",
        active ? "bg-surface-active text-amber" : "text-muted hover:bg-surface hover:text-fg",
      )}
    >
      {active && <span className="absolute left-0 top-0 h-full w-0.5 bg-amber" />}
      <Icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
      {item.label}
    </Link>
  );
}
