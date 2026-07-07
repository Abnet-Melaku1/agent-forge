import { create } from "zustand";

import type { NodeStatus } from "@/lib/domain";
import { runScript, type LogLine } from "@/lib/mock/run-events";

export type RunPhase = "idle" | "running" | "succeeded" | "failed";

/** A node's live status while a run streams. "running" is the in-flight UI state. */
export type LiveNodeStatus = NodeStatus | "running";

export interface TimelineBar {
  start: number;
  end: number | null;
}

interface RunTotals {
  tokens: number;
  costCents: number;
  latencyMs: number;
}

interface RunState {
  phase: RunPhase;
  log: LogLine[];
  nodeStatus: Record<string, LiveNodeStatus>;
  timeline: Record<string, TimelineBar>;
  totals: RunTotals;
  startRun: () => void;
  reset: () => void;
}

/** Per-node contribution accumulated into the header totals as each node finishes. */
const NODE_DELTAS: Record<string, { tokens: number; costCents: number }> = {
  USER_QUERY: { tokens: 48, costCents: 0 },
  SEARCH_API: { tokens: 512, costCents: 1 },
  PLANNER_LM: { tokens: 2401, costCents: 8 },
  CRITIC_LM: { tokens: 1168, costCents: 3 },
};

// Timers live outside the store so an in-flight run can be cancelled on reset/restart.
let timers: ReturnType<typeof setTimeout>[] = [];
let runStart = 0;

function clearTimers(): void {
  for (const t of timers) clearTimeout(t);
  timers = [];
}

const EMPTY: Pick<RunState, "phase" | "log" | "nodeStatus" | "timeline" | "totals"> = {
  phase: "idle",
  log: [],
  nodeStatus: {},
  timeline: {},
  totals: { tokens: 0, costCents: 0, latencyMs: 0 },
};

export const useRunStore = create<RunState>((set, get) => ({
  ...EMPTY,

  reset: () => {
    clearTimers();
    set({ ...EMPTY });
  },

  startRun: () => {
    clearTimers();
    runStart = Date.now();
    set({ ...EMPTY, phase: "running" });

    let elapsed = 0;
    for (const step of runScript) {
      elapsed += step.delay;
      const at = elapsed;
      timers.push(
        setTimeout(() => {
          const s = get();
          const next: Partial<RunState> = {};

          if (step.log) next.log = [...s.log, step.log];

          const ev = step.event;
          if (ev) {
            const now = Date.now() - runStart;
            if (ev.kind === "node_started") {
              next.nodeStatus = { ...s.nodeStatus, [ev.nodeId]: "running" };
              next.timeline = { ...s.timeline, [ev.nodeId]: { start: now, end: null } };
            } else if (ev.kind === "node_finished") {
              next.nodeStatus = { ...s.nodeStatus, [ev.nodeId]: ev.status };
              const bar = s.timeline[ev.nodeId];
              if (bar) next.timeline = { ...s.timeline, [ev.nodeId]: { ...bar, end: now } };
              const d = NODE_DELTAS[ev.nodeId];
              if (d) {
                next.totals = {
                  tokens: s.totals.tokens + d.tokens,
                  costCents: s.totals.costCents + d.costCents,
                  latencyMs: now,
                };
              }
            } else if (ev.kind === "run_finished") {
              next.phase = ev.status;
            }
          }

          set(next);
        }, at),
      );
    }
  },
}));
