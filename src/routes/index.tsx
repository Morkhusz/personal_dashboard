import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/dashboard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Accusense Dev — Engineering Command Center" },
      { name: "description", content: "A live engineering command center for delivery, costs, team energy, and developer productivity." },
      { property: "og:title", content: "Accusense Dev — Engineering Command Center" },
      { property: "og:description", content: "Monitor delivery, costs, pipelines, and team health from one live workspace." },
    ],
  }),
  component: Index,
});

function Index() {
  return <Dashboard />;
}
