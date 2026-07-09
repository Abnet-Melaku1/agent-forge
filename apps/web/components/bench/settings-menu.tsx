"use client";

import { cn } from "@agentforge/ui/cn";
import { Check, Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useUiStore } from "@/stores/ui-store";

/**
 * Settings gear with a working popover of real, project-relevant toggles. Applies the
 * reduced-motion preference to the document root so chrome transitions/animations respect
 * it site-wide (see globals.css). Closes on outside click or Escape.
 */
export function SettingsMenu(): React.ReactElement {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const showGrid = useUiStore((s) => s.showGrid);
  const toggleGrid = useUiStore((s) => s.toggleGrid);
  const reducedMotion = useUiStore((s) => s.reducedMotion);
  const toggleReducedMotion = useUiStore((s) => s.toggleReducedMotion);

  useEffect(() => {
    document.documentElement.dataset.reduceMotion = String(reducedMotion);
  }, [reducedMotion]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent): void => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        title="Settings"
        aria-label="Settings"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn("transition-colors", open ? "text-amber" : "text-muted hover:text-fg")}
      >
        <Settings className="h-[18px] w-[18px]" strokeWidth={1.5} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-60 border border-line-strong bg-surface-raised shadow-node">
          <p className="border-b border-line px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-dim">
            Bench Settings
          </p>
          <div className="p-1.5">
            <ToggleRow label="Engineering grid" checked={showGrid} onToggle={toggleGrid} />
            <ToggleRow label="Reduced motion" checked={reducedMotion} onToggle={toggleReducedMotion} />
          </div>
        </div>
      )}
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}): React.ReactElement {
  return (
    <button
      type="button"
      role="menuitemcheckbox"
      aria-checked={checked}
      onClick={onToggle}
      className="flex w-full items-center justify-between px-2.5 py-2 font-mono text-xs text-fg transition-colors hover:bg-ink"
    >
      {label}
      <span
        className={cn(
          "flex h-4 w-4 items-center justify-center border",
          checked ? "border-amber bg-amber text-ink" : "border-line-strong text-transparent",
        )}
      >
        <Check className="h-3 w-3" strokeWidth={3} />
      </span>
    </button>
  );
}
