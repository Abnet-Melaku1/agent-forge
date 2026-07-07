/**
 * Map a node's absolute [start, end] run offsets (ms) to [0..1] fractions of the run
 * window, for the gantt bars in the execution timeline. A still-running node (end
 * null) extends to the current window edge. Clamped so bars never overflow the track.
 */
export function normalizeBar(
  start: number,
  end: number | null,
  total: number,
): [number, number] {
  const safeTotal = total > 0 ? total : 1;
  const e = end ?? safeTotal;
  return [Math.min(start / safeTotal, 1), Math.min(e / safeTotal, 1)];
}
