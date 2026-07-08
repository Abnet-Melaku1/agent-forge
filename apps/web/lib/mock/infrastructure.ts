export const infraStats = {
  uptime: "99.982%",
  clusterLoad: "42.1%",
  clusterLoadPct: 0.421,
  apiQuota: "782,109 / 1.0M",
  latency: "24ms (avg)",
};

export interface NodeBox {
  id: string;
  state: "ACTIVE" | "WARMING" | "DRAINING";
}

export const computeCluster = {
  region: "US-EAST-01",
  nodeCount: "12 Nodes",
  id: "0x889FA",
  cpuCores: 0.68,
  vramUsage: 0.89,
  ioThroughput: "1.2 GB/s",
  nodes: [
    { id: "n-001", state: "ACTIVE" },
    { id: "n-002", state: "WARMING" },
    { id: "n-003", state: "ACTIVE" },
    { id: "n-004", state: "DRAINING" },
  ] as NodeBox[],
};

export const modelSync = [
  { name: "MISTRAL-7B-V0.1", version: "v2.1.0" },
  { name: "LLAMA-3-70B", version: "v1.4.2" },
  { name: "FORGE-EMBED-1", version: "v0.9.8" },
];

export interface Deployment {
  name: string;
  id: string;
  runtime: string;
  throughput: string;
  trend: "up" | "flat";
  errorRate: string;
}

export const deployments: Deployment[] = [
  {
    name: "inference-primary-node",
    id: "depl-99-az",
    runtime: "PyTorch 2.3 + CUDA 12.1",
    throughput: "452 req/s",
    trend: "up",
    errorRate: "0.001%",
  },
  {
    name: "rag-vector-indexing",
    id: "depl-102-us",
    runtime: "Go-Runtime 1.22",
    throughput: "12.4k t/s",
    trend: "flat",
    errorRate: "0.12%",
  },
  {
    name: "router-load-balancer",
    id: "depl-42-glb",
    runtime: "Rust (WASM)",
    throughput: "98k req/s",
    trend: "up",
    errorRate: "0.89%",
  },
];
