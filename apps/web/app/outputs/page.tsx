import { StatusLed } from "@agentforge/ui/status-led";
import { Code2, MessageSquare, Plus, RefreshCw, Settings2, Webhook } from "lucide-react";
import type { ReactNode } from "react";

import { AppShell } from "@/components/bench/app-shell";
import { LogStream } from "@/components/bench/log-stream";
import { Chip, Meter, MiniBars } from "@/components/bench/primitives";
import { jsonPreview, outputsLog, outputsStats, slackBars } from "@/lib/mock/outputs";

export default function OutputsPage(): React.ReactElement {
  return (
    <AppShell nav="Outputs" topNav="Workflows" searchPlaceholder="Search parameters...">
      {/* Summary strip */}
      <div className="mb-6 flex items-center justify-between border border-line bg-surface px-6 py-4">
        <div className="flex items-center gap-10">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-dim">Active Sinks</p>
            <div className="mt-1 flex items-center gap-3">
              <span className="font-mono text-2xl text-amber">{outputsStats.activeSinks}</span>
              <Meter value={outputsStats.activeSinksPct} className="w-24" />
            </div>
          </div>
          <StatInline label="Aggregate Throughput" value={outputsStats.aggregateThroughput} />
          <StatInline label="System Latency" value={outputsStats.systemLatency} tone="teal" />
        </div>
        <button
          type="button"
          className="flex items-center gap-2 border border-line-strong px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-muted hover:border-amber hover:text-amber"
        >
          <Plus className="h-4 w-4" />
          New Sink
        </button>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <SinkCard id="SNK-001-JSON" title="Production_JSON" badge="LOCKED" icon={<Code2 className="h-5 w-5" />} throughput="82.4 KB/s" payload="4.2 MB">
          <pre className="overflow-x-auto bg-ink p-3 font-mono text-[11px] leading-relaxed text-teal">
            {jsonPreview}
          </pre>
        </SinkCard>

        <SinkCard id="SNK-042-SLACK" title="Slack_Ops_Alerts" badge="IDLE" icon={<MessageSquare className="h-5 w-5" />} throughput="2.1 KB/s" payload="12 KB" footer="LAST DELIVERY: 12.8s AGO">
          <MiniBars data={slackBars} tone="teal" />
          <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-wide text-dim">
            <span>-10m</span>
            <span>Now</span>
          </div>
        </SinkCard>

        <SinkCard id="SNK-089-HOOK" title="External_API_Push" badge="STREAMING" badgeTone="teal" icon={<Webhook className="h-5 w-5" />} throughput="58.3 KB/s" payload="114 KB" footer="LAST DELIVERY: LIVE">
          <div className="flex h-[104px] flex-col items-center justify-center border border-line bg-ink">
            <p className="font-mono text-sm text-teal">POST /v1/ingest</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-dim">
              Endpoint: AWS-US-EAST-1
            </p>
          </div>
        </SinkCard>
      </div>

      {/* Debug console */}
      <div className="mt-6 border border-line bg-ink">
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5 font-mono text-[11px]">
          <span className="text-amber">
            DEBUG CONSOLE <span className="ml-2 text-muted">SYSTEM_KERNEL_V1.02</span>
          </span>
          <span className="flex gap-4 text-dim">
            <button type="button" className="hover:text-fg">
              CLEAR
            </button>
            <button type="button" className="hover:text-fg">
              EXPORT
            </button>
          </span>
        </div>
        <LogStream entries={outputsLog} caret className="p-4" />
      </div>
    </AppShell>
  );
}

function StatInline({
  label,
  value,
  tone = "fg",
}: {
  label: string;
  value: string;
  tone?: "fg" | "teal";
}): React.ReactElement {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-wider text-dim">{label}</p>
      <p className={`mt-1 font-mono text-lg ${tone === "teal" ? "text-teal" : "text-fg"}`}>{value}</p>
    </div>
  );
}

function SinkCard({
  id,
  title,
  badge,
  badgeTone = "muted",
  icon,
  throughput,
  payload,
  footer,
  children,
}: {
  id: string;
  title: string;
  badge: string;
  badgeTone?: "muted" | "teal";
  icon: ReactNode;
  throughput: string;
  payload: string;
  footer?: string;
  children: ReactNode;
}): React.ReactElement {
  return (
    <div className="flex flex-col border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <span className="flex items-center gap-2 font-mono text-xs text-fg">
          <StatusLed tone="ok" pulse />
          ID: {id}
        </span>
        <Chip tone={badgeTone}>{badge}</Chip>
      </div>
      <div className="flex items-center justify-between px-4 pt-4">
        <p className="font-display text-lg text-fg">{title}</p>
        <span className="text-muted">{icon}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 px-4 py-4">
        <div className="border border-line p-3">
          <p className="font-mono text-[10px] uppercase tracking-wide text-dim">Throughput</p>
          <p className="mt-1 font-mono text-sm text-fg">{throughput}</p>
        </div>
        <div className="border border-line p-3">
          <p className="font-mono text-[10px] uppercase tracking-wide text-dim">Payload Size</p>
          <p className="mt-1 font-mono text-sm text-fg">{payload}</p>
        </div>
      </div>
      <div className="px-4 pb-4">{children}</div>
      {footer && (
        <div className="mt-auto flex items-center justify-between border-t border-line px-4 py-2.5 font-mono text-[10px] uppercase tracking-wide text-muted">
          {footer}
          <span className="flex gap-2 text-dim">
            <RefreshCw className="h-3.5 w-3.5 hover:text-fg" />
            <Settings2 className="h-3.5 w-3.5 hover:text-fg" />
          </span>
        </div>
      )}
    </div>
  );
}
