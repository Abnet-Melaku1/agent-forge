import { StatusLed } from "@agentforge/ui/status-led";
import { KeyRound, Minus, Plus, RefreshCcw, TrendingUp } from "lucide-react";

import { AppShell } from "@/components/bench/app-shell";
import { BenchCard, Meter, PageHeader } from "@/components/bench/primitives";
import {
  computeCluster as cc,
  deployments,
  infraStats,
  modelSync,
  type NodeBox,
} from "@/lib/mock/infrastructure";

const nodeStateBar: Record<NodeBox["state"], string> = {
  ACTIVE: "bg-green",
  WARMING: "bg-amber",
  DRAINING: "bg-error",
};

export default function InfrastructurePage(): React.ReactElement {
  return (
    <AppShell nav="Agents" topNav="Infrastructure" searchPlaceholder="Query Infra ...">
      {/* Metrics strip */}
      <div className="mb-6 flex items-center gap-10 border-b border-line pb-4 font-mono text-xs">
        <Metric label="Uptime" value={infraStats.uptime} tone="teal" />
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-wide text-dim">Cluster Load:</span>
          <Meter value={infraStats.clusterLoadPct} className="w-32" />
          <span className="text-fg">{infraStats.clusterLoad}</span>
        </div>
        <Metric label="API Quota" value={infraStats.apiQuota} />
        <Metric label="Latency" value={infraStats.latency} tone="teal" />
      </div>

      <PageHeader
        title="Infrastructure Topology"
        subtitle="Active node clusters and hardware-accelerated model orchestration units."
        right={
          <button
            type="button"
            className="flex items-center gap-2 bg-amber px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-ink hover:bg-amber-dim"
          >
            <Plus className="h-4 w-4" />
            Provision Node
          </button>
        }
      />

      <div className="grid grid-cols-[2fr_1fr] gap-5">
        {/* Compute cluster */}
        <BenchCard>
          <div className="flex items-start justify-between">
            <div>
              <p className="flex items-center gap-2 font-display text-lg text-fg">
                <StatusLed tone="ok" pulse />
                Compute Cluster A
              </p>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-dim">
                {cc.region} · {cc.nodeCount}
              </p>
            </div>
            <span className="border border-line px-2 py-1 font-mono text-[10px] text-dim">
              ID: {cc.id}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-6">
            <ResourceMeter label="CPU Cores" value={cc.cpuCores} pct="68%" tone="amber" />
            <ResourceMeter label="VRAM Usage" value={cc.vramUsage} pct="89%" tone="error" />
            <div>
              <div className="mb-2 flex justify-between font-mono text-[10px] uppercase tracking-wide text-dim">
                <span>I/O Throughput</span>
                <span className="text-teal">{cc.ioThroughput}</span>
              </div>
              <Meter value={0.4} tone="teal" />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-4 gap-3">
            {cc.nodes.map((n) => (
              <div key={n.id} className="border border-line p-3">
                <p className="font-mono text-[10px] text-dim">{n.id}</p>
                <p className="mt-0.5 font-mono text-xs uppercase tracking-wide text-fg">{n.state}</p>
                <div className={`mt-3 h-1 w-full ${nodeStateBar[n.state]}`} />
              </div>
            ))}
          </div>
        </BenchCard>

        {/* Right column */}
        <div className="flex flex-col gap-5">
          <BenchCard
            label="🔐 API Security"
            right={<KeyRound className="h-3.5 w-3.5 text-amber" />}
          >
            <Row k="Auth Handshake" v="OK" tone="teal" />
            <Row k="Rate-Limit Enc." v="0.02%" tone="amber" />
            <button
              type="button"
              className="mt-4 w-full border border-line-strong py-2.5 font-mono text-xs uppercase tracking-wider text-muted hover:border-amber hover:text-amber"
            >
              Rotate Keys
            </button>
          </BenchCard>

          <BenchCard label="⚗ Model Sync">
            <ul className="space-y-2">
              {modelSync.map((m) => (
                <li key={m.name} className="flex justify-between font-mono text-xs">
                  <span className="text-muted">{m.name}</span>
                  <span className="text-fg">{m.version}</span>
                </li>
              ))}
            </ul>
            <p className="mb-2 mt-4 text-right font-mono text-[10px] uppercase tracking-wide text-teal">
              Updating System Bias...
            </p>
            <Meter value={0.35} tone="teal" />
          </BenchCard>
        </div>
      </div>

      {/* Deployments */}
      <BenchCard
        label="Active Deployments"
        className="mt-5"
        right={
          <span className="flex gap-4 font-mono text-[10px] uppercase tracking-wide">
            <span className="flex items-center gap-2 text-teal">
              <StatusLed tone="ok" /> 4 Production
            </span>
            <span className="flex items-center gap-2 text-amber">
              <StatusLed tone="active" /> 2 Staging
            </span>
          </span>
        }
      >
        <div className="grid grid-cols-[2fr_1.6fr_1.2fr_1fr_0.4fr] border-b border-line pb-2 font-mono text-[10px] uppercase tracking-wide text-dim">
          <span>Deployment Name</span>
          <span>Runtime</span>
          <span>Throughput</span>
          <span>Error Rate</span>
          <span className="text-right">Action</span>
        </div>
        {deployments.map((d) => (
          <div
            key={d.id}
            className="grid grid-cols-[2fr_1.6fr_1.2fr_1fr_0.4fr] items-center border-b border-line py-3 font-mono text-xs last:border-b-0"
          >
            <div>
              <p className="text-fg">{d.name}</p>
              <p className="text-dim">ID: {d.id}</p>
            </div>
            <span className="text-muted">{d.runtime}</span>
            <span className="flex items-center gap-1.5 text-fg">
              {d.throughput}
              {d.trend === "up" ? (
                <TrendingUp className="h-3.5 w-3.5 text-teal" />
              ) : (
                <Minus className="h-3.5 w-3.5 text-dim" />
              )}
            </span>
            <span className="text-teal">{d.errorRate}</span>
            <span className="text-right text-dim">⋮</span>
          </div>
        ))}
      </BenchCard>

      {/* Bottom panels */}
      <div className="mt-5 grid grid-cols-2 gap-5">
        <BenchCard label="Node Geolocation" className="relative">
          <div className="relative h-40 bg-ink">
            <span className="absolute left-[30%] top-[45%] h-2 w-2 rounded-full bg-amber shadow-[0_0_8px_2px_var(--af-amber)]" />
            <span className="absolute left-[24%] top-[68%] h-1.5 w-1.5 rounded-full bg-teal" />
            <span className="absolute left-[60%] top-[35%] h-1.5 w-1.5 rounded-full bg-teal" />
          </div>
        </BenchCard>

        <BenchCard>
          <div className="flex items-center gap-6">
            <Gauge />
            <div>
              <p className="font-display text-lg text-fg">Resource Saturation</p>
              <p className="mt-1 text-sm text-muted">
                Optimal headroom remains for 4 additional agent clusters.
              </p>
            </div>
          </div>
        </BenchCard>
      </div>

      {/* Status bar */}
      <div className="mt-5 flex items-center gap-4 border border-line bg-ink px-4 py-2.5 font-mono text-[11px]">
        <span className="flex items-center gap-2 text-teal">
          <RefreshCcw className="h-3.5 w-3.5" />
          SYSTEM NOMINAL
        </span>
        <span className="text-dim">|</span>
        <span className="text-muted">DEBUG_MODE: OFF</span>
        <span className="ml-auto text-dim">LATENCY: 12MS</span>
        <span className="text-dim">SESS: B9-1102</span>
      </div>
    </AppShell>
  );
}

function Metric({
  label,
  value,
  tone = "fg",
}: {
  label: string;
  value: string;
  tone?: "fg" | "teal";
}): React.ReactElement {
  return (
    <span className="text-muted">
      <span className="text-[10px] uppercase tracking-wide text-dim">{label}: </span>
      <span className={tone === "teal" ? "text-teal" : "text-fg"}>{value}</span>
    </span>
  );
}

function ResourceMeter({
  label,
  value,
  pct,
  tone,
}: {
  label: string;
  value: number;
  pct: string;
  tone: "amber" | "error" | "teal";
}): React.ReactElement {
  return (
    <div>
      <div className="mb-2 flex justify-between font-mono text-[10px] uppercase tracking-wide text-dim">
        <span>{label}</span>
        <span className="text-fg">{pct}</span>
      </div>
      <Meter value={value} tone={tone} />
    </div>
  );
}

function Row({
  k,
  v,
  tone,
}: {
  k: string;
  v: string;
  tone: "teal" | "amber";
}): React.ReactElement {
  return (
    <div className="flex items-center justify-between border-b border-line py-2 font-mono text-xs last:border-b-0">
      <span className="text-muted">{k}</span>
      <span className={tone === "teal" ? "text-teal" : "text-amber"}>{v}</span>
    </div>
  );
}

/** Circular capacity gauge (amber ring on a track). */
function Gauge(): React.ReactElement {
  return (
    <div
      className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full"
      style={{
        background: "conic-gradient(var(--af-amber) 0% 72%, var(--af-line-strong) 72% 100%)",
      }}
    >
      <div className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-surface">
        <span className="font-mono text-[10px] uppercase tracking-wide text-muted">Capacity</span>
      </div>
    </div>
  );
}
