import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { populationDistrict } from "@datasets/population-district";
import { SourceAttribution } from "@/components/source-attribution";

const meta = {
  title: "Data/SourceAttribution",
  component: SourceAttribution,
  args: {
    manifest: populationDistrict,
    updatedAt: "2026-02-14T00:00:00Z",
    quality: "ok",
  },
} satisfies Meta<typeof SourceAttribution>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Current: Story = {};

export const AwaitingUpdate: Story = {
  args: { quality: "stale" },
};

export const Unavailable: Story = {
  args: { quality: "unavailable", updatedAt: null },
};
