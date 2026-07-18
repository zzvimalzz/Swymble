"use client";

import { useMemo, useState } from "react";

import { Separator } from "@/components/ui/separator";
import { formatRm, formatRmPrecise } from "@/lib/format";

import { NumberField, ResultHero, StatRow } from "./calc-ui";
import { calculateLoan } from "./lib/loan";

/** Home / car / personal financing — monthly repayment and lifetime interest. */
export function LoanCalculator() {
  const [principal, setPrincipal] = useState(300_000);
  const [rate, setRate] = useState(4);
  const [years, setYears] = useState(30);

  const r = useMemo(
    () => calculateLoan({ principal, annualRatePct: rate, years }),
    [principal, rate, years],
  );

  const interestShare =
    r.totalPayment > 0 ? Math.round((r.totalInterest / r.totalPayment) * 100) : 0;

  return (
    <div className="grid overflow-hidden rounded-3xl border border-border bg-card shadow-raised lg:grid-cols-2">
      <div className="space-y-7 p-6 sm:p-8">
        <NumberField
          label="Financing amount"
          prefix="RM"
          defaultValue={principal}
          onChange={setPrincipal}
          min={0}
          max={1_500_000}
          step={5_000}
        />
        <NumberField
          label="Interest rate (per year)"
          suffix="%"
          defaultValue={rate}
          onChange={setRate}
          min={0}
          max={12}
          step={0.1}
          decimal
        />
        <NumberField
          label="Tenure"
          suffix="years"
          defaultValue={years}
          onChange={setYears}
          min={1}
          max={35}
          step={1}
        />
      </div>

      <div className="border-t border-border bg-muted/40 p-6 sm:p-8 lg:border-t-0 lg:border-l">
        <ResultHero
          label="Monthly repayment"
          value={formatRmPrecise(r.monthlyPayment)}
          sub={`over ${r.months} months`}
        />
        <div className="mt-6 divide-y divide-border">
          <StatRow label="Principal" value={formatRm(r.principal)} />
          <StatRow
            label="Total interest"
            value={formatRm(r.totalInterest)}
            note={`${interestShare}% of what you repay`}
          />
        </div>
        <Separator className="my-4" />
        <StatRow label="Total repaid" value={formatRmPrecise(r.totalPayment)} strong />
      </div>
    </div>
  );
}
