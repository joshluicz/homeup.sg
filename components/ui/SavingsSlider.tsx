"use client";
import NumberFlow from "@number-flow/react";
import { useState } from "react";
import { ParticleButton } from "@/components/ui/particle-button";
import { cn } from "@/lib/utils";

const MIN = 300_000;
const MAX = 6_000_000;
const STEP = 50_000;

type PropertyType = "HDB" | "Condo" | "Landed";

interface FeeConfig {
  fee: number;
  label: string;
  /** When true, the fee is shown as "Complimentary" instead of a dollar value. */
  complimentary?: boolean;
}

const SELL_FEES: Record<PropertyType, FeeConfig> = {
  HDB:    { fee: 1_999, label: "HDB Flat" },
  Condo:  { fee: 4_999, label: "Condo / EC" },
  Landed: { fee: 9_999, label: "Landed Property" },
};

const BUY_FEES: Record<PropertyType, FeeConfig> = {
  HDB:    { fee: 1_999, label: "HDB Flat" },
  Condo:  { fee: 0, label: "Condo / EC", complimentary: true },
  Landed: { fee: 0, label: "Landed Property", complimentary: true },
};

const TYPES: PropertyType[] = ["HDB", "Condo", "Landed"];

function formatSGD(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  return `$${(value / 1_000).toFixed(0)}k`;
}

interface SavingsSliderProps {
  mode?: "sell" | "buy";
  className?: string;
}

export function SavingsSlider({ mode = "sell", className = "mt-12" }: SavingsSliderProps) {
  const isBuy = mode === "buy";
  const FEES = isBuy ? BUY_FEES : SELL_FEES;

  const [propertyType, setPropertyType] = useState<PropertyType>("HDB");
  const [propertyValue, setPropertyValue] = useState(500_000);

  const clamp = (v: number) => Math.min(MAX, Math.max(MIN, v));

  const homeupFee     = FEES[propertyType].fee;
  const complimentary = FEES[propertyType].complimentary ?? false;
  const typicalRate   = isBuy ? 0.01 : 0.02;
  const typicalFee    = Math.round(propertyValue * typicalRate);
  const savings       = typicalFee - homeupFee;
  const pct           = ((propertyValue - MIN) / (MAX - MIN)) * 100;
  const savingsPct    = typicalFee > 0 ? Math.round((Math.max(0, savings) / typicalFee) * 100) : 0;

  return (
    <div className={["overflow-hidden rounded-3xl ring-1 ring-black/[0.06] shadow-2xl shadow-black/[0.08]", className].filter(Boolean).join(" ")}>

      {/* ── Dark header ── */}
      <div className="relative overflow-hidden bg-neutral-900 px-6 py-8 sm:px-10 sm:py-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary-600/20 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-primary-600/12 blur-2xl" aria-hidden="true" />

        <div className="relative z-10">
          <span className="inline-flex items-center rounded-full bg-primary-600/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary-400 ring-1 ring-primary-500/30">
            {isBuy ? "Buying Fee Calculator" : "Savings Calculator"}
          </span>
          <h3 className="mt-4 font-display text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl">
            {isBuy ? "What will it cost to buy?" : "How much will you save?"}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-neutral-400">
            {isBuy
              ? "Select the property type you're buying to see your transparent HOMEUP fee."
              : "Select your property type and enter its value to see your exact savings."}
          </p>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="bg-white px-6 py-8 sm:px-10 sm:py-9">

        {/* Property type toggle — segmented control */}
        <div className="mb-7">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-400">
            {isBuy ? "I am buying a…" : "I am selling a…"}
          </p>
          <div className="flex gap-1 rounded-xl bg-neutral-100 p-1">
            {TYPES.map((t) => (
              <ParticleButton
                key={t}
                showIcon={false}
                successDuration={600}
                onClick={() => setPropertyType(t)}
                className={cn(
                  "flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1",
                  propertyType === t
                    ? "bg-white text-neutral-900 shadow shadow-black/10"
                    : "text-neutral-500 hover:text-neutral-700",
                )}
              >
                {t}
              </ParticleButton>
            ))}
          </div>
        </div>

        {/* Property value label + input */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <span className="text-sm font-medium text-neutral-500">Property value</span>
          <div className="flex items-center gap-1.5 rounded-xl bg-neutral-100 px-3 py-2 transition-shadow focus-within:ring-2 focus-within:ring-primary-500">
            <span className="text-sm font-semibold text-neutral-400">S$</span>
            <input
              type="number"
              min={MIN}
              max={MAX}
              step={STEP}
              value={propertyValue}
              onChange={(e) => {
                const raw = Number(e.target.value);
                if (!isNaN(raw)) setPropertyValue(clamp(raw));
              }}
              onBlur={(e) => {
                const raw = Number(e.target.value);
                setPropertyValue(clamp(isNaN(raw) ? MIN : raw));
              }}
              className="w-28 bg-transparent text-right font-display text-sm font-bold text-neutral-900 focus:outline-none"
              aria-label="Property value in SGD"
            />
          </div>
        </div>

        {/* Range slider */}
        <input
          type="range"
          min={MIN}
          max={MAX}
          step={STEP}
          value={propertyValue}
          onChange={(e) => setPropertyValue(Number(e.target.value))}
          className="savings-slider w-full"
          style={{ "--slider-pct": `${pct}%` } as React.CSSProperties}
          aria-label="Property value slider"
        />
        <div className="mt-2.5 flex justify-between text-xs font-medium text-neutral-400">
          <span>{formatSGD(MIN)}</span>
          <span>{formatSGD(MAX)}</span>
        </div>

        {isBuy && complimentary ? (
          /* ── Complimentary (Condo / Landed buy) ── */
          <div className="mt-8 overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 p-8 text-center shadow-lg shadow-primary-600/25">
            <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary-100 ring-1 ring-white/20">
              Your HOMEUP buying fee
            </span>
            <p
              className="mt-4 font-display font-black tracking-tight text-white"
              style={{ fontSize: "clamp(2rem, 7vw, 3rem)" }}
            >
              Complimentary
            </p>
            <p className="mt-2 text-sm text-primary-200">
              {propertyType} purchase · fully covered by HOMEUP
            </p>
          </div>
        ) : (
          /* ── Comparison (sell mode or HDB buy) ── */
          <>
            {/* Two supporting cards */}
            <div className="mt-8 grid grid-cols-2 gap-3">
              {/* HOMEUP fee */}
              <div className="flex flex-col gap-1 rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">HOMEUP fee</p>
                <p className="font-display text-xl font-bold text-neutral-900 sm:text-2xl">
                  S$<NumberFlow value={homeupFee} format={{ style: "decimal" }} />
                </p>
                <p className="text-xs text-neutral-400">fixed · {propertyType}</p>
              </div>

              {/* Typical commission */}
              <div className="flex flex-col gap-1 rounded-2xl border border-red-100 bg-red-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-red-400">
                  Typical {isBuy ? "1%" : "2%"}
                </p>
                <p className="font-display text-xl font-bold text-red-400 sm:text-2xl">
                  S$<NumberFlow value={typicalFee} format={{ style: "decimal" }} />
                </p>
                <p className="text-xs text-red-300">{isBuy ? "buyer agent fee" : "commission"}</p>
              </div>
            </div>

            {/* You Save — hero card */}
            <div className="mt-3 overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 px-6 py-6 shadow-lg shadow-primary-600/20">
              <p className="text-center text-xs font-semibold uppercase tracking-widest text-primary-200">
                You save with HOMEUP
              </p>
              <p
                className="mt-2 text-center font-display font-black tracking-tight text-white"
                style={{ fontSize: "clamp(2rem, 7vw, 3rem)" }}
              >
                S$<NumberFlow value={Math.max(0, savings)} format={{ style: "decimal" }} />
              </p>

              {/* Savings progress bar */}
              <div className="mt-5 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-primary-800/50">
                  <div
                    className="h-full rounded-full bg-white/70 transition-all duration-500 ease-out"
                    style={{ width: `${savingsPct}%` }}
                    role="progressbar"
                    aria-valuenow={savingsPct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
                <span className="shrink-0 text-xs font-bold tabular-nums text-primary-200">
                  {savingsPct}% saved
                </span>
              </div>
            </div>
          </>
        )}

        <p className="mt-5 text-center text-xs text-neutral-400">
          {isBuy
            ? "Buyer representation fees shown are indicative. GST applicable on HOMEUP fees."
            : "Calculation uses a 2% agent commission. Actual savings vary by negotiated rate. GST applicable on HOMEUP fees."}
        </p>
      </div>
    </div>
  );
}
