import { Suspense } from "react";
import type { Metadata } from "next";

import { ExplorerView } from "@/features/explorer";
import { routes } from "@/config/navigation";

export const metadata: Metadata = {
  title: routes.explorer.label,
  description: routes.explorer.description,
};

export default function ExplorerPage() {
  return (
    // Suspense boundary: ExplorerView reads search params (?state=) for
    // deep links, which opts the subtree into client-side rendering.
    <Suspense>
      <ExplorerView />
    </Suspense>
  );
}
