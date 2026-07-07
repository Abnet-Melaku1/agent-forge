import { describe, expect, it } from "vitest";

import { normalizeBar } from "@/lib/timeline";

describe("normalizeBar", () => {
  it("maps absolute offsets to window fractions", () => {
    // a finished node becomes [start/total, end/total]
    expect(normalizeBar(0, 120, 1000)).toEqual([0, 0.12]);
  });

  it("extends a running node to the window edge", () => {
    // a null end (still running) fills to 1
    expect(normalizeBar(200, null, 800)).toEqual([0.25, 1]);
  });

  it("clamps overruns to 1", () => {
    // an end beyond the window is capped at the track edge
    expect(normalizeBar(500, 2000, 1000)).toEqual([0.5, 1]);
  });

  it("guards against a zero-length window", () => {
    // total 0 must not divide-by-zero
    expect(normalizeBar(0, 0, 0)).toEqual([0, 0]);
  });
});
