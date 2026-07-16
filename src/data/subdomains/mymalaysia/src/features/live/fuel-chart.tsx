"use client";

import { useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";

import type { FuelPriceRow } from "@/types/dataset-payloads";
import { cn } from "@/lib/utils";

import { FUEL_COLORS, FUEL_SERIES, formatRmPerLitre, type FuelSeries } from "./fuel";

const WIDTH = 860;
const HEIGHT = 300;
const MARGIN = { top: 16, right: 76, bottom: 28, left: 44 };

interface FuelChartProps {
  rows: FuelPriceRow[];
  className?: string;
}

interface Scales {
  x: (index: number) => number;
  y: (value: number) => number;
  yTicks: number[];
  xTicks: Array<{ index: number; label: string }>;
}

function buildScales(rows: FuelPriceRow[]): Scales {
  const values = rows.flatMap((r) => [r.ron95, r.ron97, r.diesel]);
  const min = Math.floor(Math.min(...values) * 10) / 10;
  const max = Math.ceil(Math.max(...values) * 10) / 10;
  const innerW = WIDTH - MARGIN.left - MARGIN.right;
  const innerH = HEIGHT - MARGIN.top - MARGIN.bottom;

  const x = (index: number) =>
    MARGIN.left + (rows.length <= 1 ? 0 : (index / (rows.length - 1)) * innerW);
  const y = (value: number) => MARGIN.top + innerH - ((value - min) / (max - min || 1)) * innerH;

  const step = (max - min) / 4;
  const yTicks = Array.from({ length: 5 }, (_, i) => Math.round((min + i * step) * 100) / 100);

  // One tick per year boundary, thinned to at most 8 labels.
  const yearTicks: Array<{ index: number; label: string }> = [];
  let lastYear = "";
  rows.forEach((row, index) => {
    const year = row.date.slice(0, 4);
    if (year !== lastYear) {
      lastYear = year;
      yearTicks.push({ index, label: year });
    }
  });
  const thin = Math.max(1, Math.ceil(yearTicks.length / 8));
  return { x, y, yTicks, xTicks: yearTicks.filter((_, i) => i % thin === 0) };
}

function linePath(rows: FuelPriceRow[], series: FuelSeries, scales: Scales): string {
  return rows
    .map(
      (row, i) =>
        `${i === 0 ? "M" : "L"}${scales.x(i).toFixed(1)},${scales.y(row[series]).toFixed(1)}`,
    )
    .join("");
}

/**
 * Weekly fuel price history: three thin lines, crosshair + tooltip on
 * hover, direct labels at the line ends, and a table fallback. Colors are
 * the palette-validated fuel set for the active theme.
 */
export function FuelChart({ rows, className }: FuelChartProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const { resolvedTheme } = useTheme();
  const colors = FUEL_COLORS[resolvedTheme === "dark" ? "dark" : "light"];

  const scales = useMemo(() => buildScales(rows), [rows]);
  if (rows.length < 2) return null;

  const onPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const xView = ((event.clientX - rect.left) / rect.width) * WIDTH;
    const innerW = WIDTH - MARGIN.left - MARGIN.right;
    const fraction = Math.min(1, Math.max(0, (xView - MARGIN.left) / innerW));
    setHoverIndex(Math.round(fraction * (rows.length - 1)));
  };

  const hovered = hoverIndex === null ? null : rows[hoverIndex];
  const last = rows[rows.length - 1];

  return (
    <figure className={cn("relative", className)}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="Weekly fuel prices in ringgit per litre — the table below holds the same data"
        className="h-auto w-full touch-none select-none"
        onPointerMove={onPointerMove}
        onPointerLeave={() => setHoverIndex(null)}
      >
        {/* recessive grid + y labels */}
        {scales.yTicks.map((tick) => (
          <g key={tick}>
            <line
              x1={MARGIN.left}
              x2={WIDTH - MARGIN.right}
              y1={scales.y(tick)}
              y2={scales.y(tick)}
              className="stroke-border/60"
              strokeWidth={1}
            />
            <text
              x={MARGIN.left - 8}
              y={scales.y(tick) + 3}
              textAnchor="end"
              className="fill-muted-foreground font-mono text-[10px]"
            >
              {tick.toFixed(2)}
            </text>
          </g>
        ))}
        {/* x labels (years) */}
        {scales.xTicks.map((tick) => (
          <text
            key={tick.label}
            x={scales.x(tick.index)}
            y={HEIGHT - 8}
            textAnchor="middle"
            className="fill-muted-foreground font-mono text-[10px]"
          >
            {tick.label}
          </text>
        ))}
        {/* series */}
        {FUEL_SERIES.map((series) => (
          <path
            key={series.id}
            d={linePath(rows, series.id, scales)}
            fill="none"
            stroke={colors[series.id]}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        ))}
        {/* direct labels at line ends, nudged apart when series converge */}
        {(() => {
          const MIN_GAP = 12;
          const labels = FUEL_SERIES.map((series) => ({
            series,
            y: scales.y(last[series.id]) + 3,
          })).sort((a, b) => a.y - b.y);
          for (let i = 1; i < labels.length; i += 1) {
            if (labels[i].y - labels[i - 1].y < MIN_GAP) {
              labels[i].y = labels[i - 1].y + MIN_GAP;
            }
          }
          return labels.map(({ series, y }) => (
            <text
              key={`label-${series.id}`}
              x={WIDTH - MARGIN.right + 8}
              y={y}
              className="fill-foreground font-mono text-[10px] font-medium"
            >
              {series.label}
            </text>
          ));
        })()}
        {/* crosshair + hover markers */}
        {hovered && hoverIndex !== null && (
          <g>
            <line
              x1={scales.x(hoverIndex)}
              x2={scales.x(hoverIndex)}
              y1={MARGIN.top}
              y2={HEIGHT - MARGIN.bottom}
              className="stroke-muted-foreground/50"
              strokeWidth={1}
            />
            {FUEL_SERIES.map((series) => (
              <circle
                key={`marker-${series.id}`}
                cx={scales.x(hoverIndex)}
                cy={scales.y(hovered[series.id])}
                r={4}
                fill={colors[series.id]}
                className="stroke-background"
                strokeWidth={2}
              />
            ))}
          </g>
        )}
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute top-2 rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md"
          style={{
            left: `${((scales.x(hoverIndex!) / WIDTH) * 100).toFixed(1)}%`,
            transform:
              scales.x(hoverIndex!) > WIDTH * 0.6 ? "translateX(-110%)" : "translateX(12px)",
          }}
        >
          <div className="font-mono text-muted-foreground">{hovered.date}</div>
          {FUEL_SERIES.map((series) => (
            <div key={series.id} className="mt-1 flex items-center gap-2">
              <span
                className="inline-block size-2 rounded-full"
                style={{ background: colors[series.id] }}
                aria-hidden
              />
              <span>{series.label}</span>
              <span className="ml-auto pl-3 font-mono tabular">
                {formatRmPerLitre(hovered[series.id])}
              </span>
            </div>
          ))}
        </div>
      )}

      <figcaption className="mt-2 flex flex-wrap items-center gap-4">
        {FUEL_SERIES.map((series) => (
          <span key={series.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className="inline-block h-0.5 w-4 rounded-full"
              style={{ background: colors[series.id] }}
              aria-hidden
            />
            {series.label}
          </span>
        ))}
      </figcaption>

      <details className="mt-3">
        <summary className="cursor-pointer text-xs text-muted-foreground underline-offset-4 hover:underline">
          View recent weeks as a table
        </summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full max-w-md text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-border/60 text-muted-foreground uppercase">
                <th className="py-1.5 pr-4 font-medium">Week</th>
                <th className="py-1.5 pr-4 font-medium">RON95</th>
                <th className="py-1.5 pr-4 font-medium">RON97</th>
                <th className="py-1.5 font-medium">Diesel</th>
              </tr>
            </thead>
            <tbody className="tabular">
              {rows
                .slice(-8)
                .reverse()
                .map((row) => (
                  <tr key={row.date} className="border-b border-border/40">
                    <td className="py-1.5 pr-4">{row.date}</td>
                    <td className="py-1.5 pr-4">{row.ron95.toFixed(2)}</td>
                    <td className="py-1.5 pr-4">{row.ron97.toFixed(2)}</td>
                    <td className="py-1.5">{row.diesel.toFixed(2)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
