"use client";

import { useId, useState } from "react";

import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

/**
 * Shared building blocks for the finance calculators so each one stays small
 * and they all look and behave identically. Purely presentational.
 */

/**
 * A labelled numeric field with optional RM prefix / unit suffix + slider.
 * Uncontrolled: it owns its text (so decimals type cleanly) and reports the
 * parsed number up via onChange — no external value is fed back in, which
 * keeps it free of prop-sync effects.
 */
export function NumberField({
  label,
  defaultValue,
  onChange,
  prefix,
  suffix,
  min = 0,
  max,
  step = 1,
  decimal = false,
  hint,
}: {
  label: string;
  defaultValue: number;
  onChange: (n: number) => void;
  prefix?: string;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
  decimal?: boolean;
  hint?: string;
}) {
  const id = useId();
  const [text, setText] = useState(defaultValue ? String(defaultValue) : "");
  const parsed = parseFloat(text);
  const num = Number.isFinite(parsed) ? parsed : 0;

  const setFromText = (raw: string) => {
    const cleaned = raw.replace(decimal ? /[^0-9.]/g : /[^0-9]/g, "");
    setText(cleaned);
    const n = parseFloat(cleaned);
    onChange(Number.isFinite(n) ? n : 0);
  };

  const setFromSlider = (v: number) => {
    setText(String(v));
    onChange(v);
  };

  return (
    <div className="space-y-2.5">
      <label
        htmlFor={id}
        className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
      >
        {label}
      </label>
      <div className="flex items-center gap-2">
        {prefix ? <span className="font-mono text-sm text-muted-foreground">{prefix}</span> : null}
        <Input
          id={id}
          inputMode={decimal ? "decimal" : "numeric"}
          value={text}
          onChange={(e) => setFromText(e.target.value)}
          className="font-mono tabular"
        />
        {suffix ? <span className="font-mono text-sm text-muted-foreground">{suffix}</span> : null}
      </div>
      {max !== undefined ? (
        <Slider
          value={[Math.min(Math.max(num, min), max)]}
          onValueChange={([v]) => setFromSlider(v ?? min)}
          min={min}
          max={max}
          step={step}
          aria-label={label}
        />
      ) : null}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/** The headline result figure — gold, per the editorial-figure doctrine. */
export function ResultHero({
  label,
  value,
  sub,
  className,
}: {
  label: string;
  value: string;
  sub?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-1 font-display text-4xl font-semibold tracking-tight text-brand-songket tabular sm:text-5xl">
        {value}
      </p>
      {sub ? <p className="mt-1 text-sm text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

/** A label + mono value row for the breakdown list. */
export function StatRow({
  label,
  value,
  note,
  strong,
}: {
  label: string;
  value: string;
  note?: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <div className="min-w-0">
        <p className={cn("text-sm", strong ? "text-foreground" : "text-muted-foreground")}>
          {label}
        </p>
        {note ? <p className="text-xs text-muted-foreground">{note}</p> : null}
      </div>
      <p
        className={cn(
          "font-mono text-sm tabular",
          strong ? "font-medium text-foreground" : "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}
