"use client";

import { ExecutionLog } from "@/components/editor/execution-log";
import { FlowCanvas } from "@/components/editor/flow-canvas";
import { Inspector } from "@/components/editor/inspector";
import { LeftRail } from "@/components/left-rail";
import { RunContext, TopBar } from "@/components/top-bar";
import { formatCents } from "@/lib/format";
import { useRunStore } from "@/stores/run-store";

export default function EditorPage(): React.ReactElement {
  const startRun = useRunStore((s) => s.startRun);
  const totals = useRunStore((s) => s.totals);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <TopBar
        onRun={startRun}
        center={
          <RunContext
            name="CORE_ORCHESTRATOR_V2"
            tokens={totals.tokens.toLocaleString("en-US")}
            cost={formatCents(totals.costCents)}
            latency={`${totals.latencyMs}ms`}
          />
        }
      />
      <div className="flex flex-1 overflow-hidden">
        <LeftRail active="agent" />
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <FlowCanvas />
          </div>
          <ExecutionLog />
        </div>
        <Inspector />
      </div>
    </div>
  );
}
