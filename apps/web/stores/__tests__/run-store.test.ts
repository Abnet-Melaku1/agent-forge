import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useRunStore } from "@/stores/run-store";

describe("run store emitter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useRunStore.getState().reset();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("streams the scripted run to a succeeded terminal state", () => {
    // driving the emitter to completion aggregates every node's tokens/cost and finishes
    useRunStore.getState().startRun();
    vi.advanceTimersByTime(6000);

    const s = useRunStore.getState();
    expect(s.phase).toBe("succeeded");
    expect(s.totals.tokens).toBe(4129);
    expect(s.totals.costCents).toBe(12);
    expect(s.log).toHaveLength(8);
    expect(Object.keys(s.nodeStatus).sort()).toEqual([
      "CRITIC_LM",
      "PLANNER_LM",
      "SEARCH_API",
      "USER_QUERY",
    ]);
    for (const status of Object.values(s.nodeStatus)) expect(status).toBe("succeeded");
  });

  it("marks a node running before it finishes", () => {
    // between node_started and node_finished the node holds the live "running" status
    useRunStore.getState().startRun();
    vi.advanceTimersByTime(300);
    expect(useRunStore.getState().nodeStatus["USER_QUERY"]).toBe("running");
    expect(useRunStore.getState().phase).toBe("running");
  });

  it("reset cancels pending timers and clears state", () => {
    // resetting mid-run stops further scripted updates from landing
    useRunStore.getState().startRun();
    vi.advanceTimersByTime(300);
    useRunStore.getState().reset();
    vi.advanceTimersByTime(6000);

    const s = useRunStore.getState();
    expect(s.phase).toBe("idle");
    expect(s.log).toHaveLength(0);
  });
});
