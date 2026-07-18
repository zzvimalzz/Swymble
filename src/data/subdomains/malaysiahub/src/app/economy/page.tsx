import type { Metadata } from "next";

import { MetricPage } from "@/features/metrics/metric-page";
import { routes } from "@/config/navigation";

export const metadata: Metadata = {
  title: routes.economy.label,
  description: routes.economy.description,
};

export default function EconomyPage() {
  return (
    <MetricPage
      eyebrow="Economy · the national ledger by place"
      title="What Malaysia earns"
      description="Real GDP by district (constant 2015 prices) and gross monthly household income from the HIES survey — official OpenDOSM figures, ranked and mapped."
      metrics={["gdp", "income"]}
    />
  );
}
