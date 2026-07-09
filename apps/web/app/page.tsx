import { LeftRail } from "@/components/left-rail";
import {
  CostAccumulationCard,
  NodeDistributionCard,
  QuickActionCard,
} from "@/components/library/bottom-cards";
import { StatHero } from "@/components/library/stat-hero";
import { TerminalToast } from "@/components/library/terminal-toast";
import { WorkflowTable } from "@/components/library/workflow-table";
import { TopBar, TopNav } from "@/components/top-bar";

export default function LibraryPage(): React.ReactElement {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <TopBar center={<TopNav active="Workflows" />} />
      <div className="flex flex-1 overflow-hidden">
        <LeftRail active="agent" bench />
        <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <div className="mx-auto max-w-[1200px]">
            <StatHero />
            <WorkflowTable />
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <NodeDistributionCard />
              <CostAccumulationCard />
              <QuickActionCard />
            </div>
          </div>
        </main>
      </div>
      <TerminalToast />
    </div>
  );
}
