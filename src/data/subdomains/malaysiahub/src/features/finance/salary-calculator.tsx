"use client";

import { useId, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { formatRm, formatRmPrecise } from "@/lib/format";
import { cn } from "@/lib/utils";

import { calculateSalary, type ContributionLine } from "./lib/salary";

const MAX_SLIDER = 25_000;

/** One deduction line: label + optional employer split + a tabular figure. */
function DeductionRow({
  label,
  line,
  note,
}: {
  label: string;
  line: ContributionLine | number;
  note?: string;
}) {
  const employee = typeof line === "number" ? line : line.employee;
  const employer = typeof line === "number" ? null : line.employer;
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <div className="min-w-0">
        <p className="text-sm text-foreground">{label}</p>
        {note ? <p className="text-xs text-muted-foreground">{note}</p> : null}
      </div>
      <div className="text-right">
        <p className="font-mono text-sm tabular text-foreground">
          −{formatRmPrecise(employee)}
        </p>
        {employer !== null ? (
          <p className="font-mono text-xs tabular text-muted-foreground">
            employer +{formatRm(employer)}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function SalaryCalculator() {
  const [wage, setWage] = useState(5_000);
  const [age60Plus, setAge60Plus] = useState(false);
  const [includeEpf, setIncludeEpf] = useState(true);
  const [reliefs, setReliefs] = useState(0);
  const wageFieldId = useId();
  const reliefFieldId = useId();

  const result = useMemo(
    () =>
      calculateSalary({
        monthlyWage: wage,
        age60Plus,
        includeEpf,
        additionalReliefs: reliefs,
      }),
    [wage, age60Plus, includeEpf, reliefs],
  );

  const takeHomePct =
    result.monthlyWage > 0 ? Math.round((result.monthlyNet / result.monthlyWage) * 100) : 0;

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-raised">
      <div className="grid lg:grid-cols-[1fr_1.05fr]">
        {/* Inputs */}
        <div className="space-y-8 p-6 sm:p-8">
          <div className="space-y-3">
            <label
              htmlFor={wageFieldId}
              className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
            >
              Gross monthly salary
            </label>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg text-muted-foreground">RM</span>
              <Input
                id={wageFieldId}
                inputMode="numeric"
                value={wage ? String(wage) : ""}
                onChange={(e) => {
                  const n = Number(e.target.value.replace(/[^0-9]/g, ""));
                  setWage(Number.isFinite(n) ? n : 0);
                }}
                className="h-11 font-mono text-2xl tabular"
                aria-describedby={`${wageFieldId}-hint`}
              />
            </div>
            <Slider
              value={[Math.min(wage, MAX_SLIDER)]}
              onValueChange={([v]) => setWage(v ?? 0)}
              min={0}
              max={MAX_SLIDER}
              step={100}
              aria-label="Gross monthly salary"
            />
            <p id={`${wageFieldId}-hint`} className="text-xs text-muted-foreground">
              Drag or type. Contributions cap at their statutory ceilings.
            </p>
          </div>

          <div className="space-y-1">
            <SettingRow
              label="Aged 60 or above"
              description="Changes EPF and SOCSO rates; EIS no longer applies."
              checked={age60Plus}
              onCheckedChange={setAge60Plus}
            />
            <Separator />
            <SettingRow
              label="Contribute to EPF"
              description="Almost everyone does; toggle off to compare."
              checked={includeEpf}
              onCheckedChange={setIncludeEpf}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor={reliefFieldId}
              className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
            >
              Extra annual tax reliefs
            </label>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-muted-foreground">RM</span>
              <Input
                id={reliefFieldId}
                inputMode="numeric"
                value={reliefs ? String(reliefs) : ""}
                placeholder="0"
                onChange={(e) => {
                  const n = Number(e.target.value.replace(/[^0-9]/g, ""));
                  setReliefs(Number.isFinite(n) ? n : 0);
                }}
                className="font-mono tabular"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Beyond the automatic RM9,000 individual relief and your EPF/SOCSO relief —
              e.g. lifestyle, medical, education, insurance.
            </p>
          </div>
        </div>

        {/* Results */}
        <div className="border-t border-border bg-muted/40 p-6 sm:p-8 lg:border-t-0 lg:border-l">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Monthly take-home
          </p>
          <div className="mt-1 flex items-end gap-3">
            <p className="font-display text-5xl font-semibold tracking-tight text-brand-songket tabular">
              {formatRmPrecise(result.monthlyNet)}
            </p>
            <Badge variant="outline" className="mb-2 font-mono">
              {takeHomePct}% of gross
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            from {formatRm(result.monthlyWage)} gross · {formatRm(result.annual.netIncome)} a
            year
          </p>

          <div className="mt-6 divide-y divide-border">
            <DeductionRow label="EPF / KWSP" line={result.epf} />
            <DeductionRow label="SOCSO / PERKESO" line={result.socso} />
            <DeductionRow label="EIS / SIP" line={result.eis} />
            <DeductionRow
              label="Income tax (PCB)"
              line={result.monthlyTax}
              note={`est. ${result.meta.yearOfAssessment} · chargeable ${formatRm(
                result.annual.chargeableIncome,
              )}/yr`}
            />
          </div>

          <Separator className="my-4" />

          <div className="flex items-baseline justify-between gap-4">
            <p className="text-sm text-muted-foreground">Total employee deductions</p>
            <p className="font-mono text-sm tabular text-foreground">
              −{formatRmPrecise(result.monthlyEmployeeDeductions)}
            </p>
          </div>
          <div className="mt-1 flex items-baseline justify-between gap-4">
            <p className="text-sm text-muted-foreground">Full cost to employer</p>
            <p className="font-mono text-sm tabular text-foreground">
              {formatRmPrecise(result.employerMonthlyCost)}
            </p>
          </div>
        </div>
      </div>

      <p className="border-t border-border px-6 py-3 text-xs text-muted-foreground sm:px-8">
        Estimate for Malaysian citizens/PRs. Statutory rates as of{" "}
        {result.meta.epfAsOf} (EPF) and {result.meta.yearOfAssessment} (tax); SOCSO/EIS use
        the effective-percentage method. Not an official LHDN PCB computation.
      </p>
    </div>
  );
}

function SettingRow({
  label,
  description,
  checked,
  onCheckedChange,
  className,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn("flex items-center justify-between gap-4 py-3", className)}>
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm text-foreground">
          {label}
        </label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
