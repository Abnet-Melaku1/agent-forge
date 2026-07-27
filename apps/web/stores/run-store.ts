import { create } from "zustand";

import type { NodeStatus, RunEvent } from "@agentforge/types";
import { flowEdges, flowNodes, inspectorConfigs } from "@/lib/mock/graph";
import type { LogLine } from "@/lib/mock/run-events";

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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

let activeWs: WebSocket | null = null;
let runStart = 0;

function getFormattedTime(): string {
  const d = new Date();
  return d.toTimeString().split(" ")[0] || "";
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
    if (activeWs) {
      activeWs.close();
      activeWs = null;
    }
    set({ ...EMPTY });
  },

  startRun: async () => {
    if (activeWs) {
      activeWs.close();
      activeWs = null;
    }
    runStart = Date.now();
    set({ ...EMPTY, phase: "running" });

    const appendLog = (text: string, node = "SYSTEM", emphasis = false) => {
      set((s) => ({
        log: [
          ...s.log,
          {
            time: getFormattedTime(),
            node,
            text,
            emphasis,
          },
        ],
      }));
    };

    appendLog("Compiling canvas DAG...");

    // Map frontend nodes to backend Graph format using the constant type
    const backendNodes = flowNodes.map((n) => {
      const configVal = inspectorConfigs[n.id]?.systemPrompt || n.data.title;
      return {
        id: n.id,
        type: "constant",
        role: n.data.role,
        config: {
          value: configVal,
        },
      };
    });

    const backendEdges = flowEdges.map((e) => ({
      source: e.source,
      target: e.target,
    }));

    const graph = {
      nodes: backendNodes,
      edges: backendEdges,
    };

    try {
      // 1. Create Workflow
      appendLog("Registering workflow pipeline with API...");
      const workflowRes = await fetch(`${API_BASE_URL}/workflows`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "CORE_ORCHESTRATOR_V2",
          draft: graph,
        }),
      });

      if (!workflowRes.ok) {
        const errText = await workflowRes.text();
        throw new Error(`Failed to create workflow: ${errText}`);
      }

      const { id: workflowId } = await workflowRes.json();

      // 2. Publish Version
      appendLog("Publishing workflow snapshot version...");
      const publishRes = await fetch(`${API_BASE_URL}/workflows/${workflowId}/versions`, {
        method: "POST",
      });

      if (!publishRes.ok) {
        const errText = await publishRes.text();
        throw new Error(`Failed to publish version: ${errText}`);
      }

      const { version_id: versionId } = await publishRes.json();

      // 3. Create Run
      appendLog("Enqueuing pipeline run execution...");
      const runRes = await fetch(`${API_BASE_URL}/versions/${versionId}/runs`, {
        method: "POST",
      });

      if (!runRes.ok) {
        const errText = await runRes.text();
        throw new Error(`Failed to create run: ${errText}`);
      }

      const { id: runId } = await runRes.json();
      appendLog(`Run created. ID: ${runId}. Connecting stream...`);

      // 4. WebSocket stream subscription
      const wsUrl = `${WS_BASE_URL}/runs/${runId}/events`;
      const ws = new WebSocket(wsUrl);
      activeWs = ws;

      ws.onmessage = (event) => {
        try {
          const ev: RunEvent = JSON.parse(event.data);
          const s = get();
          const next: Partial<RunState> = {};
          const now = Date.now() - runStart;

          if (ev.kind === "run_started") {
            appendLog("Engine started execution wave.", "SYSTEM");
          } else if (ev.kind === "node_started") {
            next.nodeStatus = { ...s.nodeStatus, [ev.nodeId]: "running" };
            next.timeline = { ...s.timeline, [ev.nodeId]: { start: now, end: null } };
            appendLog(`Execution started.`, ev.nodeId);
          } else if (ev.kind === "node_token") {
            appendLog(`[Streaming Token] ${ev.text}`, ev.nodeId);
          } else if (ev.kind === "node_finished") {
            next.nodeStatus = { ...s.nodeStatus, [ev.nodeId]: ev.status };
            const bar = s.timeline[ev.nodeId];
            if (bar) next.timeline = { ...s.timeline, [ev.nodeId]: { ...bar, end: now } };

            const d = NODE_DELTAS[ev.nodeId] || { tokens: 10, costCents: 0 };
            next.totals = {
              tokens: s.totals.tokens + d.tokens,
              costCents: s.totals.costCents + d.costCents,
              latencyMs: now,
            };

            if (ev.status === "succeeded") {
              appendLog(`Node execution succeeded. Output: ${JSON.stringify(ev.output)}`, ev.nodeId, true);
            } else if (ev.status === "failed") {
              appendLog(`Node execution failed. Error: ${ev.error}`, ev.nodeId, true);
            } else {
              appendLog(`Node execution skipped.`, ev.nodeId);
            }
          } else if (ev.kind === "run_finished") {
            next.phase = ev.status;
            appendLog(`Pipeline execution finished with status: ${ev.status.toUpperCase()}`, "SYSTEM", true);
            ws.close();
          }

          set(next);
        } catch (err) {
          console.error("Error parsing websocket message:", err);
        }
      };

      ws.onerror = (err) => {
        appendLog(`WebSocket connection error.`, "SYSTEM", true);
        set({ phase: "failed" });
      };

      ws.onclose = () => {
        activeWs = null;
      };

    } catch (error: any) {
      appendLog(`Pipeline error: ${error.message || error}`, "SYSTEM", true);
      set({ phase: "failed" });
    }
  },
}));

