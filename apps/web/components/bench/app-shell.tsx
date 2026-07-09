import type { ReactNode } from "react";

import { BenchTopBar } from "./bench-top-bar";
import { MobileNavDrawer } from "./mobile-nav";
import { SideNav } from "./side-nav";

/**
 * Layout shell for the management/inventory pages (wide sidebar + search top bar).
 * `nav` is the active sidebar item, `topNav` the active section link. Below `lg` the
 * sidebar is replaced by a slide-out drawer opened from the top-bar hamburger.
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
      <MobileNavDrawer active={nav} activeTop={topNav} />

      <div className="flex flex-1 overflow-hidden">
        <div className="hidden lg:flex">
          <SideNav active={nav} />
        </div>
        <main className="min-w-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
