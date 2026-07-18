"use client";

import { useMemo, useState } from "react";

import { Separator } from "@/components/ui/separator";
import { formatRm, formatRmPrecise } from "@/lib/format";

import { NumberField, ResultHero, StatRow } from "./calc-ui";
import { calculateSavings } from "./lib/savings";

/** Savings / ASB / unit-trust growth — compound interest with contributions. */
export function SavingsCalculator() {
  const [initial, setInitial] = useState(10_000);
  const [monthly, setMonthly] = useState(500);
  const [rate, setRate] = useState(5);
  const [years, setYears] = useState(10);

  const r = useMemo(
    () =>
      calculateSavings({
        initialDeposit: initial,
        monthlyContribution: monthly,
        annualRatePct: rate,
        years,
      }),
    [initial, monthly, rate, years],
  );

  const growthShare =
    r.futureValue > 0 ? Math.round((r.interestEarned / r.futureValue) * 100) : 0;

  return (
    <div className="grid overflow-hidden rounded-3xl border border-border bg-card shadow-raised lg:grid-cols-2">
      <div className="space-y-7 p-6 sm:p-8">
        <NumberField
          label="Starting amount"
          prefix="RM"
          defaultValue={initial}
          onChange={setInitial}
          min={0}
          max={200_000}
          step={1_000}
        />
        <NumberField
          label="Monthly contribution"
          prefix="RM"
          defaultValue={monthly}
          onChange={setMonthly}
          min={0}
          max={10_000}
          step={100}
        />
        <NumberField
          label="Annual return"
          suffix="%"
          defaultValue={rate}
          onChange={setRate}
          min={0}
          max={15}
          step={0.1}
          decimal
          hint="ASB has historically paid ~5–7%; a fixed deposit ~2.5–3.5%."
        />
        <NumberField
          label="Years"
          suffix="years"
          defaultValue={years}
          onChange={setYears}
          min={1}
          max={40}
          step={1}
        />
      </div>

      <div className="border-t border-border bg-muted/40 p-6 sm:p-8 lg:border-t-0 lg:border-l">
        <ResultHero
          label={`Balance in ${years} years`}
          value={formatRmPrecise(r.futureValue)}
          sub={`${growthShare}% of it is growth`}
        />
        <div className="mt-6 divide-y divide-border">
          <StatRow label="You put in" value={formatRm(r.totalContributions)} />
          <StatRow label="Interest earned" value={formatRm(r.interestEarned)} />
        </div>
        <Separator className="my-4" />
        <StatRow label="Ending balance" value={formatRmPrecise(r.futureValue)} strong />
      </div>
    </div>
  );
}
