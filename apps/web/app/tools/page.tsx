import { StatusLed } from "@agentforge/ui/status-led";
import { Code2, Database, Globe, LayoutGrid, Plus, SlidersHorizontal } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { AppShell } from "@/components/bench/app-shell";
import { PageHeader } from "@/components/bench/primitives";
import { tools, toolsStats, type ToolCard } from "@/lib/mock/tools";

const icons: Record<ToolCard["icon"], LucideIcon> = {
  globe: Globe,
  grid: LayoutGrid,
  code: Code2,
  database: Database,
};

export default function ToolsPage(): React.ReactElement {
  return (
    <AppShell nav="Tools" topNav="Workflows" searchPlaceholder="CMD+K to search">
      <PageHeader
        title="Toolbox Registry"
        subtitle="Configure and calibrate high-precision instrument-grade toolsets for agentic calling. All modules are sandboxed by default."
        right={
          <>
            <StatBox label="Total Calls" value={toolsStats.totalCalls} />
            <StatBox label="Avg System Latency" value={toolsStats.avgSystemLatency} />
          </>
        }
      />

      <div className="grid grid-cols-3 gap-5">
        {tools.map((t) => (
          <ToolTile key={t.name} tool={t} />
        ))}
        <NewModuleTile />
      </div>

      <StatusStrip />
    </AppShell>
  );
}

function StatBox({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div className="border border-line px-4 py-2">
      <p className="font-mono text-[10px] uppercase tracking-wider text-dim">{label}</p>
      <p className="mt-0.5 font-mono text-sm text-amber">{value}</p>
    </div>
  );
}

function ToolTile({ tool }: { tool: ToolCard }): React.ReactElement {
  const Icon = icons[tool.icon];
  return (
    <div className="flex flex-col border border-line border-l-2 border-l-amber bg-surface">
      <div className="flex items-start justify-between p-5 pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center border border-line-strong text-amber">
            <Icon className="h-5 w-5" strokeWidth={1.5} />
          </span>
          <div>
            <p className="font-display text-lg text-fg">{tool.name}</p>
            <p className="font-mono text-[10px] uppercase tracking-wide text-dim">
              Provider: {tool.provider}
            </p>
          </div>
        </div>
        <StatusLed tone="ok" pulse />
      </div>
      <p className="px-5 text-sm leading-relaxed text-muted">{tool.description}</p>
      <div className="mt-auto flex items-end justify-between px-5 pb-4 pt-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wide text-dim">Usage_Count</p>
          <p className="font-mono text-sm text-fg">{tool.usageCount}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[10px] uppercase tracking-wide text-dim">Avg_Latency</p>
          <p className="font-mono text-sm text-fg">{tool.avgLatency}</p>
        </div>
      </div>
      <button
        type="button"
        className="flex items-center justify-center gap-2 border-t border-line bg-surface-raised py-3 font-mono text-xs uppercase tracking-wider text-muted hover:text-amber"
      >
        {tool.action}
        <SlidersHorizontal className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function NewModuleTile(): React.ReactElement {
  return (
    <button
      type="button"
      className="flex min-h-[280px] flex-col items-center justify-center gap-3 border border-dashed border-line-strong text-dim hover:border-amber hover:text-amber"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-current">
        <Plus className="h-5 w-5" />
      </span>
      <span className="font-display text-lg">NEW_MODULE</span>
      <span className="font-mono text-[10px] uppercase tracking-wider">Initialize Custom Tool</span>
    </button>
  );
}

function StatusStrip(): React.ReactElement {
  return (
    <div className="mt-6 flex items-center gap-6 border border-line bg-ink px-4 py-2.5 font-mono text-[11px]">
      <span className="flex items-center gap-2 text-teal">
        <StatusLed tone="active" pulse />
        SYSTEM_READY
      </span>
      <div className="flex flex-1 gap-8 overflow-hidden text-dim">
        {toolsStats.ticker.map((t) => (
          <span key={t} className="whitespace-nowrap">
            [LOG] {t}
          </span>
        ))}
      </div>
      <span className="shrink-0 text-muted">{toolsStats.version}</span>
    </div>
  );
}
