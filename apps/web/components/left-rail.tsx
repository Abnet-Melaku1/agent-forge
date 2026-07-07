"use client";

import { cn } from "@agentforge/ui/cn";
import {
  Bot,
  Cpu,
  GitBranch,
  HelpCircle,
  LogIn,
  Plus,
  Share2,
  TerminalSquare,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { NodeRole } from "@/lib/domain";

interface RailItem {
  role: NodeRole;
  icon: LucideIcon;
  label: string;
}

const items: RailItem[] = [
  { role: "source", icon: LogIn, label: "Sources" },
  { role: "agent", icon: Bot, label: "Agents" },
  { role: "tool", icon: Wrench, label: "Tools" },
  { role: "router", icon: GitBranch, label: "Routers" },
  { role: "output", icon: Share2, label: "Outputs" },
];

export function LeftRail({
  active,
  bench = false,
}: {
  active?: NodeRole;
  bench?: boolean;
}): React.ReactElement {
  return (
    <nav className="flex w-16 shrink-0 flex-col items-center border-r border-line bg-topbar py-4">
      {bench && (
        <div className="mb-4 flex flex-col items-center gap-1 border-b border-line pb-4">
          <span className="flex h-8 w-8 items-center justify-center border border-line-strong text-amber">
            <Cpu className="h-4 w-4" strokeWidth={1.5} />
          </span>
          <span className="font-mono text-[9px] uppercase tracking-wider text-dim">Bench v1.0</span>
        </div>
      )}
      <ul className="flex flex-col items-stretch gap-1">
        {items.map(({ role, icon: Icon, label }) => {
          const isActive = role === active;
          return (
            <li key={role}>
              <button
                type="button"
                title={label}
                className={cn(
                  "group relative flex w-16 flex-col items-center gap-1 py-2.5 text-[10px] uppercase tracking-wider transition-colors",
                  isActive ? "text-amber" : "text-dim hover:text-muted",
                )}
              >
                {isActive && <span className="absolute left-0 top-1 h-[calc(100%-8px)] w-0.5 bg-amber" />}
                <Icon className="h-5 w-5" strokeWidth={1.5} />
                <span className="font-mono">{label}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto flex flex-col items-center gap-3 pt-4">
        <button
          type="button"
          title="New node"
          className="flex h-8 w-8 items-center justify-center border border-line-strong text-muted hover:border-amber hover:text-amber"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button type="button" title="Terminal" className="flex flex-col items-center gap-1 text-dim hover:text-muted">
          <TerminalSquare className="h-5 w-5" strokeWidth={1.5} />
          <span className="font-mono text-[10px] uppercase tracking-wider">Terminal</span>
        </button>
        <button type="button" title="Help" className="flex flex-col items-center gap-1 text-dim hover:text-muted">
          <HelpCircle className="h-5 w-5" strokeWidth={1.5} />
          <span className="font-mono text-[10px] uppercase tracking-wider">Help</span>
        </button>
      </div>
    </nav>
  );
}
