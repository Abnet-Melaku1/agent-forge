"use client";

import { cn } from "@agentforge/ui/cn";
import { Handle, Position, type NodeProps } from "@xyflow/react";

import type { LiveNodeStatus } from "@/stores/run-store";
import { useRunStore } from "@/stores/run-store";
import type { AfNodeData } from "@/lib/mock/graph";
import { roleStyles } from "@/lib/roles";

const HANDLE = "!h-2.5 !w-2.5 !rounded-[1px] !border-0 !bg-amber";

function statusDot(status: LiveNodeStatus | undefined): string {
  if (status === "running") return "bg-ink animate-pulse";
  if (status === "succeeded") return "bg-ink/70";
  if (status === "failed") return "bg-error";
  return "bg-ink/40";
}

export function NodeCard({ id, data, selected }: NodeProps): React.ReactElement {
  const d = data as AfNodeData;
  const role = roleStyles[d.role];
  const status = useRunStore((s) => s.nodeStatus[id]);
  const running = status === "running";

  return (
    <div
      className={cn(
        "w-[200px] border bg-surface-raised shadow-node transition-colors",
        selected ? "border-amber" : "border-line",
        running && "border-role-agent",
      )}
    >
      <Handle type="target" position={Position.Left} className={HANDLE} />

      {/* Role tab header */}
      <div className={cn("flex items-center justify-between px-3 py-1", role.bg)}>
        <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-ink">
          {role.label}
        </span>
        <span className={cn("h-2 w-2 rounded-full", statusDot(status))} />
      </div>

      {/* Body */}
      <div className="px-3 py-2.5">
        <p className="font-mono text-[13px] text-fg">{d.title}</p>
        <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wide text-dim">{d.subtitle}</p>
      </div>

      <Handle type="source" position={Position.Right} className={HANDLE} />
    </div>
  );
}
