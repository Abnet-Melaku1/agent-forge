import { cn } from "@agentforge/ui/cn";

export interface LogEntry {
  time: string;
  level: string;
  text: string;
}

const levelTone: Record<string, string> = {
  INFO: "text-teal",
  SUCCESS: "text-green",
  WARN: "text-warn",
  ERROR: "text-error",
  TRACE: "text-dim",
  SYSTEM: "text-amber",
  ROUTER_MATCH: "text-amber",
  DATA_INGEST: "text-teal",
};

/** Terminal-style log readout with per-level coloring. */
export function LogStream({
  entries,
  caret = false,
  className,
}: {
  entries: LogEntry[];
  caret?: boolean;
  className?: string;
}): React.ReactElement {
  return (
    <div className={cn("space-y-1.5 font-mono text-xs leading-relaxed", className)}>
      {entries.map((e, i) => (
        <p key={i}>
          <span className="text-dim">[{e.time}]</span>{" "}
          <span className={cn(levelTone[e.level] ?? "text-muted")}>{e.level}:</span>{" "}
          <span className="text-muted">{e.text}</span>
        </p>
      ))}
      {caret && <span className="inline-block h-3.5 w-2 animate-pulse bg-teal align-middle" />}
    </div>
  );
}
