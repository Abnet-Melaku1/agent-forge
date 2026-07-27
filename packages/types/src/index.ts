/**
 * GENERATED CONTRACT — do not hand-edit (CLAUDE.md §3, §10).
 *
 * This package is the frontend's source of truth for API + WS types.
 * Generated from the FastAPI OpenAPI spec.
 */

import type { components } from "./schema";

export type NodeRole = components["schemas"]["Node"]["role"];
export type GraphNode = components["schemas"]["Node"];
export type GraphEdge = components["schemas"]["Edge"];
export type Graph = components["schemas"]["Graph"];

export type RunStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled";
export type NodeStatus = "queued" | "running" | "succeeded" | "failed" | "skipped";

export interface RunTotals {
  tokens: number;
  costCents: number;
  latencyMs: number;
}

export type RunEvent =
  | { kind: "run_started" }
  | { kind: "node_started"; nodeId: string }
  | { kind: "node_token"; nodeId: string; text: string }
  | { kind: "node_finished"; nodeId: string; status: NodeStatus; output?: unknown; error?: string | null }
  | { kind: "run_finished"; status: Extract<RunStatus, "succeeded" | "failed"> };

export type { components, paths } from "./schema";
