import type { NodeRole } from "./domain";

/**
 * Per-role presentation. Full literal class strings (not interpolated) so Tailwind's
 * content scanner keeps them — the node tab, port handles, and timeline bars all key off role.
 */
interface RoleStyle {
  label: string;
  text: string;
  bg: string;
  border: string;
}

export const roleStyles: Record<NodeRole, RoleStyle> = {
  source: {
    label: "SOURCE",
    text: "text-role-source",
    bg: "bg-role-source",
    border: "border-role-source",
  },
  agent: {
    label: "AGENT",
    text: "text-role-agent",
    bg: "bg-role-agent",
    border: "border-role-agent",
  },
  tool: { label: "TOOL", text: "text-role-tool", bg: "bg-role-tool", border: "border-role-tool" },
  router: {
    label: "ROUTER",
    text: "text-role-router",
    bg: "bg-role-router",
    border: "border-role-router",
  },
  output: {
    label: "OUTPUT",
    text: "text-role-output",
    bg: "bg-role-output",
    border: "border-role-output",
  },
};
