import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DATASET_MANIFESTS } from "@datasets";
import { DatasetDetail } from "@/features/datasets/dataset-detail";

// Fully static: one page per dataset manifest, in both build modes.
export const dynamicParams = false;

export function generateStaticParams() {
  return DATASET_MANIFESTS.map((manifest) => ({ id: manifest.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const manifest = DATASET_MANIFESTS.find((m) => m.id === id);
  if (!manifest) return {};
  return { title: manifest.title, description: manifest.description };
}

export default async function DatasetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const manifest = DATASET_MANIFESTS.find((m) => m.id === id);
  if (!manifest) notFound();
  return <DatasetDetail id={id} />;
}
