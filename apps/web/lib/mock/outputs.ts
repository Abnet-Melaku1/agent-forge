import type { LogEntry } from "@/components/bench/log-stream";

export const outputsStats = {
  activeSinks: "03",
  activeSinksPct: 0.5,
  aggregateThroughput: "142.8 KB/s",
  systemLatency: "12ms",
};

export const jsonPreview = `{
  "status": "delivered",
  "agent": "Orchestrator_v4",
  "payload": {
    "tokens": 1024,
    "model": "gpt-4-pro",
    "timestamp": 1715832000
  }
}`;

/** Relative bar heights for the Slack sink throughput sparkline. */
export const slackBars = [0.4, 0.55, 0.35, 0.75, 0.9, 0.5, 1, 0.65];

export const outputsLog: LogEntry[] = [
  { time: "14:02:11.042", level: "INFO", text: "Initializing delivery cycle for PRODUCTION_JSON..." },
  { time: "14:02:11.045", level: "INFO", text: "Handshake verified via TLS 1.3." },
  { time: "14:02:11.050", level: "SUCCESS", text: "Payload (4.2MB) dispatched to internal storage sink." },
  { time: "14:02:11.201", level: "WARN", text: "Late response from SLACK_OPS_ALERTS (Retrying in 2s)..." },
  { time: "14:02:11.222", level: "INFO", text: "Heartbeat pulse active for all 3 sinks." },
];
