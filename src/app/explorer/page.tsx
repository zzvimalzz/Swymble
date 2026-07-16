import type { Metadata } from "next";

import { ExplorerView } from "@/features/explorer";
import { routes } from "@/config/navigation";

export const metadata: Metadata = {
  title: routes.explorer.label,
  description: routes.explorer.description,
};

export default function ExplorerPage() {
  return <ExplorerView />;
}
