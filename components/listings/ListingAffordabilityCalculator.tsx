"use client";

import { useMemo, useState } from "react";
import { Calculator, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  calculateMortgage,
  clampLoanAmount,
  defaultInterestRate,
  defaultLoanTenureYears,
  formatSgd,
  MAX_LOAN_TO_VALUE,
  maxLoanAmount,
} from "@/lib/listings/mortgage";
import type { FlatType } from "@/lib/listings/types";
import { cn } from "@/lib/utils";

type Props = {
  propertyPrice: number;
  flatType: FlatType;
};

function MoneyField({
  id,
  label,
  value,
  onChange,
  prefix = "S$",
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-neutral-600">
        {label}
      </Label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">
          {prefix}
        </span>
        <Input
          id={id}
          type="number"
          min={0}
          step={1000}
          value={value || ""}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
          className="rounded-xl border-neutral-200 pl-10 text-sm"
        />
      </div>
    </div>
  );
}

function BreakdownBar({
  primaryLabel,
  primaryValue,
  primaryPct,
  secondaryLabel,
  secondaryValue,
  secondaryPct,
  primaryClassName,
  secondaryClassName,
}: {
  primaryLabel: string;
  primaryValue: string;
  primaryPct: number;
  secondaryLabel: string;
  secondaryValue: string;
  secondaryPct: number;
  primaryClassName: string;
  secondaryClassName: string;
}) {
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-neutral-100">
        <div className={cn("transition-all duration-300", primaryClassName)} style={{ width: `${primaryPct}%` }} />
        <div
          className={cn("transition-all duration-300", secondaryClassName)}
          style={{ width: `${secondaryPct}%` }}
        />
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div className="flex items-center gap-2 text-sm">
          <span className={cn("h-2.5 w-2.5 rounded-full", primaryClassName)} />
          <span className="text-neutral-500">{primaryLabel}</span>
          <span className="font-semibold text-neutral-800">
            {primaryPct}% · {primaryValue}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className={cn("h-2.5 w-2.5 rounded-full", secondaryClassName)} />
          <span className="text-neutral-500">{secondaryLabel}</span>
          <span className="font-semibold text-neutral-800">
            {secondaryPct}% · {secondaryValue}
          </span>
        </div>
      </div>
    </div>
  );
}

export function ListingAffordabilityCalculator({ propertyPrice, flatType }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [propertyPriceInput, setPropertyPriceInput] = useState(propertyPrice);
  const [loanAmount, setLoanAmount] = useState(maxLoanAmount(propertyPrice));
  const [interestRate, setInterestRate] = useState(defaultInterestRate());
  const [loanTenureYears, setLoanTenureYears] = useState(defaultLoanTenureYears(flatType));

  const result = useMemo(
    () =>
      calculateMortgage({
        propertyPrice: propertyPriceInput,
        loanAmount,
        annualInterestRate: interestRate,
        loanTenureYears,
      }),
    [propertyPriceInput, loanAmount, interestRate, loanTenureYears],
  );

  const loanShare = propertyPriceInput > 0 ? Math.round((loanAmount / propertyPriceInput) * 100) : 0;
  const downShare = 100 - loanShare;

  const resetToListing = () => {
    setPropertyPriceInput(propertyPrice);
    setLoanAmount(maxLoanAmount(propertyPrice));
    setInterestRate(defaultInterestRate());
    setLoanTenureYears(defaultLoanTenureYears(flatType));
  };

  return (
    <section aria-label="Affordability calculator" className="border-t border-neutral-100 bg-neutral-50 py-10 sm:py-12">
      <div className="container-page">
        <h2 className="font-display text-xl font-bold text-neutral-900 sm:text-2xl">Affordability</h2>

        <div className="mt-5 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <Calculator className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-neutral-900">Can I afford this property?</p>
                <p className="mt-1 text-sm text-neutral-500">
                  Estimate monthly repayments and upfront costs for this listing.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setExpanded((value) => !value)}
              className="shrink-0 rounded-xl"
            >
              {expanded ? "Hide calculator" : "Check affordability"}
            </Button>
          </div>

          {expanded && (
            <div className="mt-8 grid gap-8 lg:grid-cols-2">
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                    Est. monthly repayment
                  </p>
                  <p className="mt-1 font-display text-3xl font-extrabold text-neutral-900">
                    {formatSgd(result.monthlyRepayment)}
                    <span className="text-base font-semibold text-neutral-400"> / mo</span>
                  </p>
                </div>

                <div>
                  <p className="mb-3 text-sm font-semibold text-neutral-700">Mortgage breakdown</p>
                  <BreakdownBar
                    primaryLabel="Principal"
                    primaryValue={formatSgd(result.totalPrincipal)}
                    primaryPct={result.principalShare}
                    secondaryLabel="Interest"
                    secondaryValue={formatSgd(result.totalInterest)}
                    secondaryPct={result.interestShare}
                    primaryClassName="bg-blue-500"
                    secondaryClassName="bg-teal-700"
                  />
                </div>

                <div>
                  <p className="mb-3 text-sm font-semibold text-neutral-700">Upfront costs</p>
                  <p className="text-sm text-neutral-500">
                    Total downpayment{" "}
                    <span className="font-semibold text-neutral-800">{formatSgd(result.downpayment)}</span>
                  </p>
                  <div className="mt-3">
                    <BreakdownBar
                      primaryLabel="Downpayment"
                      primaryValue={formatSgd(result.downpayment)}
                      primaryPct={downShare}
                      secondaryLabel="Loan"
                      secondaryValue={formatSgd(loanAmount)}
                      secondaryPct={loanShare}
                      primaryClassName="bg-primary-500"
                      secondaryClassName="bg-neutral-300"
                    />
                  </div>
                </div>

                <p className="flex items-center gap-2 text-sm text-primary-700">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  Indicative estimate only. Loan capped at {MAX_LOAN_TO_VALUE * 100}% LTV; actual
                  rates depend on your bank and profile.
                </p>

                <Button type="button" variant="outline" onClick={resetToListing} className="rounded-xl">
                  Reset to listing price
                </Button>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
                <p className="mb-5 text-sm font-semibold text-neutral-900">Loan details</p>
                <div className="space-y-4">
                  <MoneyField
                    id="affordability-price"
                    label="Property price"
                    value={propertyPriceInput}
                    onChange={(value) => {
                      setPropertyPriceInput(value);
                      setLoanAmount(clampLoanAmount(value, loanAmount));
                    }}
                  />
                  <div className="space-y-2">
                    <MoneyField
                      id="affordability-loan"
                      label="Loan amount (max 75%)"
                      value={loanAmount}
                      onChange={(value) =>
                        setLoanAmount(clampLoanAmount(propertyPriceInput, value))
                      }
                    />
                    <p className="text-xs text-neutral-500">
                      Maximum loan: {formatSgd(maxLoanAmount(propertyPriceInput))} (
                      {MAX_LOAN_TO_VALUE * 100}% of property price)
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="affordability-rate" className="text-neutral-600">
                        Interest rate
                      </Label>
                      <div className="relative">
                        <Input
                          id="affordability-rate"
                          type="number"
                          min={0}
                          max={20}
                          step={0.1}
                          value={interestRate}
                          onChange={(e) => setInterestRate(Math.max(0, Number(e.target.value) || 0))}
                          className="rounded-xl border-neutral-200 pr-8 text-sm"
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">
                          %
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="affordability-tenure" className="text-neutral-600">
                        Loan tenure
                      </Label>
                      <div className="relative">
                        <Input
                          id="affordability-tenure"
                          type="number"
                          min={1}
                          max={35}
                          step={1}
                          value={loanTenureYears}
                          onChange={(e) =>
                            setLoanTenureYears(Math.max(1, Math.min(35, Number(e.target.value) || 1)))
                          }
                          className="rounded-xl border-neutral-200 pr-10 text-sm"
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">
                          yrs
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
