"use client";

import { useEffect, useState } from "react";
import { HydrationSafeNumberFlow } from "@/components/ui/HydrationSafeNumberFlow";
import { ParticleButton } from "@/components/ui/particle-button";
import { cn } from "@/lib/utils";
import {
  BUY_MAX_BY_TYPE,
  BUY_TYPE_LABELS,
  type BuyPropertyType,
} from "@/lib/data/buy-pricing";
import {
  SELL_DEFAULT_BY_TYPE,
  SELL_MAX_BY_TYPE,
  type SellPropertyType,
} from "@/lib/data/sell-pricing";

const MIN = 300_000;
const STEP = 2_000;
const GST_RATE = 0.09;

interface FeeConfig {
  fee: number;
  label: string;
  complimentary?: boolean;
}

const SELL_FEES: Record<SellPropertyType, FeeConfig> = {
  HDB: { fee: 1_999, label: "HDB Flat" },
  Condo: { fee: 4_999, label: "Condo / EC" },
  Landed: { fee: 9_999, label: "Landed Property" },
};

const BUY_FEES: Record<BuyPropertyType, FeeConfig> = {
  HDB: { fee: 1_999, label: "HDB Flat" },
  CondoLanded: { fee: 0, label: "Condo / Landed", complimentary: true },
  NewLaunch: { fee: 0, label: "New Launch", complimentary: true },
};

const SELL_TYPES: SellPropertyType[] = ["HDB", "Condo", "Landed"];
const BUY_TYPES: BuyPropertyType[] = ["HDB", "CondoLanded", "NewLaunch"];

type SliderPalette = "blue" | "green" | "amber";

interface SliderSectionTheme {
  tabRail: string;
  tabInactive: string;
  valueInput: string;
  valuePrefix: string;
  feeCard: string;
  feeCardLabel: string;
  feeCardPrice: string;
  feeCardMeta: string;
  trackInactive: string;
}

const SLIDER_THEMES: Record<SliderPalette, SliderSectionTheme> = {
  blue: {
    tabRail: "bg-slate-50 ring-1 ring-blue-100/80",
    tabInactive: "text-neutral-600 hover:bg-blue-50 hover:text-blue-900",
    valueInput: "bg-slate-50 ring-1 ring-blue-100/80",
    valuePrefix: "text-blue-800",
    feeCard: "border-blue-100 bg-slate-50",
    feeCardLabel: "text-neutral-600",
    feeCardPrice: "text-neutral-900",
    feeCardMeta: "text-neutral-500",
    trackInactive: "#e8eef5",
  },
  green: {
    tabRail: "bg-[#eef5f0] ring-1 ring-[#c5ddd0]",
    tabInactive: "text-primary-800/75 hover:bg-[#e2efe6] hover:text-primary-900",
    valueInput: "bg-[#eef5f0] ring-1 ring-[#c5ddd0]",
    valuePrefix: "text-primary-800",
    feeCard: "border-[#c5ddd0] bg-[#eef5f0]",
    feeCardLabel: "text-primary-800",
    feeCardPrice: "text-neutral-900",
    feeCardMeta: "text-primary-800/65",
    trackInactive: "#d4e8dc",
  },
  amber: {
    tabRail: "bg-amber-50 ring-1 ring-amber-100",
    tabInactive: "text-amber-700/70 hover:bg-amber-100/80 hover:text-amber-900",
    valueInput: "bg-amber-50 ring-1 ring-amber-100",
    valuePrefix: "text-amber-600",
    feeCard: "border-amber-200 bg-amber-50",
    feeCardLabel: "text-amber-700",
    feeCardPrice: "text-amber-950",
    feeCardMeta: "text-amber-700/70",
    trackInactive: "#fef3c7",
  },
};

function paletteForType(
  propertyType: SellPropertyType | BuyPropertyType,
  isBuy: boolean,
): SliderPalette {
  if (isBuy) {
    if (propertyType === "HDB") return "blue";
    if (propertyType === "CondoLanded") return "green";
    return "amber";
  }
  if (propertyType === "HDB") return "blue";
  if (propertyType === "Condo") return "green";
  return "amber";
}

function formatSGD(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  return `$${(value / 1_000).toFixed(0)}k`;
}

function formatAmount(value: number): string {
  return value.toLocaleString("en-SG");
}

function defaultPropertyValue(
  propertyType: SellPropertyType | BuyPropertyType,
  isBuy: boolean,
): number {
  if (!isBuy) {
    return SELL_DEFAULT_BY_TYPE[propertyType as SellPropertyType];
  }
  return 500_000;
}

function withGst(amount: number): number {
  return Math.round(amount * (1 + GST_RATE));
}

function AnimatedAmount({
  value,
  isDragging,
}: {
  value: number;
  isDragging: boolean;
}) {
  if (isDragging) {
    return <>{formatAmount(value)}</>;
  }
  return <HydrationSafeNumberFlow value={value} format={{ style: "decimal" }} />;
}

interface SavingsSliderProps {
  mode?: "sell" | "buy";
  className?: string;
  defaultType?: SellPropertyType | BuyPropertyType;
  /** Hide property-type tabs — use on type-specific sub-pages */
  lockType?: boolean;
  /** Compact layout for embedding in sub-page heroes */
  variant?: "default" | "embedded";
}

export function SavingsSlider({
  mode = "sell",
  className = "mt-12",
  defaultType,
  lockType = false,
  variant = "default",
}: SavingsSliderProps) {
  const isBuy = mode === "buy";
  const initialType = defaultType ?? (isBuy ? "HDB" : "HDB");

  const [propertyType, setPropertyType] = useState<SellPropertyType | BuyPropertyType>(
    initialType,
  );
  const [propertyValue, setPropertyValue] = useState(() =>
    defaultPropertyValue(initialType, isBuy),
  );
  const [inputDraft, setInputDraft] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const max = isBuy
    ? BUY_MAX_BY_TYPE[propertyType as BuyPropertyType]
    : SELL_MAX_BY_TYPE[propertyType as SellPropertyType];

  const clamp = (v: number) => Math.min(max, Math.max(MIN, v));

  const commitInput = (raw: string) => {
    setInputDraft(null);
    const trimmed = raw.trim().replace(/,/g, "");
    if (trimmed === "") {
      setPropertyValue(MIN);
      return;
    }
    const parsed = Number(trimmed);
    if (Number.isNaN(parsed)) {
      setPropertyValue(MIN);
      return;
    }
    setPropertyValue(clamp(Math.round(parsed)));
  };

  useEffect(() => {
    setPropertyValue((v) => Math.min(max, Math.max(MIN, v)));
  }, [max]);

  useEffect(() => {
    if (defaultType) {
      setPropertyType(defaultType);
      setPropertyValue(defaultPropertyValue(defaultType, isBuy));
      setInputDraft(null);
    }
  }, [defaultType, isBuy]);

  const fees = isBuy ? BUY_FEES : SELL_FEES;
  const feeConfig = fees[propertyType as keyof typeof fees];
  const homeupFee = feeConfig.fee;
  const complimentary = feeConfig.complimentary ?? false;
  const typicalRate = isBuy ? 0.01 : 0.02;
  const typicalFee = Math.round(propertyValue * typicalRate);
  const typicalWithGst = withGst(typicalFee);
  const homeupWithGst = withGst(homeupFee);
  const savings = typicalWithGst - homeupWithGst;
  const pct = ((propertyValue - MIN) / (max - MIN)) * 100;
  const savingsPct =
    typicalWithGst > 0 ? Math.round((Math.max(0, savings) / typicalWithGst) * 100) : 0;

  const types = isBuy ? BUY_TYPES : SELL_TYPES;
  const isEmbedded = variant === "embedded";
  const sectionTheme = SLIDER_THEMES[paletteForType(propertyType, isBuy)];
  const inputDisplay = inputDraft ?? formatAmount(propertyValue);

  return (
    <div
      className={[
        "overflow-hidden ring-1 ring-black/[0.06]",
        isEmbedded
          ? "rounded-2xl shadow-md shadow-black/[0.06]"
          : "rounded-3xl shadow-2xl shadow-black/[0.08]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {!isEmbedded && (
        <div className="relative overflow-hidden bg-neutral-900 px-6 py-8 sm:px-10 sm:py-10">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary-600/20 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-primary-600/12 blur-2xl"
            aria-hidden="true"
          />

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
      )}

      <div
        className={cn(
          "bg-white",
          isEmbedded ? "px-5 py-6 sm:px-6 sm:py-7" : "px-6 py-8 sm:px-10 sm:py-9",
        )}
      >
        {isEmbedded && (
          <p className="mb-5 text-sm font-semibold text-neutral-900">
            {isBuy ? "Estimate your buying fee" : "Estimate your savings"}
          </p>
        )}

        {!lockType && (
          <div className="mb-7">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-400">
              {isBuy ? "I am buying a…" : "I am selling a…"}
            </p>
            <div className={cn("flex gap-1 rounded-xl p-1", sectionTheme.tabRail)}>
              {types.map((t) => (
                <ParticleButton
                  key={t}
                  variant="ghost"
                  size="sm"
                  showIcon={false}
                  successDuration={600}
                  onClick={() => {
                    setPropertyType(t);
                    setPropertyValue(defaultPropertyValue(t, isBuy));
                    setInputDraft(null);
                  }}
                  className={cn(
                    "h-auto min-h-0 flex-1 rounded-lg border-0 px-2 py-2.5 text-xs font-semibold shadow-none ring-0 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 sm:px-3 sm:text-sm",
                    propertyType === t
                      ? "bg-primary-600 text-white hover:bg-primary-700 hover:text-white"
                      : sectionTheme.tabInactive,
                  )}
                >
                  {isBuy ? BUY_TYPE_LABELS[t as BuyPropertyType] : t}
                </ParticleButton>
              ))}
            </div>
          </div>
        )}

        <div className="mb-4 flex items-center justify-between gap-4">
          <span className="text-sm font-medium text-neutral-500">Property value</span>
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-2 transition-shadow focus-within:ring-2 focus-within:ring-primary-500",
              sectionTheme.valueInput,
            )}
          >
            <span className={cn("text-sm font-semibold", sectionTheme.valuePrefix)}>S$</span>
            <input
              type="text"
              inputMode="numeric"
              value={inputDisplay}
              onFocus={() => setInputDraft(formatAmount(propertyValue))}
              onChange={(e) => setInputDraft(e.target.value)}
              onBlur={(e) => commitInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.currentTarget.blur();
                }
              }}
              className="w-28 bg-transparent text-right font-display text-sm font-bold text-neutral-900 focus:outline-none"
              aria-label="Property value in SGD"
            />
          </div>
        </div>

        <input
          type="range"
          min={MIN}
          max={max}
          step={STEP}
          value={propertyValue}
          onChange={(e) => {
            setInputDraft(null);
            setPropertyValue(Number(e.target.value));
          }}
          onPointerDown={() => setIsDragging(true)}
          onPointerUp={() => setIsDragging(false)}
          onPointerCancel={() => setIsDragging(false)}
          className="savings-slider w-full"
          style={
            {
              "--slider-pct": `${pct}%`,
              "--slider-track-inactive": sectionTheme.trackInactive,
            } as React.CSSProperties
          }
          aria-label="Property value slider"
        />
        <div className="mt-2.5 flex justify-between text-xs font-medium text-neutral-400">
          <span>{formatSGD(MIN)}</span>
          <span>{formatSGD(max)}</span>
        </div>

        {isBuy && complimentary ? (
          <div className="mt-8 overflow-hidden rounded-2xl border border-[#c5ddd0] bg-[#eef5f0] p-8 text-center">
            <span className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary-800 ring-1 ring-[#c5ddd0]">
              Your HOMEUP buying fee
            </span>
            <p
              className="mt-4 font-display font-black tracking-tight text-primary-700"
              style={{ fontSize: "clamp(2rem, 7vw, 3rem)" }}
            >
              Complimentary
            </p>
            <p className="mt-2 text-sm text-neutral-600">
              {BUY_TYPE_LABELS[propertyType as BuyPropertyType]} purchase · fully covered by
              HOMEUP
            </p>
          </div>
        ) : (
          <>
            <div className="mt-8 grid grid-cols-2 gap-3">
              <div
                className={cn(
                  "flex flex-col gap-1 rounded-2xl border p-4",
                  sectionTheme.feeCard,
                )}
              >
                <p
                  className={cn(
                    "text-xs font-semibold uppercase tracking-wider",
                    sectionTheme.feeCardLabel,
                  )}
                >
                  HOMEUP fee
                </p>
                <p
                  className={cn(
                    "font-display text-xl font-bold sm:text-2xl",
                    sectionTheme.feeCardPrice,
                  )}
                >
                  S$
                  <AnimatedAmount value={homeupFee} isDragging={isDragging} />
                </p>
                <p className={cn("text-xs", sectionTheme.feeCardMeta)}>
                  + GST · fixed · {propertyType}
                </p>
              </div>

              <div className="flex flex-col gap-1 rounded-2xl border border-red-100 bg-red-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-red-400">
                  Typical {isBuy ? "1%" : "2%"}
                </p>
                <p className="font-display text-xl font-bold text-red-400 sm:text-2xl">
                  S$
                  <AnimatedAmount value={typicalFee} isDragging={isDragging} />
                </p>
                <p className="text-xs text-red-300">
                  + GST · {isBuy ? "buyer agent fee" : "commission"}
                </p>
              </div>
            </div>

            <div className="mt-3 overflow-hidden rounded-2xl border border-[#c5ddd0] bg-[#eef5f0] px-6 py-6">
              <p className="text-center text-xs font-semibold uppercase tracking-widest text-primary-800">
                You save with HOMEUP
              </p>
              <p
                className="mt-2 text-center font-display font-black tracking-tight text-primary-700"
                style={{ fontSize: "clamp(2rem, 7vw, 3rem)" }}
              >
                S$
                <AnimatedAmount value={Math.max(0, savings)} isDragging={isDragging} />
              </p>
              <p className="mt-1 text-center text-xs text-neutral-500">
                inclusive of GST on both fees
              </p>

              <div className="mt-5 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#c5ddd0]/70">
                  <div
                    className="h-full rounded-full bg-primary-600 transition-all duration-500 ease-out"
                    style={{ width: `${savingsPct}%` }}
                    role="progressbar"
                    aria-valuenow={savingsPct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
                <span className="shrink-0 text-xs font-bold tabular-nums text-primary-800">
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
