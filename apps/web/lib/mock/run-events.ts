import type { RunEvent } from "@/lib/domain";

/** One entry in the terminal execution log. `node` is a node id or "SYSTEM". */
export interface LogLine {
  time: string;
  node: string;
  text: string;
  emphasis?: boolean;
}

/**
 * A scripted step in the mock run. Replayed by the run store on a timer to simulate
 * the Redis pub/sub → WS stream: `delay` ms after the previous step, append `log`
 * and/or apply `event`. This stands in for a real `RunEvent[]` feed until WS wiring.
 */
export interface ScriptStep {
  delay: number;
  log?: LogLine;
  event?: RunEvent;
}

export const runScript: ScriptStep[] = [
  { delay: 0, event: { kind: "run_started" }, log: { time: "08:42:01", node: "SYSTEM", text: "Initializing pipeline..." } },
  {
    delay: 250,
    event: { kind: "node_started", nodeId: "USER_QUERY" },
    log: { time: "08:42:01", node: "USER_QUERY", text: 'Inbound request: "Summarize AI safety trends 2024"' },
  },
  { delay: 500, event: { kind: "node_finished", nodeId: "USER_QUERY", status: "succeeded" } },
  {
    delay: 400,
    event: { kind: "node_started", nodeId: "PLANNER_LM" },
    log: { time: "08:42:02", node: "PLANNER_LM", text: "Initiating search..." },
  },
  {
    delay: 700,
    event: { kind: "node_started", nodeId: "SEARCH_API" },
    log: { time: "08:42:03", node: "SEARCH_API", text: "Found 12 results from google.com" },
  },
  { delay: 900, event: { kind: "node_finished", nodeId: "SEARCH_API", status: "succeeded" } },
  {
    delay: 300,
    event: { kind: "node_token", nodeId: "PLANNER_LM", text: "" },
    log: { time: "08:42:04", node: "PLANNER_LM", text: "Processing results (2.4k tokens)..." },
  },
  { delay: 700, log: { time: "08:42:05", node: "PLANNER_LM", text: "Awaiting response..." } },
  { delay: 600, event: { kind: "node_finished", nodeId: "PLANNER_LM", status: "succeeded" } },
  {
    delay: 300,
    event: { kind: "node_started", nodeId: "CRITIC_LM" },
    log: { time: "08:42:05", node: "CRITIC_LM", text: "Verifying planner output against sources..." },
  },
  {
    delay: 800,
    event: { kind: "node_finished", nodeId: "CRITIC_LM", status: "succeeded" },
    log: { time: "08:42:06", node: "CRITIC_LM", text: "Analysis cycle complete.", emphasis: true },
  },
  { delay: 300, event: { kind: "run_finished", status: "succeeded" } },
];
