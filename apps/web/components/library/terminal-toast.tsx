import { StatusLed } from "@agentforge/ui/status-led";
import { TerminalSquare } from "lucide-react";

export function TerminalToast(): React.ReactElement {
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 flex items-center gap-3 border border-line-strong bg-surface-raised px-4 py-2.5 shadow-node">
      <TerminalSquare className="h-4 w-4 text-muted" strokeWidth={1.5} />
      <span className="font-mono text-xs text-fg">READY. LISTENING ON PORT 4000...</span>
      <StatusLed tone="active" pulse />
    </div>
  );
}
