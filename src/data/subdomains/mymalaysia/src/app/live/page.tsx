import type { Metadata } from "next";

import { LiveView } from "@/features/live";
import { routes } from "@/config/navigation";

export const metadata: Metadata = {
  title: routes.live.label,
  description: routes.live.description,
};

export default function LivePage() {
  return <LiveView />;
}
