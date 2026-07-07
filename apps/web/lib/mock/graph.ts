import type { NodeRole } from "@/lib/domain";

/** Data carried on each React Flow node card. */
export interface AfNodeData {
  role: NodeRole;
  title: string;
  subtitle: string;
  [key: string]: unknown;
}

export interface AfFlowNode {
  id: string;
  position: { x: number; y: number };
  data: AfNodeData;
}

export interface AfFlowEdge {
  id: string;
  source: string;
  target: string;
}

/** Inspector-panel config for a node (mirrors the shape a validated node `config` would take). */
export interface InspectorConfig {
  modelId: string;
  temperature: number;
  systemPrompt: string;
  avgLatency: string;
  lastRun: string;
  nodeUid: string;
}

export const flowNodes: AfFlowNode[] = [
  {
    id: "USER_QUERY",
    position: { x: 40, y: 20 },
    data: { role: "source", title: "USER_QUERY", subtitle: "REST_API" },
  },
  {
    id: "PLANNER_LM",
    position: { x: 320, y: 200 },
    data: { role: "agent", title: "PLANNER_LM", subtitle: "GPT-4O" },
  },
  {
    id: "SEARCH_API",
    position: { x: 620, y: 200 },
    data: { role: "tool", title: "SEARCH_API", subtitle: "GOOGLE" },
  },
  {
    id: "CRITIC_LM",
    position: { x: 910, y: 300 },
    data: { role: "agent", title: "CRITIC_LM", subtitle: "CLAUDE" },
  },
];

export const flowEdges: AfFlowEdge[] = [
  { id: "e1", source: "USER_QUERY", target: "PLANNER_LM" },
  { id: "e2", source: "PLANNER_LM", target: "SEARCH_API" },
  { id: "e3", source: "SEARCH_API", target: "CRITIC_LM" },
];

const PLANNER_PROMPT = `You are a highly analytical orchestrator.
Your task is to decompose user queries into a set of sequential search steps.

CONSTRAINTS:
1. Always prioritize factual sources.
2. Cross-reference results from multiple search nodes.
3. If uncertainty > 0.4, trigger CRITIC_LM node for verification.`;

export const inspectorConfigs: Record<string, InspectorConfig> = {
  USER_QUERY: {
    modelId: "n/a",
    temperature: 0,
    systemPrompt: "Inbound REST payload. No model bound to source nodes.",
    avgLatency: "0.02s",
    lastRun: "08:42:01",
    nodeUid: "SRC_A001_X",
  },
  PLANNER_LM: {
    modelId: "gpt-4o",
    temperature: 0.7,
    systemPrompt: PLANNER_PROMPT,
    avgLatency: "1.24s",
    lastRun: "08:42:01",
    nodeUid: "AGENT_B492_X",
  },
  SEARCH_API: {
    modelId: "google",
    temperature: 0,
    systemPrompt: "Deterministic tool call. Returns ranked result set for the planner.",
    avgLatency: "0.61s",
    lastRun: "08:42:03",
    nodeUid: "TOOL_C210_X",
  },
  CRITIC_LM: {
    modelId: "claude-sonnet-5",
    temperature: 0.3,
    systemPrompt:
      "Verification agent. Cross-checks planner output against retrieved sources and flags low-confidence claims.",
    avgLatency: "1.08s",
    lastRun: "08:42:05",
    nodeUid: "AGENT_D771_X",
  },
};

export const MODEL_OPTIONS = [
  "gpt-4o",
  "gpt-4o-mini",
  "claude-opus-4-8",
  "claude-sonnet-5",
  "google",
] as const;
