/**
 * Frontend domain types — a hand-written mirror of the backend Pydantic source of
 * truth in `libs/schemas` (graph.py, run.py, run_events.py). Temporary until
 * `packages/types` is generated from the FastAPI OpenAPI spec (`make gen-types`);
 * at that point imports move there and this file is deleted. Do NOT let this drift.
 */

export type NodeRole = "source" | "agent" | "tool" | "router" | "output";

export interface GraphNode {
  id: string;
  type: string;
  role: NodeRole;
  config: Record<string, unknown>;
}

export interface GraphEdge {
  source: string;
  target: string;
}

export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export type RunStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled";
export type NodeStatus = "queued" | "running" | "succeeded" | "failed" | "skipped";

export interface RunTotals {
  tokensIn: number;
  tokensOut: number;
  costCents: number;
  latencyMs: number;
}

/** Live run-event stream (mirrors `RunEvent` union in run_events.py). */
export type RunEvent =
  | { kind: "run_started" }
  | { kind: "node_started"; nodeId: string }
  | { kind: "node_token"; nodeId: string; text: string }
  | { kind: "node_finished"; nodeId: string; status: NodeStatus; error?: string | null }
  | { kind: "run_finished"; status: Extract<RunStatus, "succeeded" | "failed"> };
