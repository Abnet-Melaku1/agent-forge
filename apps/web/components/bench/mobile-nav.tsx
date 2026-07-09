"use client";

import { cn } from "@agentforge/ui/cn";
import { Activity, LayoutGrid, Menu, Server, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { useUiStore } from "@/stores/ui-store";

import { navFooter, navItems, type NavItem } from "./side-nav";

const sectionLinks: NavItem[] = [
  { label: "Workflows", href: "/", icon: LayoutGrid },
  { label: "Observability", href: "/observability", icon: Activity },
  { label: "Infrastructure", href: "/infrastructure", icon: Server },
];

/** Hamburger button shown below `lg`, where the wide sidebar is hidden. */
export function MobileNavTrigger(): React.ReactElement {
  const toggle = useUiStore((s) => s.toggleMobileNav);
  const open = useUiStore((s) => s.mobileNavOpen);
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Open navigation"
      aria-expanded={open}
      className="-ml-1 flex h-9 w-9 items-center justify-center text-muted hover:text-fg lg:hidden"
    >
      <Menu className="h-5 w-5" strokeWidth={1.5} />
    </button>
  );
}

/**
 * Slide-out mobile navigation drawer mirroring the desktop `SideNav`, plus the top
 * section links. Always mounted (below `lg`) so the transform/opacity transitions play
 * smoothly; closes on backdrop click, link tap, route change, or Escape.
 */
export function MobileNavDrawer({
  active,
  activeTop,
}: {
  active: string;
  activeTop: string;
}): React.ReactElement {
  const open = useUiStore((s) => s.mobileNavOpen);
  const close = useUiStore((s) => s.closeMobileNav);
  const pathname = usePathname();

  // Close on navigation.
  useEffect(() => {
    close();
  }, [pathname, close]);

  // Lock body scroll and wire Escape while open.
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  return (
    <div className="lg:hidden" aria-hidden={!open}>
      <div
        onClick={close}
        className={cn(
          "fixed inset-0 z-40 bg-black/60 transition-opacity duration-300 ease-out",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-72 max-w-[85%] flex-col border-r border-line bg-surface-raised shadow-panel transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-5">
          <div>
            <p className="font-display text-xl font-bold text-amber">Bench v1.0</p>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-dim">
              Precision Orchestrator
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close navigation"
            className="flex h-8 w-8 items-center justify-center text-muted hover:text-fg"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <GroupLabel>Sections</GroupLabel>
          <nav className="flex flex-col gap-1 px-3 pb-2">
            {sectionLinks.map((it) => (
              <DrawerLink key={it.label} item={it} active={it.label === activeTop} />
            ))}
          </nav>

          <GroupLabel>Bench</GroupLabel>
          <nav className="flex flex-col gap-1 px-3">
            {navItems.map((it) => (
              <DrawerLink key={it.label} item={it} active={it.label === active} />
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-1 border-t border-line p-3">
          {navFooter.map((it) => (
            <DrawerLink key={it.label} item={it} active={it.label === active} />
          ))}
        </div>
      </aside>
    </div>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <p className="px-5 pb-2 pt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-dim">
      {children}
    </p>
  );
}

function DrawerLink({ item, active }: { item: NavItem; active: boolean }): React.ReactElement {
  const close = useUiStore((s) => s.closeMobileNav);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={close}
      className={cn(
        "relative flex items-center gap-3 px-3 py-2.5 font-mono text-sm transition-colors",
        active ? "bg-surface-active text-amber" : "text-muted hover:bg-surface hover:text-fg",
      )}
    >
      {active && <span className="absolute left-0 top-0 h-full w-0.5 bg-amber" />}
      <Icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
      {item.label}
    </Link>
  );
}
