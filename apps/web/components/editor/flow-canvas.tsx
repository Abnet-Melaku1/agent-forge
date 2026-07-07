"use client";

import {
  Background,
  BackgroundVariant,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useMemo } from "react";

import { NodeCard } from "@/components/editor/node-card";
import { flowEdges, flowNodes, type AfNodeData } from "@/lib/mock/graph";
import { useCanvasStore } from "@/stores/canvas-store";

const initialNodes: Node<AfNodeData>[] = flowNodes.map((n) => ({
  id: n.id,
  type: "afNode",
  position: n.position,
  data: n.data,
  selected: n.id === "PLANNER_LM",
}));

const initialEdges: Edge[] = flowEdges.map((e) => ({
  id: e.id,
  source: e.source,
  target: e.target,
  type: "default",
}));

function Canvas(): React.ReactElement {
  const nodeTypes = useMemo(() => ({ afNode: NodeCard }), []);
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);
  const select = useCanvasStore((s) => s.select);

  const onNodeClick = useCallback<NodeMouseHandler>((_, node) => select(node.id), [select]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={onNodeClick}
      onPaneClick={() => select(null)}
      fitView
      fitViewOptions={{ padding: 0.25, maxZoom: 1 }}
      proOptions={{ hideAttribution: true }}
      defaultEdgeOptions={{ type: "default", style: { stroke: "var(--af-line-strong)", strokeWidth: 1.5 } }}
    >
      <Background variant={BackgroundVariant.Lines} gap={32} color="var(--af-grid-line)" />
    </ReactFlow>
  );
}

export function FlowCanvas(): React.ReactElement {
  return (
    <ReactFlowProvider>
      <div className="h-full w-full bg-ink [&_.react-flow__node]:!cursor-pointer">
        <Canvas />
      </div>
    </ReactFlowProvider>
  );
}
