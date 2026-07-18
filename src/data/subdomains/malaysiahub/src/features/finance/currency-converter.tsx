"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchFxRates, type FxSnapshot } from "@/services/fx-client";

import { NumberField } from "./calc-ui";
import { CONVERT_CURRENCIES, convertCurrency, type ConvertCurrency } from "./lib/currency";

const NAMES: Record<ConvertCurrency, string> = {
  MYR: "Malaysian Ringgit",
  USD: "US Dollar",
  EUR: "Euro",
  SGD: "Singapore Dollar",
  GBP: "British Pound",
  JPY: "Japanese Yen",
  CNY: "Chinese Yuan",
};

const money = (n: number, code: ConvertCurrency) =>
  new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: code,
    maximumFractionDigits: 2,
  }).format(n);

function CurrencySelect({
  value,
  onChange,
  exclude,
}: {
  value: ConvertCurrency;
  onChange: (v: ConvertCurrency) => void;
  exclude?: ConvertCurrency;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as ConvertCurrency)}>
      <SelectTrigger className="w-full font-mono">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CONVERT_CURRENCIES.filter((c) => c !== exclude).map((c) => (
          <SelectItem key={c} value={c}>
            <span className="font-mono font-medium">{c}</span>
            <span className="ml-2 text-muted-foreground">{NAMES[c]}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Live currency conversion over ECB reference rates (Frankfurter). */
export function CurrencyConverter() {
  const [amount, setAmount] = useState(100);
  const [from, setFrom] = useState<ConvertCurrency>("USD");
  const [to, setTo] = useState<ConvertCurrency>("MYR");
  const [snapshot, setSnapshot] = useState<FxSnapshot | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;
    fetchFxRates()
      .then((snap) => {
        if (!active) return;
        setSnapshot(snap);
        setStatus("ready");
      })
      .catch(() => active && setStatus("error"));
    return () => {
      active = false;
    };
  }, []);

  const result = useMemo(
    () => (snapshot ? convertCurrency(amount, from, to, snapshot) : null),
    [amount, from, to, snapshot],
  );
  const unitRate = useMemo(
    () => (snapshot ? convertCurrency(1, from, to, snapshot) : null),
    [from, to, snapshot],
  );

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-raised sm:p-8">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
        <div className="space-y-2.5">
          <NumberField label="Amount" defaultValue={amount} onChange={setAmount} decimal />
          <CurrencySelect value={from} onChange={setFrom} exclude={to} />
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={swap}
          aria-label="Swap currencies"
          className="mb-1 shrink-0 justify-self-center rounded-full"
        >
          <ArrowLeftRight className="size-4" aria-hidden />
        </Button>

        <div className="space-y-2.5">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Converts to
          </p>
          {status === "loading" ? (
            <Skeleton className="h-9 w-40" />
          ) : status === "error" || result === null ? (
            <p className="font-display text-2xl text-muted-foreground">Rate unavailable</p>
          ) : (
            <p className="font-display text-3xl font-semibold tracking-tight text-brand-songket tabular sm:text-4xl">
              {money(result, to)}
            </p>
          )}
          <CurrencySelect value={to} onChange={setTo} exclude={from} />
        </div>
      </div>

      <p className="mt-6 border-t border-border pt-4 font-mono text-xs text-muted-foreground">
        {status === "ready" && unitRate !== null && snapshot ? (
          <>
            1 {from} = {unitRate} {to} · ECB reference via Frankfurter · {snapshot.date}
          </>
        ) : status === "loading" ? (
          "Fetching latest rates…"
        ) : (
          "Live rates are temporarily unavailable — try again shortly."
        )}
      </p>
    </div>
  );
}
