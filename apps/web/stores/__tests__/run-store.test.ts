import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useRunStore } from "@/stores/run-store";

describe("run store emitter", () => {
  let wsInstance: any = null;
  let mockFetch: any;

  beforeEach(() => {
    useRunStore.getState().reset();

    // Mock WebSocket
    wsInstance = null;
    vi.stubGlobal("WebSocket", class MockWebSocket {
      onmessage: any;
      onerror: any;
      onclose: any;
      url: string;
      constructor(url: string) {
        this.url = url;
        wsInstance = this;
      }
      close() {
        if (this.onclose) this.onclose();
      }
    });

    // Mock fetch
    mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.endsWith("/workflows")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: "mock-workflow-id" }),
        });
      }
      if (url.includes("/versions") && url.endsWith("/runs")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: "mock-run-id" }),
        });
      }
      if (url.includes("/workflows/") && url.endsWith("/versions")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ version_id: "mock-version-id" }),
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    });
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("streams the run to a succeeded terminal state", async () => {
    const promise = useRunStore.getState().startRun();

    // Wait for the fetch calls to complete and WebSocket to instantiate
    await vi.waitFor(() => expect(wsInstance).not.toBeNull());

    // Send mock messages over WebSocket
    wsInstance.onmessage({
      data: JSON.stringify({ kind: "run_started" }),
    });
    wsInstance.onmessage({
      data: JSON.stringify({ kind: "node_started", nodeId: "USER_QUERY" }),
    });
    wsInstance.onmessage({
      data: JSON.stringify({ kind: "node_finished", nodeId: "USER_QUERY", status: "succeeded", output: "test-query" }),
    });
    wsInstance.onmessage({
      data: JSON.stringify({ kind: "node_started", nodeId: "PLANNER_LM" }),
    });
    wsInstance.onmessage({
      data: JSON.stringify({ kind: "node_finished", nodeId: "PLANNER_LM", status: "succeeded", output: "test-plan" }),
    });
    wsInstance.onmessage({
      data: JSON.stringify({ kind: "node_started", nodeId: "SEARCH_API" }),
    });
    wsInstance.onmessage({
      data: JSON.stringify({ kind: "node_finished", nodeId: "SEARCH_API", status: "succeeded", output: "test-search" }),
    });
    wsInstance.onmessage({
      data: JSON.stringify({ kind: "node_started", nodeId: "CRITIC_LM" }),
    });
    wsInstance.onmessage({
      data: JSON.stringify({ kind: "node_finished", nodeId: "CRITIC_LM", status: "succeeded", output: "test-critic" }),
    });
    wsInstance.onmessage({
      data: JSON.stringify({ kind: "run_finished", status: "succeeded" }),
    });

    await promise;

    const s = useRunStore.getState();
    expect(s.phase).toBe("succeeded");
    expect(s.totals.tokens).toBe(4129); // 48 + 512 + 2401 + 1168
    expect(s.totals.costCents).toBe(12); // 0 + 1 + 8 + 3
    expect(Object.keys(s.nodeStatus).sort()).toEqual([
      "CRITIC_LM",
      "PLANNER_LM",
      "SEARCH_API",
      "USER_QUERY",
    ]);
    for (const status of Object.values(s.nodeStatus)) {
      expect(status).toBe("succeeded");
    }
  });

  it("marks a node running before it finishes", async () => {
    useRunStore.getState().startRun();

    await vi.waitFor(() => expect(wsInstance).not.toBeNull());

    wsInstance.onmessage({
      data: JSON.stringify({ kind: "node_started", nodeId: "USER_QUERY" }),
    });

    expect(useRunStore.getState().nodeStatus["USER_QUERY"]).toBe("running");
    expect(useRunStore.getState().phase).toBe("running");
  });

  it("reset cancels WebSocket and clears state", async () => {
    useRunStore.getState().startRun();

    await vi.waitFor(() => expect(wsInstance).not.toBeNull());

    wsInstance.onmessage({
      data: JSON.stringify({ kind: "node_started", nodeId: "USER_QUERY" }),
    });

    const closeSpy = vi.spyOn(wsInstance, "close");

    useRunStore.getState().reset();

    expect(closeSpy).toHaveBeenCalled();

    const s = useRunStore.getState();
    expect(s.phase).toBe("idle");
    expect(s.log).toHaveLength(0);
  });
});
