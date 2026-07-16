import type { Metadata } from "next";

import { MetricPage } from "@/features/metrics/metric-page";
import { routes } from "@/config/navigation";

export const metadata: Metadata = {
  title: routes.population.label,
  description: routes.population.description,
};

export default function PopulationPage() {
  return (
    <MetricPage
      eyebrow="Population · since the 2020 Census"
      title="Who lives where"
      description="District-level population from OpenDOSM, annual from 2020. The map ramps green through red as districts grow denser with people."
      metrics={["population"]}
    />
  );
}
