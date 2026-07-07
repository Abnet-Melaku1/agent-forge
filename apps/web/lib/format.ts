/** Presentation formatters for technical values shown across the bench. */

/** USD cost: 3 decimals under $10, 2 at or above (matches the workflow table in the design). */
export function formatCostUsd(usd: number): string {
  return `$${usd >= 10 ? usd.toFixed(2) : usd.toFixed(3)}`;
}

/** Cents → `$0.12` for the run-context header. */
export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/** Zero-padded 2-digit node count (`14`, `08`, `02`). */
export function formatNodeCount(n: number): string {
  return String(n).padStart(2, "0");
}
