import type { LogEntry } from "@/components/bench/log-stream";

export const observabilityStats = {
  activeThreads: "128",
  cluster: "PROD_CLUSTER_A",
  tokenBurn: "42.5k / sec",
  tokenBurnPct: 0.62,
  accumulatedCost: "$1,402.88",
  successRate: "99.8",
  errorThreshold: "0.02",
  activeModel: "GPT-4o-Orchestrator-v2",
  build: "BUILD_7F21",
};

/** Normalized latency samples (0..1) for the P99 aggregate chart. */
export const latencySeries = [
  0.35, 0.55, 0.42, 0.68, 0.5, 0.72, 0.6, 0.85, 0.55, 0.9, 0.62, 0.78, 0.5, 0.7, 0.58, 0.82,
];

export const observabilityLog: LogEntry[] = [
  { time: "14:22:01.442", level: "INFO", text: "System orchestrator initialization complete. Cluster 'Alpha' ready." },
  { time: "14:22:02.109", level: "WARN", text: "Latency peak detected in Region: EU-WEST-1 (142ms)." },
  { time: "14:22:02.551", level: "TRACE", text: "Agent_ID: 8821 initiated sub-task [REASONING_CHAIN_04]." },
  { time: "14:22:03.012", level: "INFO", text: "Token budget check passed. Remaining: 8.4M." },
  { time: "08:55:17.816", level: "TRACE", text: "Cleaning stale thread pools..." },
];
