import type { Config } from "tailwindcss";

/**
 * AgentForge design tokens as a Tailwind preset (CLAUDE.md §11).
 * Colors resolve to CSS variables declared in @agentforge/ui `tokens.css`, so
 * the single source of truth for a value lives in one place.
 */
const preset: Omit<Config, "content"> = {
  theme: {
    extend: {
      colors: {
        // Warm-ink surfaces
        ink: "var(--af-ink)",
        surface: "var(--af-surface)",
        "surface-raised": "var(--af-surface-raised)",
        topbar: "var(--af-topbar)",
        line: "var(--af-line)",
        "line-strong": "var(--af-line-strong)",
        // Single amber signal
        amber: "var(--af-amber)",
        "amber-dim": "var(--af-amber-dim)",
        // Text
        fg: "var(--af-text)",
        muted: "var(--af-text-muted)",
        dim: "var(--af-text-dim)",
        // Status
        ok: "var(--af-ok)",
        error: "var(--af-error)",
        idle: "var(--af-idle)",
        // Node role accents
        "role-source": "var(--af-role-source)",
        "role-agent": "var(--af-role-agent)",
        "role-tool": "var(--af-role-tool)",
        "role-router": "var(--af-role-router)",
        "role-output": "var(--af-role-output)",
      },
      fontFamily: {
        display: ["var(--af-font-display)", "system-ui", "sans-serif"],
        mono: ["var(--af-font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        bench: "3px",
      },
      boxShadow: {
        node: "0 8px 24px -8px rgba(0, 0, 0, 0.6)",
        panel: "0 1px 0 0 var(--af-line) inset",
      },
      backgroundImage: {
        "bench-grid":
          "linear-gradient(var(--af-grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--af-grid-line) 1px, transparent 1px)",
      },
    },
  },
};

export default preset;
