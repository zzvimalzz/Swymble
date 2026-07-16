"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface TimelineBarProps {
  years: number[];
  year: number;
  onYearChange: (year: number) => void;
  /** What the timeline is scrubbing, for the accessible label. */
  label: string;
}

const PLAY_INTERVAL_MS = 1100;

/**
 * The time dimension: scrub or play through a data layer's years — the
 * choropleth, prisms, and inspector all follow.
 */
export function TimelineBar({ years, year, onYearChange, label }: TimelineBarProps) {
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!playing) return;
    timerRef.current = setInterval(() => {
      const index = years.indexOf(year);
      const next = years[(index + 1) % years.length];
      onYearChange(next);
    }, PLAY_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, year, years, onYearChange]);

  if (years.length < 2) return null;
  const index = Math.max(0, years.indexOf(year));

  return (
    <div
      className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/85 px-4 py-2.5 shadow-md backdrop-blur-md"
      data-testid="timeline-bar"
    >
      <Button
        size="icon"
        variant="ghost"
        aria-label={playing ? "Pause timeline" : "Play timeline"}
        aria-pressed={playing}
        onClick={() => setPlaying((p) => !p)}
      >
        {playing ? (
          <Pause className="size-4" aria-hidden />
        ) : (
          <Play className="size-4" aria-hidden />
        )}
      </Button>
      <span className="font-mono text-[10px] text-muted-foreground">{years[0]}</span>
      <Slider
        value={[index]}
        min={0}
        max={years.length - 1}
        step={1}
        onValueChange={([i]) => onYearChange(years[i])}
        aria-label={`${label} year`}
        className="w-40 sm:w-56"
      />
      <span className="font-mono text-[10px] text-muted-foreground">{years[years.length - 1]}</span>
      <span
        className="ml-1 border-l border-border/60 pl-3 font-display text-xl tabular"
        data-testid="timeline-year"
      >
        {year}
      </span>
    </div>
  );
}
