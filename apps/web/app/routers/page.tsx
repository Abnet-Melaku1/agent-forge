import { StatusLed } from "@agentforge/ui/status-led";
import { Code2, CornerDownRight } from "lucide-react";

import { AppShell } from "@/components/bench/app-shell";
import { LogStream } from "@/components/bench/log-stream";
import { BenchCard, Chip, Meter, MiniBars } from "@/components/bench/primitives";
import {
  intentClassifier,
  regionBalancer,
  routerLog,
  routersStats,
  tokenGuard,
} from "@/lib/mock/routers";

export default function RoutersPage(): React.ReactElement {
  return (
    <AppShell nav="Routers" topNav="Workflows" searchPlaceholder="Global Search ...">
      <div className="mb-6 flex items-center justify-between border-b border-line pb-3 font-mono text-xs">
        <div className="flex items-center gap-4">
          <span className="text-muted">
            Cluster: <span className="text-fg">{routersStats.cluster}</span>
          </span>
          <span className="text-dim">|</span>
          <span className="flex items-center gap-2 text-amber">
            <StatusLed tone="active" pulse />
            SYSTEM_STABLE
          </span>
        </div>
        <div className="flex gap-8">
          <Metric label="Throughput" value={routersStats.throughput} />
          <Metric label="Latency" value={routersStats.latency} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* LLM Router */}
        <RouterCard id={intentClassifier.id} name={intentClassifier.name} kind={intentClassifier.kind}>
          <p className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-wide text-dim">
            Hit_Rate_Total <span className="text-amber">{(intentClassifier.hitRate * 100).toFixed(1)}%</span>
          </p>
          <Meter value={intentClassifier.hitRate} />
          <p className="mb-2 mt-5 font-mono text-[10px] uppercase tracking-wide text-dim">
            Active_Branches
          </p>
          <ul className="space-y-2">
            {intentClassifier.branches.map((b) => (
              <li
                key={b.label}
                className="flex items-center justify-between border-b border-line pb-2 font-mono text-xs last:border-b-0"
              >
                <span className="flex items-center gap-2 text-fg">
                  <CornerDownRight className="h-3.5 w-3.5 text-dim" />
                  {b.label}
                </span>
                <span className="text-muted">{b.pct}</span>
              </li>
            ))}
          </ul>
        </RouterCard>

        {/* If/Else */}
        <RouterCard id={tokenGuard.id} name={tokenGuard.name} kind={tokenGuard.kind}>
          <div className="border border-line p-4">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wide text-dim">
              <span>Condition</span>
              <span className="text-fg">{tokenGuard.condition}</span>
            </div>
            <div className="mt-4 grid grid-cols-2 divide-x divide-line text-center font-mono">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-dim">True</p>
                <p className="mt-1 text-teal">{tokenGuard.truePct}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-dim">False</p>
                <p className="mt-1 text-amber">{tokenGuard.falsePct}</p>
              </div>
            </div>
          </div>
          <p className="mb-2 mt-5 font-mono text-[10px] uppercase tracking-wide text-dim">
            Output_Targets
          </p>
          <ul className="space-y-2">
            {tokenGuard.targets.map((t) => (
              <li
                key={t.label}
                className="flex items-center justify-between border border-line px-3 py-2 font-mono text-xs"
              >
                <span className="text-fg">▶ {t.label}</span>
                <span className="text-dim">{t.tag}</span>
              </li>
            ))}
          </ul>
        </RouterCard>

        {/* Switch */}
        <RouterCard id={regionBalancer.id} name={regionBalancer.name} kind={regionBalancer.kind}>
          <div className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-wide">
            <span className="text-dim">Key_Selector</span>
            <span className="text-teal">{regionBalancer.selector}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {regionBalancer.regions.map((r) => (
              <div
                key={r.label}
                className="flex items-center justify-between border border-line px-3 py-2 font-mono text-xs"
              >
                <span className="text-fg">{r.label}</span>
                <span className="text-muted">{r.pct}</span>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="mt-4 flex w-full items-center justify-center gap-2 border border-line-strong py-2.5 font-mono text-xs uppercase tracking-wider text-muted hover:border-amber hover:text-amber"
          >
            <Code2 className="h-3.5 w-3.5" />
            Configure Switch Paths
          </button>
        </RouterCard>
      </div>

      <div className="mt-5 grid grid-cols-[2fr_1fr] gap-5">
        <BenchCard
          label="Routing_Topology_Flow"
          right={
            <div className="flex gap-2">
              <Chip>Real-Time</Chip>
              <Chip>60FPS</Chip>
            </div>
          }
        >
          <TopologyDiagram />
        </BenchCard>

        <BenchCard label="Routing_Efficiency">
          <MiniBars data={routersStats.efficiency} tone="amber" highlight={5} />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="border border-line p-3">
              <p className="font-mono text-[10px] uppercase tracking-wide text-dim">Peak_CPU</p>
              <p className="mt-1 font-mono text-xl text-fg">{routersStats.peakCpu}</p>
            </div>
            <div className="border border-line p-3">
              <p className="font-mono text-[10px] uppercase tracking-wide text-dim">Mem_Use</p>
              <p className="mt-1 font-mono text-xl text-fg">{routersStats.memUse}</p>
            </div>
          </div>
          <button
            type="button"
            className="mt-4 w-full bg-amber py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-ink hover:bg-amber-dim"
          >
            Export Diagnostics
          </button>
        </BenchCard>
      </div>

      <div className="mt-5 border border-line bg-ink">
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5 font-mono text-[11px]">
          <span className="text-fg">
            TERMINAL_01 <span className="ml-2 text-dim">ROUTER_EVENT_LOG</span>
          </span>
          <span className="text-dim">LIVE: 12ms DELAY</span>
        </div>
        <LogStream entries={routerLog} className="p-4" />
      </div>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <span className="text-right text-muted">
      <span className="block text-[10px] uppercase tracking-wide text-dim">{label}</span>
      <span className="text-amber">{value}</span>
    </span>
  );
}

function RouterCard({
  id,
  name,
  kind,
  children,
}: {
  id: string;
  name: string;
  kind: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="border border-line border-l-2 border-l-role-router bg-surface p-5">
      <div className="mb-1 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wide text-dim">ID: {id}</span>
        <Chip tone="amber">{kind}</Chip>
      </div>
      <h3 className="mb-4 font-display text-xl text-fg">{name}</h3>
      {children}
    </div>
  );
}

function TopologyDiagram(): React.ReactElement {
  return (
    <div className="flex h-64 items-center justify-around bg-ink px-6 py-4">
      <DiagramNode title="INPUT" sub="Stream_A" />
      <Connector />
      <DiagramNode title="ROUTER" sub="Main_Lobby" accent />
      <Connector />
      <div className="flex flex-col gap-4">
        <DiagramNode title="EXEC_01" sub="Primary" />
        <DiagramNode title="EXEC_02" sub="Fallback" dim />
      </div>
    </div>
  );
}

function DiagramNode({
  title,
  sub,
  accent = false,
  dim = false,
}: {
  title: string;
  sub: string;
  accent?: boolean;
  dim?: boolean;
}): React.ReactElement {
  return (
    <div
      className={`w-28 border px-3 py-4 text-center font-mono ${
        accent ? "border-role-router" : "border-line-strong"
      } ${dim ? "opacity-50" : ""} bg-surface`}
    >
      <p className="text-[11px] uppercase tracking-wide text-muted">{title}</p>
      <p className="mt-1 text-xs text-fg">{sub}</p>
    </div>
  );
}

function Connector(): React.ReactElement {
  return <div className="h-px w-8 bg-line-strong" />;
}
