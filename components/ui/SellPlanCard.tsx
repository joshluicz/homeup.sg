"use client";

import { HydrationSafeNumberFlow } from "@/components/ui/HydrationSafeNumberFlow";
import { Check } from "lucide-react";
import { ListingPlatformIcons } from "@/components/ui/ListingPlatformIcons";
import { cn } from "@/lib/utils";import {
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

interface SellPlanCardProps {  filterType: SellPropertyType;
  showLearnMore?: boolean;
  learnMoreHref?: string;
  className?: string;
}

export function SellPlanCard({
  filterType,
  showLearnMore = false,
  learnMoreHref,
  className,
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
      <div className={cn("h-1.5 w-full", t.topBar)} />

      <div className={cn("p-6", t.header)}>
        <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold", t.badge)}>
          {plan.tag}
        </span>
        <h3 className="mt-3 text-lg font-semibold text-neutral-900">{plan.name}</h3>
        <div className="mt-3 flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
          <span className={cn("font-display text-4xl font-bold tracking-tight", t.price)}>
            $
            <HydrationSafeNumberFlow format={{ style: "decimal" }} value={plan.price} />
          </span>
          <span className="text-sm font-medium text-neutral-500">+ GST</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-6 pb-6">
        <div className="mb-5 h-px bg-neutral-100" />
        <ul className="flex-1 space-y-2.5">
          {PACKAGE_FEATURES.map((feature) => (
            <li key={feature.id} className="flex items-start gap-2.5 text-sm text-neutral-700">
              <Check aria-hidden="true" className={cn("mt-0.5 h-4 w-4 shrink-0", t.check)} />
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
      </div>
    </div>
  );
}
