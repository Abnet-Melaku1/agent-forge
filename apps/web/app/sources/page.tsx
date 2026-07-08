import { StatusLed, type LedTone } from "@agentforge/ui/status-led";
import { BarChart3, Link2, Plus, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";

import { AppShell } from "@/components/bench/app-shell";
import { BenchCard, Chip, MiniBars, PageHeader, StatCell } from "@/components/bench/primitives";
import { Meter } from "@/components/bench/primitives";
import { sources, sourcesStats, type SourceStatus } from "@/lib/mock/sources";

const statusTone: Record<SourceStatus, LedTone> = {
  online: "ok",
  syncing: "active",
  live: "ok",
  disconnected: "idle",
};

const columns = ["Status", "Source Identity", "Protocol", "Record Count", "Last Sync", "Actions"];

export default function SourcesPage(): React.ReactElement {
  return (
    <AppShell nav="Sources" topNav="Workflows" searchPlaceholder="Search parameters...">
      <PageHeader
        breadcrumb="Inventory / Data Sources"
        title="Precision Sources Library"
        right={
          <>
            <StatCell label="Global Latency" value={sourcesStats.globalLatency} tone="amber" />
            <button
              type="button"
              className="flex items-center gap-2 bg-amber px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-ink hover:bg-amber-dim"
            >
              <Plus className="h-4 w-4" />
              Register New Source
            </button>
          </>
        }
      />

      <div className="border border-line bg-surface">
        <div className="grid grid-cols-[1fr_3fr_1.4fr_1.6fr_1.6fr_1fr] border-b border-line px-6 py-3">
          {columns.map((c, i) => (
            <span
              key={c}
              className={`font-mono text-[10px] uppercase tracking-wider text-dim ${i === 5 ? "text-right" : ""}`}
            >
              {c}
            </span>
          ))}
        </div>
        <ul>
          {sources.map((s) => {
            const dim = s.status === "disconnected";
            return (
              <li
                key={s.name}
                className="grid grid-cols-[1fr_3fr_1.4fr_1.6fr_1.6fr_1fr] items-center border-b border-line px-6 py-4 last:border-b-0"
              >
                <StatusLed tone={statusTone[s.status]} pulse={s.status === "syncing"} />
                <div>
                  <p className={`font-mono text-sm ${dim ? "text-dim" : "text-fg"}`}>{s.name}</p>
                  <p className="font-mono text-xs text-dim">{s.host}</p>
                </div>
                <div>
                  <Chip>{s.protocol}</Chip>
                </div>
                <span
                  className={`font-mono text-sm ${dim ? "text-dim" : s.recordLive ? "text-teal" : "text-teal"}`}
                >
                  {s.recordCount}
                </span>
                <span
                  className={`font-mono text-xs ${s.status === "syncing" ? "text-amber" : "text-muted"}`}
                >
                  {s.lastSync}
                </span>
                <div className="flex items-center justify-end gap-3 text-muted">
                  {dim ? (
                    <>
                      <Link2 className="h-4 w-4 hover:text-fg" />
                      <Trash2 className="h-4 w-4 hover:text-error" />
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 hover:text-fg" />
                      <BarChart3 className="h-4 w-4 hover:text-fg" />
                    </>
                  )}
                  <span className="text-dim">⋮</span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-5">
        <BenchCard label="Storage Utilization">
          <Meter value={sourcesStats.storageUtilizationPct} />
          <div className="mt-3 flex justify-between font-mono text-xs">
            <span className="text-muted">Active Storage: {sourcesStats.activeStorage}</span>
            <span className="text-amber">{Math.round(sourcesStats.storageUtilizationPct * 100)}%</span>
          </div>
        </BenchCard>

        <BenchCard label="Source Health Index">
          <MiniBars data={sourcesStats.healthIndex} tone="teal" highlight={6} />
          <div className="mt-3 flex justify-between font-mono text-[10px] uppercase tracking-wide text-dim">
            <span>{sourcesStats.uptime}</span>
            <span>T-24H</span>
          </div>
        </BenchCard>

        <BenchCard>
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center border border-line-strong text-amber">
              <ShieldCheck className="h-6 w-6" strokeWidth={1.5} />
            </span>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-dim">Access Control</p>
              <p className="mt-1 font-display text-base text-fg">SOC2 Compliant Tunneling</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-teal">
                Active Secure Channel
              </p>
            </div>
          </div>
        </BenchCard>
      </div>
    </AppShell>
  );
}
