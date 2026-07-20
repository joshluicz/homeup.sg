"use client";

import { useMemo, useState } from "react";
import { SELL_PLANS } from "@/lib/data/sell-pricing";

const GST = 0.09;
const TYPICAL_COMMISSION = 0.02;

const BANDS = [
  { type: "HDB" as const, min: 300_000, max: 900_000, initial: 500_000 },
  { type: "Condo" as const, min: 700_000, max: 3_000_000, initial: 1_200_000 },
  { type: "Landed" as const, min: 1_500_000, max: 8_000_000, initial: 3_000_000 },
];

const sgd = (n: number) =>
  n.toLocaleString("en-SG", { style: "currency", currency: "SGD", maximumFractionDigits: 0 });

/**
 * Interactive proof of the fee model.
 *
 * Every figure is derived live from SELL_PLANS — the same prices the /sell pages quote — so this
 * cannot drift from published pricing. The comparison is explicitly framed as illustrative: the
 * 2% figure is a market convention, not a rate HomeUP controls or guarantees, and nothing here
 * promises a saving.
 */
export function FeeComparison() {
  const [bandIndex, setBandIndex] = useState(1);
  const band = BANDS[bandIndex];
  const [value, setValue] = useState(band.initial);

  const plan = useMemo(
    () => SELL_PLANS.find((p) => p.type === band.type) ?? SELL_PLANS[0],
    [band.type],
  );

  const commission = value * TYPICAL_COMMISSION;
  const commissionWithGst = commission * (1 + GST);
  const homeupWithGst = plan.price * (1 + GST);
  const difference = commissionWithGst - homeupWithGst;

  function selectBand(i: number) {
    setBandIndex(i);
    setValue(BANDS[i].initial);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap justify-center gap-2">
        {BANDS.map((b, i) => (
          <button
            key={b.type}
            type="button"
            onClick={() => selectBand(i)}
            className={`rounded-full px-5 py-2 text-sm font-medium transition ${
              i === bandIndex
                ? "bg-primary-600 text-white"
                : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
            }`}
          >
            {b.type}
          </button>
        ))}
      </div>

      <div className="mt-10">
        <label className="block text-center">
          <span className="text-xs uppercase tracking-[0.2em] text-white/50">Property value</span>
          <span className="mt-2 block font-display text-5xl font-semibold text-white sm:text-6xl">
            {sgd(value)}
          </span>
          <input
            type="range"
            min={band.min}
            max={band.max}
            step={10_000}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            aria-label={`${band.type} property value`}
            className="mt-6 w-full accent-primary-500"
          />
        </label>
        <p className="mt-2 text-center text-xs text-white/40">Drag to see how the fee model behaves.</p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-white/50">The usual way</p>
          <p className="mt-3 text-sm text-white/60">2% commission, the common market convention</p>
          <p className="mt-6 font-display text-4xl font-semibold text-white tabular-nums">
            {sgd(commissionWithGst)}
          </p>
          <p className="mt-1 text-xs text-white/40">{sgd(commission)} + {Math.round(GST * 100)}% GST</p>
        </div>

        <div className="rounded-3xl border border-primary-400/30 bg-primary-500/10 p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-primary-200">The HomeUP way</p>
          <p className="mt-3 text-sm text-white/70">{plan.name} — a fixed fee, whatever the price</p>
          <p className="mt-6 font-display text-4xl font-semibold text-white tabular-nums">
            {sgd(homeupWithGst)}
          </p>
          <p className="mt-1 text-xs text-white/50">
            {sgd(plan.price)} + {Math.round(GST * 100)}% GST
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] px-8 py-7 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-white/50">Illustrative difference</p>
        <p className="mt-2 font-display text-5xl font-semibold text-white tabular-nums">
          {difference > 0 ? sgd(difference) : "—"}
        </p>
        <p className="mx-auto mt-4 max-w-xl text-xs leading-relaxed text-white/40">
          An illustration, not a quote or a guarantee. Commission is negotiable and varies by agent
          and transaction; 2% is a common market convention, not a rate HomeUP sets. Your actual
          costs depend on your own agreement.
        </p>
      </div>
    </div>
  );
}
