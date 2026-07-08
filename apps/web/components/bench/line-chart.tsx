import { cn } from "@agentforge/ui/cn";

/** Inline SVG line chart on an engineering grid. `data` is normalized 0..1. */
export function LineChart({
  data,
  className,
}: {
  data: number[];
  className?: string;
}): React.ReactElement {
  const w = 100;
  const h = 100;
  const step = data.length > 1 ? w / (data.length - 1) : w;
  const points = data.map((v, i) => `${i * step},${h - v * h}`).join(" ");
  const cols = 8;
  const rows = 4;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className={cn("h-full w-full", className)}
    >
      {Array.from({ length: cols - 1 }, (_, i) => (
        <line
          key={`v${i}`}
          x1={((i + 1) * w) / cols}
          y1={0}
          x2={((i + 1) * w) / cols}
          y2={h}
          stroke="var(--af-line)"
          strokeWidth={0.3}
        />
      ))}
      {Array.from({ length: rows - 1 }, (_, i) => (
        <line
          key={`h${i}`}
          x1={0}
          y1={((i + 1) * h) / rows}
          x2={w}
          y2={((i + 1) * h) / rows}
          stroke="var(--af-line)"
          strokeWidth={0.3}
        />
      ))}
      <polyline
        points={points}
        fill="none"
        stroke="var(--af-amber)"
        strokeWidth={0.8}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
