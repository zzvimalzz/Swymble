"use client";

import { useEffect, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { fetchFxRates, type FxSnapshot } from "@/services/fx-client";

interface FxBoardProps {
  /** Single-column tiles for narrow panels. */
  narrow?: boolean;
}

/** Ringgit reference rates (ECB set — clearly not BNM official). */
export function FxBoard({ narrow = false }: FxBoardProps) {
  const [fx, setFx] = useState<FxSnapshot | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchFxRates()
      .then((snapshot) => {
        if (!cancelled) setFx(snapshot);
      })
      .catch((error) => {
        console.error("fx fetch failed:", error);
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const grid = narrow
    ? "grid grid-cols-2 gap-px"
    : "grid grid-cols-2 gap-px sm:grid-cols-3 lg:grid-cols-6";

  if (failed) {
    return (
      <p className="text-sm text-muted-foreground">Reference rates are unavailable right now.</p>
    );
  }

  if (!fx) {
    return (
      <div className={`${grid} gap-4`} aria-label="Loading exchange rates">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <dl className={`${grid} overflow-hidden rounded-lg border`}>
        {fx.rates.map((rate) => (
          <div key={rate.currency} className="bg-card p-4" data-testid={`fx-${rate.currency}`}>
            <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {rate.per === 100 ? `${rate.currency} ×100` : rate.currency}
            </dt>
            <dd className="mt-1 font-display text-2xl font-semibold tabular">
              RM {rate.rmPer.toFixed(3)}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs text-muted-foreground">
        <span>ECB reference rates via Frankfurter · {fx.date}</span>
        <span aria-hidden>·</span>
        <span>indicative only — not BNM official rates (their API blocks browsers)</span>
      </p>
    </div>
  );
}
