import type { Metadata } from "next";

import { TransitView } from "@/features/transit/transit-view";
import { routes } from "@/config/navigation";

export const metadata: Metadata = {
  title: routes.transit.label,
  description: routes.transit.description,
};

export default function TransitPage() {
  return <TransitView />;
}
