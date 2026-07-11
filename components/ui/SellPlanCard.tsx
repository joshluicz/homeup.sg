"use client";

import { HydrationSafeNumberFlow } from "@/components/ui/HydrationSafeNumberFlow";
import { Check } from "lucide-react";
import { ListingPlatformIcons } from "@/components/ui/ListingPlatformIcons";
import { cn } from "@/lib/utils";
import {
  SELL_PLANS,
  SELL_THEME_STYLES,
  type SellPropertyType,
} from "@/lib/data/sell-pricing";
import { buildSellPlanWhatsAppUrl } from "@/lib/whatsapp";

const PACKAGE_FEATURES = [
  { id: "consultation", label: "Full agent services" },
  { id: "listing", label: "List on" },
  { id: "documentation", label: "Full documentation (e.g. OTP)" },
] as const;

interface SellPlanCardProps {
  filterType: SellPropertyType;
  showLearnMore?: boolean;
  learnMoreHref?: string;
  className?: string;
  reserveFootnoteSpace?: boolean;
}

export function SellPlanCard({
  filterType,
  showLearnMore = false,
  learnMoreHref,
  className,
  reserveFootnoteSpace = false,
}: SellPlanCardProps) {
  const plan = SELL_PLANS.find((p) => p.type === filterType);
  if (!plan) return null;

  const t = SELL_THEME_STYLES[plan.theme];

  return (
    <div
      className={cn(
        "relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white",
        t.border,
        t.shadow,
        className,
      )}
    >
      <div className={cn("shrink-0 p-6 pb-5", t.header)}>
        <div className="flex min-h-6 items-center">
          <span
            className={cn(
              "inline-flex rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide",
              t.badgeSolid,
            )}
          >
            {plan.tag}
          </span>
        </div>
        <h3 className="mt-3 min-h-7 text-lg font-semibold leading-tight text-neutral-900">{plan.name}</h3>
        <div className="mt-3 flex min-h-10 items-baseline gap-x-1.5">
          <span className={cn("font-display text-4xl font-bold leading-none tracking-tight", t.price)}>
            $
            <HydrationSafeNumberFlow format={{ style: "decimal" }} value={plan.price} />
            <sup
              className={cn("ml-0.5 align-super text-xl font-bold", !plan.footnote && "invisible")}
              aria-hidden={!plan.footnote}
            >
              *
            </sup>
          </span>
          <span className="text-sm font-medium text-neutral-500">+ GST</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-6 pb-6">
        <div className="mb-5 h-px bg-neutral-100" />
        <ul className="flex-1 space-y-2.5">
          {PACKAGE_FEATURES.map((feature) => (
            <li key={feature.id} className="flex items-start gap-2.5 text-sm text-neutral-700">
              <span
                className={cn(
                  "mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full",
                  t.checkBg,
                )}
              >
                <Check aria-hidden="true" className={cn("h-3 w-3", t.check)} strokeWidth={3} />
              </span>
              <span className="flex flex-wrap items-center">
                {feature.id === "listing" ? (
                  <>
                    List on
                    <ListingPlatformIcons />
                  </>
                ) : (
                  feature.label
                )}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-col gap-2.5">
          <a
            href={buildSellPlanWhatsAppUrl(plan.name)}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex min-h-12 items-center justify-center rounded-lg px-3 py-2.5 text-center text-xs font-semibold leading-tight transition-all duration-200 sm:text-sm",
              t.cta,
            )}
          >
            {plan.buttonText}
          </a>
          {showLearnMore && learnMoreHref && (
            <a
              href={learnMoreHref}
              className={cn(
                "flex min-h-10 items-center justify-center rounded-lg border px-3 py-2.5 text-center text-xs font-semibold leading-tight transition-all duration-200 sm:text-sm",
                t.ctaOutline,
              )}
            >
              Learn more
            </a>
          )}
        </div>
        {(plan.footnote || reserveFootnoteSpace) && (
          <p
            className={cn(
              "mt-4 text-[11px] font-normal leading-snug text-neutral-500",
              reserveFootnoteSpace && "min-h-8",
            )}
          >
            {plan.footnote && (
              <>
                <span aria-hidden="true">*</span> {plan.footnote}
              </>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
