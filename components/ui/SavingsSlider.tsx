"use client";
import NumberFlow from "@number-flow/react";
import { useState } from "react";

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
}

export function SavingsSlider({ mode = "sell" }: SavingsSliderProps) {
  const isBuy = mode === "buy";
  const FEES = isBuy ? BUY_FEES : SELL_FEES;

  const [propertyType, setPropertyType] = useState<PropertyType>("HDB");
  const [propertyValue, setPropertyValue] = useState(500_000);

  const clamp = (v: number) => Math.min(MAX, Math.max(MIN, v));

  const homeupFee     = FEES[propertyType].fee;
  const complimentary = FEES[propertyType].complimentary ?? false;
  // Buyer's agent fee for HDB is typically 1%; seller is typically 2%
  const typicalRate   = isBuy ? 0.01 : 0.02;
  const typicalFee    = Math.round(propertyValue * typicalRate);
  const savings       = typicalFee - homeupFee;
  const pct           = ((propertyValue - MIN) / (MAX - MIN)) * 100;

  return (
    <div className="mt-12 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      {/* Top band */}
      <div className="border-b border-neutral-100 bg-neutral-50 px-8 py-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
          {isBuy ? "Buying Fee Calculator" : "Savings Calculator"}
        </p>
        <h3 className="mt-1 font-display text-2xl font-bold text-neutral-900">
          {isBuy ? "What will it cost to buy?" : "How much will you save?"}
        </h3>
        <p className="mt-1 text-sm text-neutral-500">
          {isBuy
            ? "Select the property type you're buying to see your transparent HomeUP fee."
            : "Select your property type and enter its value to see your exact savings."}
        </p>
      </div>

      <div className="px-8 py-8">
        {/* ── Property type toggle ── */}
        <div className="mb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-neutral-400">
            {isBuy ? "I am buying a…" : "I am selling a…"}
          </p>
          <div className="flex gap-2">
            {TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setPropertyType(t)}
                className={[
                  "flex-1 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all",
                  propertyType === t
                    ? "border-primary-600 bg-primary-600 text-white shadow-sm"
                    : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50",
                ].join(" ")}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* ── Property value label + type-in input ── */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <span className="text-sm font-medium text-neutral-600">Property value</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-neutral-500">S$</span>
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
              className="w-36 rounded-xl border border-neutral-200 px-4 py-1.5 text-right font-display text-sm font-bold text-neutral-900 transition-colors focus:border-primary-500 focus:outline-none"
              aria-label="Property value in SGD"
            />
          </div>
        </div>

        {/* ── Range slider ── */}
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
        <div className="mt-2 flex justify-between text-xs text-neutral-400">
          <span>{formatSGD(MIN)}</span>
          <span>{formatSGD(MAX)}</span>
        </div>

        {isBuy && complimentary ? (
          /* ── Buy mode (Condo / Landed): complimentary ── */
          <div className="mt-7">
            <div className="flex flex-col items-center rounded-xl border border-primary-200 bg-primary-50 p-6 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-primary-600">
                Your HomeUP buying fee
              </p>
              <p className="mt-2 font-display font-bold tracking-tight text-primary-600"
                 style={{ fontSize: "clamp(1.5rem, 5vw, 2.25rem)" }}>
                Complimentary
              </p>
              <p className="mt-1 text-xs text-primary-400">
                {propertyType} purchase · fully covered
              </p>
            </div>
          </div>
        ) : (
          /* ── Sell mode: three-column comparison ── */
          <div className="mt-7 grid grid-cols-3 gap-3">
            {/* HomeUP fee */}
            <div className="flex flex-col items-center rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                HomeUP fee
              </p>
              <p className="mt-2 flex items-baseline justify-center font-display font-bold tracking-tight text-neutral-900"
                 style={{ fontSize: "clamp(0.9rem, 4vw, 1.5rem)" }}>
                S$<NumberFlow value={homeupFee} format={{ style: "decimal" }} />
              </p>
              <p className="mt-1 text-xs text-neutral-400">fixed · {propertyType}</p>
            </div>

            {/* Typical commission — faded red */}
            <div className="flex flex-col items-center rounded-xl border border-red-100 bg-red-50 p-4 text-center opacity-60">
              <p className="text-xs font-medium uppercase tracking-wider text-red-400">
                Typical {isBuy ? "1%" : "2%"}
              </p>
              <p className="mt-2 flex items-baseline justify-center font-display font-bold tracking-tight text-red-400"
                 style={{ fontSize: "clamp(0.9rem, 4vw, 1.5rem)" }}>
                S$<NumberFlow value={typicalFee} format={{ style: "decimal" }} />
              </p>
              <p className="mt-1 text-xs text-red-300">{isBuy ? "buyer agent fee" : "commission"}</p>
            </div>

            {/* Savings — green */}
            <div className="flex flex-col items-center rounded-xl border border-primary-200 bg-primary-50 p-4 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-primary-600">
                You save
              </p>
              <p className="mt-2 flex items-baseline justify-center font-display font-bold tracking-tight text-primary-600"
                 style={{ fontSize: "clamp(0.9rem, 4vw, 1.5rem)" }}>
                S$<NumberFlow value={Math.max(0, savings)} format={{ style: "decimal" }} />
              </p>
              <p className="mt-1 text-xs text-primary-400">with HomeUP</p>
            </div>
          </div>
        )}

        <p className="mt-5 text-center text-xs text-neutral-400">
          {isBuy
            ? "Buyer representation fees shown are indicative. GST applicable on HomeUP fees."
            : "Calculation uses a 2% agent commission. Actual savings vary by negotiated rate. GST applicable on HomeUP fees."}
        </p>
      </div>
    </div>
  );
}
