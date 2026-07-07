"use client";

import { StatusLed } from "@agentforge/ui/status-led";
import { PanelLabel } from "@agentforge/ui/panel";
import { Minimize2 } from "lucide-react";
import { useEffect, useRef } from "react";

import type { NodeRole } from "@/lib/domain";
import { flowNodes } from "@/lib/mock/graph";
import { roleStyles } from "@/lib/roles";
import { useRunStore } from "@/stores/run-store";

const roleById = new Map<string, NodeRole>(flowNodes.map((n) => [n.id, n.data.role]));

function nodeTextClass(node: string): string {
  const role = roleById.get(node);
  return role ? roleStyles[role].text : "text-muted";
}

/** Static timeline (fractions of the window) shown before a run starts, matching the design. */
const IDLE_TIMELINE: { id: string; start: number; end: number }[] = [
  { id: "USER_QUERY", start: 0, end: 0.12 },
  { id: "PLANNER_LM", start: 0.17, end: 1 },
  { id: "SEARCH_API", start: 0.22, end: 0.56 },
];

export function ExecutionLog(): React.ReactElement {
  const phase = useRunStore((s) => s.phase);
  const log = useRunStore((s) => s.log);
  const timeline = useRunStore((s) => s.timeline);
  const latencyMs = useRunStore((s) => s.totals.latencyMs);

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [log]);

  const running = phase === "running";
  const runtime = latencyMs > 0 ? `${(latencyMs / 1000).toFixed(1)}s` : "1.2s";

  return (
    <section className="flex h-[280px] shrink-0 flex-col border-t border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-5 py-2.5">
        <div className="flex items-center gap-3">
          <PanelLabel className="text-muted">Execution_Log</PanelLabel>
          <span className="flex items-center gap-2">
            <StatusLed tone={running ? "active" : phase === "succeeded" ? "ok" : "idle"} pulse={running} />
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
              {running ? "Streaming..." : phase === "succeeded" ? "Complete" : "Idle"}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px] text-muted">
          <span>
            TOTAL_RUNTIME: <span className="text-fg">{runtime}</span>
          </span>
          <Minimize2 className="h-3.5 w-3.5 text-dim" />
        </div>
      </div>

      <div className="grid flex-1 grid-cols-2 overflow-hidden">
        {/* Terminal log */}
        <div ref={scrollRef} className="overflow-y-auto border-r border-line bg-ink px-4 py-3">
          {log.length === 0 && (
            <p className="font-mono text-xs text-dim">Awaiting run. Press ▶ Run to stream execution.</p>
          )}
          {log.map((line, i) => (
            <p key={i} className="font-mono text-xs leading-relaxed">
              <span className="text-dim">[{line.time}]</span>{" "}
              <span className={nodeTextClass(line.node)}>{line.node}:</span>{" "}
              <span className={line.emphasis ? "text-ok" : "text-muted"}>{line.text}</span>
            </p>
          ))}
          {running && <span className="inline-block h-3.5 w-2 animate-pulse bg-amber align-middle" />}
        </div>

        {/* Node execution timeline */}
        <div className="overflow-y-auto px-5 py-3">
          <PanelLabel className="text-dim">Node_Execution_Timeline</PanelLabel>
          <div className="mt-3 space-y-2.5">
            {IDLE_TIMELINE.map(({ id, start, end }) => {
              const bar = timeline[id];
              const [s, e] =
                phase === "idle" || !bar
                  ? [start, end]
                  : normalize(bar.start, bar.end, latencyMs || 1);
              const role = roleById.get(id);
              const barColor = role ? roleStyles[role].bg : "bg-muted";
              return (
                <div key={id} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 font-mono text-[11px] uppercase text-muted">{id}</span>
                  <div className="relative h-4 flex-1 bg-ink">
                    <div
                      className={`absolute top-0 h-full ${barColor}`}
                      style={{ left: `${s * 100}%`, width: `${Math.max((e - s) * 100, 3)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function normalize(start: number, end: number | null, total: number): [number, number] {
  const e = end ?? total;
  return [Math.min(start / total, 1), Math.min(e / total, 1)];
}
