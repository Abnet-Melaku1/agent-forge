import type { ReactNode } from "react";

import { BenchTopBar } from "./bench-top-bar";
import { SideNav } from "./side-nav";

/**
 * Layout shell for the management/inventory pages (wide sidebar + search top bar).
 * `nav` is the active sidebar item, `topNav` the active section link.
 */
export function AppShell({
  nav,
  topNav,
  searchPlaceholder,
  children,
}: {
  nav: string;
  topNav: string;
  searchPlaceholder?: string;
  children: ReactNode;
}): React.ReactElement {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <BenchTopBar activeTop={topNav} searchPlaceholder={searchPlaceholder} />
      <div className="flex flex-1 overflow-hidden">
        <SideNav active={nav} />
        <main className="flex-1 overflow-y-auto px-8 py-6">{children}</main>
      </div>
    </div>
  );
}
