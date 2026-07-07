import { describe, expect, it } from "vitest";

import { formatCents, formatCostUsd, formatNodeCount } from "@/lib/format";

describe("formatCostUsd", () => {
  it("uses 3 decimals below $10", () => {
    // sub-$10 costs keep 3 decimals as in the workflow table
    expect(formatCostUsd(0.421)).toBe("$0.421");
    expect(formatCostUsd(0.002)).toBe("$0.002");
  });

  it("uses 2 decimals at or above $10", () => {
    // larger costs collapse to 2 decimals
    expect(formatCostUsd(12.04)).toBe("$12.04");
  });
});

describe("formatCents", () => {
  it("renders cents as a 2-decimal dollar value", () => {
    // header run-cost shows cents → dollars
    expect(formatCents(12)).toBe("$0.12");
    expect(formatCents(0)).toBe("$0.00");
  });
});

describe("formatNodeCount", () => {
  it("zero-pads to two digits", () => {
    // node counts render as 2-digit mono values
    expect(formatNodeCount(2)).toBe("02");
    expect(formatNodeCount(14)).toBe("14");
  });
});
