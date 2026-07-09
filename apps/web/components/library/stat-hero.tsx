import { libraryStats } from "@/lib/mock/workflows";

export function StatHero(): React.ReactElement {
  const { activeWorkflows, latestSync, throughput, latencyP95 } = libraryStats;
  return (
    <section className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4 border-b border-line pb-6">
      <div className="flex items-end gap-6">
        <span className="font-display text-6xl font-bold leading-[0.8] text-amber sm:text-[92px]">
          {activeWorkflows}
        </span>
        <div className="pb-2">
          <h1 className="bench-heading text-2xl text-fg">Active Workflows</h1>
          <p className="mt-1 font-mono text-xs text-muted">
            LATEST SYNC: <span className="text-fg">{latestSync}</span>
          </p>
        </div>
      </div>
      <div className="flex gap-10 pt-3">
        <HeroMetric label="Node Throughput" value={throughput} amber />
        <HeroMetric label="Latency (P95)" value={latencyP95} />
      </div>
    </section>
  );
}

function HeroMetric({
  label,
  value,
  amber = false,
}: {
  label: string;
  value: string;
  amber?: boolean;
}): React.ReactElement {
  return (
    <div className="text-right">
      <p className="font-mono text-[10px] uppercase tracking-wider text-dim">{label}</p>
      <p className={`mt-1 font-mono text-lg ${amber ? "text-amber" : "text-fg"}`}>{value}</p>
    </div>
  );
}
