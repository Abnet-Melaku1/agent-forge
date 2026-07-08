export interface ToolCard {
  name: string;
  provider: string;
  icon: "globe" | "grid" | "code" | "database";
  description: string;
  usageCount: string;
  avgLatency: string;
  action: string;
}

export const tools: ToolCard[] = [
  {
    name: "Search API",
    provider: "GOOGLE_SEARCH_V2",
    icon: "globe",
    description:
      "High-fidelity web retrieval with markdown conversion and snippet extraction for grounding agents.",
    usageCount: "842,910",
    avgLatency: "1.4s",
    action: "Configure Instrument",
  },
  {
    name: "Calculator",
    provider: "INTERNAL_MATH_JS",
    icon: "grid",
    description: "Precision mathematical engine for complex financial projections and unit conversions.",
    usageCount: "2,110,402",
    avgLatency: "0.02ms",
    action: "Calibrate Core",
  },
  {
    name: "Python Exec",
    provider: "DOCKER_REPL_V4",
    icon: "code",
    description: "Isolated runtime for data science tasks, visualization generation, and heavy algorithm execution.",
    usageCount: "45,119",
    avgLatency: "3.1s",
    action: "View Runtime",
  },
  {
    name: "SQL Query",
    provider: "PG_VECTOR_PRO",
    icon: "database",
    description: "Direct database interrogation tool with automated schema discovery and safety filtering.",
    usageCount: "118,443",
    avgLatency: "450ms",
    action: "Query Planner",
  },
];

export const toolsStats = {
  totalCalls: "1.2M+",
  avgSystemLatency: "24.5ms",
  version: "V1.0.4-STABLE",
  ticker: [
    "14:22:01 - Search API calibrated successfully...",
    "14:22:05 - Python REPL heartbeats 100%...",
    "14:22:12 - SQL Query planner optimized...",
  ],
};
