import { create } from "zustand";

/** Editor/canvas selection state. Kept separate from run/event state (CLAUDE.md §9). */
interface CanvasState {
  selectedNodeId: string | null;
  select: (nodeId: string | null) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  selectedNodeId: "PLANNER_LM",
  select: (nodeId) => set({ selectedNodeId: nodeId }),
}));
