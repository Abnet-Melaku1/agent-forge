"use client";

import { Button } from "@agentforge/ui/button";
import { PanelLabel } from "@agentforge/ui/panel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@agentforge/ui/select";
import { Slider } from "@agentforge/ui/slider";
import { Textarea } from "@agentforge/ui/textarea";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

import { flowNodes, inspectorConfigs, MODEL_OPTIONS } from "@/lib/mock/graph";
import { useCanvasStore } from "@/stores/canvas-store";

const titleById = new Map(flowNodes.map((n) => [n.id, n.data.title]));

export function Inspector(): React.ReactElement {
  const selectedId = useCanvasStore((s) => s.selectedNodeId);
  const config = selectedId ? inspectorConfigs[selectedId] : undefined;

  const [model, setModel] = useState("");
  const [temperature, setTemperature] = useState(0);
  const [prompt, setPrompt] = useState("");

  // Reseed editable fields whenever the selected node changes.
  useEffect(() => {
    if (!config) return;
    setModel(config.modelId);
    setTemperature(config.temperature);
    setPrompt(config.systemPrompt);
  }, [config]);

  if (!selectedId || !config) {
    return (
      <aside className="flex w-[340px] shrink-0 items-center justify-center border-l border-line bg-topbar">
        <p className="font-mono text-xs uppercase tracking-wider text-dim">No node selected</p>
      </aside>
    );
  }

  return (
    <aside className="flex w-[340px] shrink-0 flex-col border-l border-line bg-topbar">
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <span className="font-mono text-xs uppercase tracking-wider text-muted">
          Inspector: <span className="text-fg">{titleById.get(selectedId)}</span>
        </span>
        <ChevronRight className="h-4 w-4 text-dim" />
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
        <Field label="Model_ID">
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODEL_OPTIONS.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Temperature">
          <div className="flex items-center gap-4">
            <Slider
              value={[temperature]}
              onValueChange={([v]) => setTemperature(v ?? 0)}
              min={0}
              max={1}
              step={0.1}
            />
            <span className="w-8 shrink-0 text-right font-mono text-sm text-fg">
              {temperature.toFixed(1)}
            </span>
          </div>
        </Field>

        <Field label="System_Prompt">
          <Textarea rows={9} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        </Field>

        <div className="space-y-2 border-t border-line pt-5">
          <MetaRow label="NODE_ID" value={config.nodeUid} />
          <MetaRow label="AVG_LATENCY" value={config.avgLatency} />
          <MetaRow label="LAST_RUN" value={config.lastRun} />
        </div>
      </div>

      <div className="border-t border-line p-4">
        <Button variant="outline" className="w-full">
          Save Node Preset
        </Button>
      </div>
    </aside>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }): React.ReactElement {
  return (
    <div>
      <PanelLabel className="mb-2 block text-muted">{label}</PanelLabel>
      {children}
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div className="flex items-center justify-between font-mono text-xs">
      <span className="text-dim">{label}:</span>
      <span className="text-fg">{value}</span>
    </div>
  );
}
