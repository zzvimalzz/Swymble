import type { Metadata } from "next";

import { routes } from "@/config/navigation";
import { FinanceHub } from "@/features/finance";

export const metadata: Metadata = {
  title: routes.finance.label,
  description: routes.finance.description,
};

export default function FinancePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <header className="mb-10 max-w-2xl">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Finance · your money, the Malaysian way
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          The numbers behind your money
        </h1>
        <p className="mt-4 text-base text-muted-foreground">
          Salary take-home, loan repayments, savings growth, and live ringgit conversion —
          one place, honest estimates, every statutory rate sourced and dated.
        </p>
      </header>

      <FinanceHub />
    </div>
  );
}
