/**
 * Cheap pre-commit gate for the TS side (engineering-standards §3). `next lint` and
 * `tsc` are project-scoped, so we run them once for the app rather than per-file —
 * the functions ignore the staged filename list lint-staged would otherwise append.
 */
export default {
  "apps/web/**/*.{ts,tsx}": () => [
    "pnpm --filter web typecheck",
    "pnpm --filter web lint",
    "pnpm --filter web test",
  ],
  "packages/**/*.{ts,tsx}": () => "pnpm --filter web typecheck",
};
