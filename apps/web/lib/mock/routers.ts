import type { LogEntry } from "@/components/bench/log-stream";

export interface Branch {
  label: string;
  pct: string;
}

export const intentClassifier = {
  id: "RTR-482-QX",
  name: "Intent_Classifier",
  kind: "LLM_ROUTER",
  hitRate: 0.984,
  branches: [
    { label: "SUPPORT_QUERY", pct: "42.1%" },
    { label: "SALES_LEAD", pct: "31.8%" },
    { label: "TECHNICAL_DOCS", pct: "26.1%" },
  ] as Branch[],
};

export const tokenGuard = {
  id: "RTR-119-BA",
  name: "Token_Guard",
  kind: "IF_ELSE",
  condition: "TOKEN_COUNT < 2048",
  truePct: "74%",
  falsePct: "26%",
  targets: [
    { label: "GPT-4o-MINI", tag: "FAST_PATH" },
    { label: "SUMMARIZER_V2", tag: "COMPRESS" },
  ],
};

export const regionBalancer = {
  id: "RTR-901-LL",
  name: "Region_Balancer",
  kind: "SWITCH",
  selector: "Metadata.region",
  regions: [
    { label: "US-EAST", pct: "12%" },
    { label: "EU-WEST", pct: "55%" },
    { label: "ASIA-S", pct: "28%" },
    { label: "DEFAULT", pct: "5%" },
  ],
};

export const routersStats = {
  cluster: "ROUTER_POOL_01",
  throughput: "1.2k req/s",
  latency: "42ms",
  efficiency: [0.45, 0.7, 0.55, 0.8, 0.65, 1, 0.6, 0.5],
  peakCpu: "14.2%",
  memUse: "842MB",
};

export const routerLog: LogEntry[] = [
  { time: "12:44:01", level: "ROUTER_MATCH", text: "RTR-482-QX matched 'SUPPORT_QUERY' with 94% confidence." },
  { time: "12:44:03", level: "DATA_INGEST", text: "1024 bytes from Source_Alpha to Switch_Region_Balancer." },
  { time: "12:44:05", level: "WARN", text: "Fallback path triggered for 'Region_Balancer' (US-WEST-2 timed out)." },
  { time: "12:44:09", level: "ROUTER_MATCH", text: "RTR-119-BA evaluated TRUE (Tokens: 1422)." },
  { time: "12:44:12", level: "INFO", text: "Optimized query routing applied to GPT-4o-MINI cluster." },
  { time: "12:44:15", level: "SYSTEM", text: "Continuous health check passed." },
];
