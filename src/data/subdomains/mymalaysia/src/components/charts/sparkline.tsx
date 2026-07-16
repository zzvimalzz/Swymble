import { cn } from "@/lib/utils";

interface SparklineProps {
  points: Array<{ year: number; value: number }>;
  /** Accessible description; the numbers also render as text next to it. */
  ariaLabel: string;
  className?: string;
}

const W = 150;
const H = 40;
const PAD = 4;

/**
 * Inline trend line for inspector rows: 2px line, endpoint dot, no axes —
 * the surrounding row carries the actual figures.
 */
export function Sparkline({ points, ariaLabel, className }: SparklineProps) {
  if (points.length < 2) return null;

  const xs = points.map((p) => p.year);
  const ys = points.map((p) => p.value);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const x = (year: number) =>
    PAD + (maxX === minX ? 0 : ((year - minX) / (maxX - minX)) * (W - PAD * 2));
  const y = (value: number) =>
    H - PAD - (maxY === minY ? 0.5 : (value - minY) / (maxY - minY)) * (H - PAD * 2);

  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(p.year).toFixed(1)},${y(p.value).toFixed(1)}`)
    .join("");
  const last = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={ariaLabel}
      className={cn("h-10 w-full max-w-37", className)}
    >
      <path d={d} fill="none" className="stroke-chart-1" strokeWidth={2} strokeLinejoin="round" />
      <circle
        cx={x(last.year)}
        cy={y(last.value)}
        r={3.5}
        className="fill-chart-1 stroke-background"
        strokeWidth={2}
      />
    </svg>
  );
}
