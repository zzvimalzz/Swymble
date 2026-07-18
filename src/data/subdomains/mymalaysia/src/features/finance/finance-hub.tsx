"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeftRight, Banknote, PiggyBank, Receipt } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fadeIn, fadeUp } from "@/lib/motion";

import { CurrencyConverter } from "./currency-converter";
import { LoanCalculator } from "./loan-calculator";
import { SalaryCalculator } from "./salary-calculator";
import { SavingsCalculator } from "./savings-calculator";

interface Tool {
  value: string;
  label: string;
  icon: LucideIcon;
  render: () => React.ReactNode;
}

const TOOLS: Tool[] = [
  { value: "salary", label: "Salary", icon: Receipt, render: () => <SalaryCalculator /> },
  { value: "loan", label: "Loan", icon: Banknote, render: () => <LoanCalculator /> },
  { value: "savings", label: "Savings", icon: PiggyBank, render: () => <SavingsCalculator /> },
  {
    value: "currency",
    label: "Currency",
    icon: ArrowLeftRight,
    render: () => <CurrencyConverter />,
  },
];

/** The Finance hub: one tabbed workspace over every money calculator. */
export function FinanceHub() {
  const reducedMotion = useReducedMotion();

  return (
    <Tabs defaultValue="salary" className="gap-6">
      <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-muted/60 p-1">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <TabsTrigger key={tool.value} value={tool.value} className="gap-1.5">
              <Icon className="size-4" aria-hidden />
              {tool.label}
            </TabsTrigger>
          );
        })}
      </TabsList>

      {TOOLS.map((tool) => (
        <TabsContent key={tool.value} value={tool.value}>
          <motion.div
            variants={reducedMotion ? fadeIn : fadeUp}
            initial="hidden"
            animate="visible"
          >
            {tool.render()}
          </motion.div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
