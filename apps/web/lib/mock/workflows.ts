export type WorkflowState = "executing" | "idle" | "error" | "indexing";

export interface WorkflowRow {
  name: string;
  uuid: string;
  state: WorkflowState;
  stateLabel: string;
  nodes: number;
  lastRun: string;
  costUsd: number;
}

export const workflows: WorkflowRow[] = [
  {
    name: "NEURAL_PIPE_v3_PROD",
    uuid: "8f4e-0012-98ab",
    state: "executing",
    stateLabel: "EXECUTING",
    nodes: 14,
    lastRun: "2m 45s ago",
    costUsd: 0.421,
  },
  {
    name: "SENTIMENT_ANALYZER_MAIN",
    uuid: "312a-4491-00ff",
    state: "idle",
    stateLabel: "IDLE",
    nodes: 8,
    lastRun: "14m 12s ago",
    costUsd: 12.04,
  },
  {
    name: "DATA_FETCH_SCHEDULER",
    uuid: "e5c2-1100-221b",
    state: "error",
    stateLabel: "TERMINAL ERROR",
    nodes: 4,
    lastRun: "32s ago",
    costUsd: 0.002,
  },
  {
    name: "VECTOR_INDEX_CRON",
    uuid: "a6f0-9932-140d",
    state: "indexing",
    stateLabel: "INDEXING",
    nodes: 2,
    lastRun: "now",
    costUsd: 3.119,
  },
];

export const libraryStats = {
  activeWorkflows: 24,
  latestSync: "13:19:20.040",
  throughput: "12.4 req/s",
  latencyP95: "342ms",
  costAccumulation: 1248.32,
  costDeltaPct: 12.4,
  /** Relative bar heights (0..1) for the LIVE node-distribution chart. */
  distribution: [0.35, 0.7, 0.5, 0.95, 0.42, 0.6, 0.48],
};
