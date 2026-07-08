import { StatusLed } from "@agentforge/ui/status-led";
import { Bot, GitBranch, LineChart as LineChartIcon, LogIn, LogOut, Share2 } from "lucide-react";

import { AppShell } from "@/components/bench/app-shell";
import { LineChart } from "@/components/bench/line-chart";
import { LogStream } from "@/components/bench/log-stream";
import { BenchCard, Meter } from "@/components/bench/primitives";
import { latencySeries, observabilityLog, observabilityStats as st } from "@/lib/mock/observability";

export default function ObservabilityPage(): React.ReactElement {
  return (
    <AppShell nav="Logs" topNav="Observability" searchPlaceholder="Global Trace Search">
      {/* Telemetry strip */}
      <div className="mb-6 flex items-center gap-10 border-b border-line pb-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-dim">Active Threads</p>
          <p className="mt-1 font-mono text-lg">
            <span className="text-amber">{st.activeThreads}</span>{" "}
            <span className="text-xs text-dim">{st.cluster}</span>
          </p>
        </div>
        <div className="flex-1">
          <p className="font-mono text-[10px] uppercase tracking-wider text-dim">Token Burn Velocity</p>
          <div className="mt-2 flex items-center gap-3">
            <Meter value={st.tokenBurnPct} className="max-w-xs" />
            <span className="font-mono text-xs text-amber">{st.tokenBurn}</span>
          </div>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-dim">Accumulated Cost</p>
          <p className="mt-1 font-mono text-lg text-amber">
            {st.accumulatedCost} <span className="text-xs text-dim">USD</span>
          </p>
        </div>
        <span className="flex items-center gap-2 border border-line-strong px-4 py-2.5 font-mono text-[11px] uppercase tracking-wider text-fg">
          <StatusLed tone="active" pulse />
          Live Telemetry Stream
        </span>
      </div>

      <div className="grid grid-cols-[2.4fr_1fr] gap-5">
        <BenchCard
          label="↗ Latency Aggregate (P99)"
          right={
            <span className="font-mono text-[10px] uppercase tracking-wide text-dim">
              Resolution: 100MS | Source: GLOBAL_EDGE
            </span>
          }
        >
          <div className="h-64 bg-ink p-2">
            <LineChart data={latencySeries} />
          </div>
        </BenchCard>

        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-5">
            <BenchCard label="Success Rate">
              <p className="font-mono text-3xl text-teal">
                {st.successRate}
                <span className="text-sm">%</span>
              </p>
              <div className="mt-3 h-0.5 w-full bg-teal" />
            </BenchCard>
            <BenchCard label="Error Threshold">
              <p className="font-mono text-3xl text-amber">
                {st.errorThreshold}
                <span className="text-sm">%</span>
              </p>
              <div className="mt-3 flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-amber" />
                <span className="h-1.5 w-1.5 rounded-full bg-line-strong" />
                <span className="h-1.5 w-1.5 rounded-full bg-line-strong" />
              </div>
            </BenchCard>
          </div>
          <BenchCard>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wide text-dim">Active Model</p>
                <p className="mt-1 font-mono text-sm text-fg">{st.activeModel}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-[10px] uppercase tracking-wide text-dim">Version</p>
                <p className="mt-1 font-mono text-sm text-amber">{st.build}</p>
              </div>
            </div>
          </BenchCard>
        </div>
      </div>

      <BenchCard
        label="Network Topology / Flow Trace"
        className="mt-5"
        right={<LineChartIcon className="h-4 w-4 text-dim" />}
      >
        <div className="flex h-48 items-center justify-center gap-16 bg-ink">
          {[LogIn, Bot, GitBranch, LogOut, Share2].slice(0, 4).map((Icon, i) => (
            <span
              key={i}
              className={`flex h-14 w-14 items-center justify-center border ${
                i === 0 ? "border-amber text-amber" : "border-line-strong text-muted"
              } bg-surface`}
            >
              <Icon className="h-6 w-6" strokeWidth={1.5} />
            </span>
          ))}
        </div>
      </BenchCard>

      <div className="mt-5 border border-line bg-ink">
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5 font-mono text-[11px]">
          <span className="text-fg">
            LIVE_LOG_STREAM <span className="ml-2 text-dim">FILTER: ALL_SYSTEMS</span>
          </span>
          <span className="text-dim">LOGS/S: 42</span>
        </div>
        <LogStream entries={observabilityLog} className="p-4" />
      </div>
    </AppShell>
  );
}
