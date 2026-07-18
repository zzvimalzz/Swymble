import { Suspense } from "react";
import type { Metadata } from "next";

import { AtlasView } from "@/features/atlas";
import { routes } from "@/config/navigation";

export const metadata: Metadata = {
  title: routes.map.label,
  description: routes.map.description,
};

export default function MapPage() {
  return (
    // Suspense boundary: the atlas reads search params (?state, ?panel,
    // ?layer) for deep links, which opts the subtree into CSR.
    <Suspense>
      <AtlasView />
    </Suspense>
  );
}
