import { PanelLabel } from "@agentforge/ui/panel";
import { Zap } from "lucide-react";

import { libraryStats } from "@/lib/mock/workflows";

export function NodeDistributionCard(): React.ReactElement {
  const bars = libraryStats.distribution;
  return (
    <Card>
      <div className="flex items-center justify-between">
        <PanelLabel>Node_Distribution</PanelLabel>
        <span className="font-display text-sm font-semibold uppercase tracking-widest text-amber">
          Live
        </span>
      </div>
      <div className="mt-6 flex h-24 items-end gap-2.5">
        {bars.map((h, i) => (
          <div
            key={i}
            className="flex-1 border border-line-strong bg-surface-raised"
            style={{ height: `${Math.max(h * 100, 8)}%` }}
          />
        ))}
      </div>
    </Card>
  );
}

export function CostAccumulationCard(): React.ReactElement {
  const { costAccumulation, costDeltaPct } = libraryStats;
  return (
    <Card>
      <div className="flex items-center justify-between">
        <PanelLabel>Total_Cost_Accumulation</PanelLabel>
        <span className="font-display text-sm font-semibold uppercase tracking-widest text-muted">
          Daily
        </span>
      </div>
      <p className="mt-6 font-mono text-3xl text-fg">
        ${costAccumulation.toLocaleString("en-US", { minimumFractionDigits: 2 })}
      </p>
      <p className="mt-2 font-mono text-xs text-amber">
        +{costDeltaPct}% <span className="text-dim">FROM PREV_CYCLE</span>
      </p>
    </Card>
  );
}

export function QuickActionCard(): React.ReactElement {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <PanelLabel>Quick_Action</PanelLabel>
        <Zap className="h-3.5 w-3.5 text-amber" fill="currentColor" />
      </div>
      <button
        type="button"
        className="mt-6 w-full border border-line-strong bg-surface-raised py-3 font-mono text-xs uppercase tracking-wider text-muted transition-colors hover:border-amber hover:text-amber"
      >
        Initialize New Bench
      </button>
    </Card>
  );
}

function Card({ children }: { children: React.ReactNode }): React.ReactElement {
  return <div className="border border-line bg-surface p-5">{children}</div>;
}
