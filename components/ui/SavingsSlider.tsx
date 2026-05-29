"use client";
import NumberFlow from "@number-flow/react";
import { useState } from "react";

const MIN = 300_000;
const MAX = 6_000_000;
const STEP = 50_000;

type PropertyType = "HDB" | "Condo" | "Landed";

const FEES: Record<PropertyType, { fee: number; label: string }> = {
  HDB:    { fee: 1_999,  label: "HDB Flat" },
  Condo:  { fee: 4_999,  label: "Condo / EC" },
  Landed: { fee: 9_999,  label: "Landed Property" },
};

const TYPES: PropertyType[] = ["HDB", "Condo", "Landed"];

function formatSGD(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  return `$${(value / 1_000).toFixed(0)}k`;
}

export function SavingsSlider() {
  const [propertyType, setPropertyType] = useState<PropertyType>("HDB");
  const [propertyValue, setPropertyValue] = useState(500_000);

  const clamp = (v: number) => Math.min(MAX, Math.max(MIN, v));

  const homeupFee  = FEES[propertyType].fee;
  const typicalFee = Math.round(propertyValue * 0.02);
  const savings    = typicalFee - homeupFee;
  const pct        = ((propertyValue - MIN) / (MAX - MIN)) * 100;

  return (
    <div className="mt-12 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      {/* Top band */}
      <div className="border-b border-neutral-100 bg-neutral-50 px-8 py-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
          Savings Calculator
        </p>
        <h3 className="mt-1 font-display text-2xl font-bold text-neutral-900">
          How much will you save?
        </h3>
        <p className="mt-1 text-sm text-neutral-500">
          Select your property type and enter its value to see your exact savings.
        </p>
      </div>

      <div className="px-8 py-8">
        {/* ── Property type toggle ── */}
        <div className="mb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-neutral-400">
            I am selling a…
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
              className="w-36 rounded-xl border border-neutral-200 px-4 py-1.5 text-right font-mono text-sm font-bold text-neutral-900 transition-colors focus:border-primary-500 focus:outline-none"
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

        {/* ── Three-column comparison ── */}
        <div className="mt-7 grid grid-cols-3 gap-3">
          {/* HomeUP fee */}
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
              HomeUP fee
            </p>
            <p className="mt-2 font-mono text-2xl font-bold text-neutral-900">
              S$<NumberFlow value={homeupFee} format={{ style: "decimal" }} />
            </p>
            <p className="mt-1 text-xs text-neutral-400">fixed · {propertyType}</p>
          </div>

          {/* Typical 2% — faded red */}
          <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-center opacity-60">
            <p className="text-xs font-medium uppercase tracking-wider text-red-400">
              Typical 2%
            </p>
            <p className="mt-2 font-mono text-2xl font-bold text-red-400 line-through decoration-red-300">
              S$<NumberFlow value={typicalFee} format={{ style: "decimal" }} />
            </p>
            <p className="mt-1 text-xs text-red-300">commission</p>
          </div>

          {/* Savings — green */}
          <div className="rounded-xl border border-primary-200 bg-primary-50 p-4 text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-primary-600">
              You save
            </p>
            <p className="mt-2 font-mono text-2xl font-bold text-primary-600">
              S$<NumberFlow value={Math.max(0, savings)} format={{ style: "decimal" }} />
            </p>
            <p className="mt-1 text-xs text-primary-400">with HomeUP</p>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-neutral-400">
          Calculation uses a 2% agent commission. Actual savings vary by negotiated rate.
          GST applicable on HomeUP fees.
        </p>
      </div>
    </div>
  );
}
