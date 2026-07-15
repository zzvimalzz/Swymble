import type { Meta, StoryObj } from "@storybook/nextjs-vite";

/**
 * Living reference for the design tokens. Flip the theme toolbar to review
 * both themes; the a11y addon audits the text samples.
 */
const meta = {
  title: "Design System/Tokens",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj;

function Swatch({ name, varName }: { name: string; varName: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="size-10 shrink-0 rounded-md border border-border"
        style={{ background: `var(${varName})` }}
      />
      <div className="min-w-0">
        <div className="text-sm font-medium">{name}</div>
        <div className="font-mono text-xs text-muted-foreground">{varName}</div>
      </div>
    </div>
  );
}

export const Colors: Story = {
  render: () => (
    <div className="space-y-8 p-8">
      <section>
        <h3 className="mb-4 text-xl">Brand</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Swatch name="Selat" varName="--brand-selat" />
          <Swatch name="Selat bright" varName="--brand-selat-bright" />
          <Swatch name="Songket" varName="--brand-songket" />
          <Swatch name="Ink" varName="--brand-ink" />
        </div>
      </section>
      <section>
        <h3 className="mb-4 text-xl">Surfaces & text</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Swatch name="Background" varName="--background" />
          <Swatch name="Foreground" varName="--foreground" />
          <Swatch name="Card" varName="--card" />
          <Swatch name="Muted" varName="--muted" />
          <Swatch name="Primary" varName="--primary" />
          <Swatch name="Secondary" varName="--secondary" />
          <Swatch name="Border" varName="--border" />
          <Swatch name="Ring" varName="--ring" />
        </div>
      </section>
      <section>
        <h3 className="mb-4 text-xl">Status</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Swatch name="OK" varName="--status-ok" />
          <Swatch name="Caution" varName="--status-caution" />
          <Swatch name="Critical" varName="--status-critical" />
        </div>
      </section>
      <section>
        <h3 className="mb-4 text-xl">Charts</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <Swatch name="Chart 1" varName="--chart-1" />
          <Swatch name="Chart 2" varName="--chart-2" />
          <Swatch name="Chart 3" varName="--chart-3" />
          <Swatch name="Chart 4" varName="--chart-4" />
          <Swatch name="Chart 5" varName="--chart-5" />
        </div>
      </section>
    </div>
  ),
};

export const Typography: Story = {
  render: () => (
    <div className="space-y-6 p-8">
      <p className="text-xs tracking-wide text-muted-foreground uppercase">Eyebrow label</p>
      <h1 className="text-6xl">Explore Malaysia through data</h1>
      <h2 className="text-3xl">16 states. 160 districts. One picture.</h2>
      <h3 className="text-xl">District-level GDP, income, and population</h3>
      <p className="max-w-prose text-base">
        Malaysia&apos;s open-data landscape transformed after 2023: thousands of official
        statistical series are now published with district-level granularity under CC BY 4.0 —
        enough to understand the country from first principles rather than headlines.
      </p>
      <p className="text-sm text-muted-foreground">
        Secondary text for captions and supporting copy.
      </p>
      <div className="font-mono text-sm">
        <span className="tabular">RM 1,529,443,000,000 · 2025-Q1 · 4.1%</span>
      </div>
    </div>
  ),
};

export const Elevation: Story = {
  render: () => (
    <div className="grid grid-cols-1 gap-8 p-8 md:grid-cols-3">
      {(
        [
          ["shadow-raised", "Raised — cards"],
          ["shadow-overlay", "Overlay — popovers"],
          ["shadow-modal", "Modal — dialogs"],
        ] as const
      ).map(([shadowVar, label]) => (
        <div
          key={shadowVar}
          className="rounded-lg bg-card p-6"
          style={{ boxShadow: `var(--${shadowVar})` }}
        >
          <div className="text-sm font-medium">{label}</div>
          <div className="mt-1 font-mono text-xs text-muted-foreground">--{shadowVar}</div>
        </div>
      ))}
    </div>
  ),
};
