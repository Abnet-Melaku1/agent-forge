import { cn } from "./cn";

export type LedTone = "active" | "idle" | "error" | "ok";

const tone: Record<LedTone, string> = {
  active: "bg-amber shadow-[0_0_6px_1px_var(--af-amber)]",
  ok: "bg-ok shadow-[0_0_6px_1px_var(--af-ok)]",
  error: "bg-error shadow-[0_0_6px_1px_var(--af-error)]",
  idle: "bg-idle",
};

export function StatusLed({
  tone: t,
  pulse = false,
  className,
}: {
  tone: LedTone;
  pulse?: boolean;
  className?: string;
}): React.ReactElement {
  return (
    <span
      className={cn("inline-block h-2 w-2 rounded-full", tone[t], pulse && "animate-pulse", className)}
    />
  );
}
