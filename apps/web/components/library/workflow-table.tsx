import { StatusLed, type LedTone } from "@agentforge/ui/status-led";
import Link from "next/link";

import { formatCostUsd, formatNodeCount } from "@/lib/format";
import { workflows, type WorkflowState } from "@/lib/mock/workflows";

const stateTone: Record<WorkflowState, LedTone> = {
  executing: "active",
  indexing: "active",
  idle: "idle",
  error: "error",
};

const columns = ["Name (ID)", "Status", "Nodes", "Last Run", "Total Cost"] as const;

export function WorkflowTable(): React.ReactElement {
  return (
    <section className="mt-6 border border-line bg-surface">
      <div className="grid grid-cols-[2.4fr_1.4fr_0.8fr_1.2fr_1fr] border-b border-line px-6 py-3">
        {columns.map((c, i) => (
          <span
            key={c}
            className={`font-mono text-[10px] uppercase tracking-wider text-dim ${i >= 2 ? "text-right" : ""} ${i === 4 ? "text-right" : ""}`}
          >
            {c}
          </span>
        ))}
      </div>
      <ul>
        {workflows.map((w) => (
          <li key={w.uuid}>
            <Link
              href="/editor"
              className="grid grid-cols-[2.4fr_1.4fr_0.8fr_1.2fr_1fr] items-center border-b border-line px-6 py-4 transition-colors last:border-b-0 hover:bg-surface-raised"
            >
              <div>
                <p className="font-mono text-sm text-fg">{w.name}</p>
                <p className="font-mono text-xs text-dim">UUID: {w.uuid}</p>
              </div>
              <div className="flex items-center gap-2.5">
                <StatusLed tone={stateTone[w.state]} pulse={w.state !== "idle"} />
                <span
                  className={`font-mono text-xs uppercase tracking-wide ${w.state === "error" ? "text-error" : "text-muted"}`}
                >
                  {w.stateLabel}
                </span>
              </div>
              <span className="text-right font-mono text-sm text-fg">
                {formatNodeCount(w.nodes)}
              </span>
              <span className="text-right font-mono text-xs text-muted">{w.lastRun}</span>
              <span className="text-right font-mono text-sm text-amber">
                {formatCostUsd(w.costUsd)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
