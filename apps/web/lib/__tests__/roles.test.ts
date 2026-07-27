import { describe, expect, it } from "vitest";

import type { NodeRole } from "@agentforge/types";
import { roleStyles } from "@/lib/roles";

const ALL_ROLES: NodeRole[] = ["source", "agent", "tool", "router", "output"];

describe("roleStyles", () => {
  it("defines a style for every node role", () => {
    // an unregistered role would leave a node card unstyled
    expect(Object.keys(roleStyles).sort()).toEqual([...ALL_ROLES].sort());
  });

  it("uses literal role-token classes Tailwind can scan", () => {
    // interpolated class names would be dropped by the JIT scanner
    for (const role of ALL_ROLES) {
      expect(roleStyles[role].bg).toBe(`bg-role-${role}`);
      expect(roleStyles[role].text).toBe(`text-role-${role}`);
    }
  });
});
