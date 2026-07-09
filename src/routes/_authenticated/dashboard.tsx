import { createFileRoute } from "@tanstack/react-router";
import { PredictPanel } from "@/components/dashboard/PredictPanel";
import { StatCards } from "@/components/dashboard/StatCards";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div className="space-y-6">
      <StatCards />
      <PredictPanel />
    </div>
  );
}
