"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BUY_NO_FEE_LABEL,
  BUY_PLANS,
  BUY_THEME_STYLES,
  type BuyPropertyType,
} from "@/lib/data/buy-pricing";
import { buildBuyPlanWhatsAppUrl } from "@/lib/whatsapp";

interface BuyPlanCardProps {
  filterType: BuyPropertyType;
  showLearnMore?: boolean;
  learnMoreHref?: string;
  className?: string;
}

export function BuyPlanCard({
  filterType,
  showLearnMore = false,
  learnMoreHref,
  className,
}: BuyPlanCardProps) {
  const plan = BUY_PLANS.find((p) => p.type === filterType);
  if (!plan) return null;

  const t = BUY_THEME_STYLES[plan.theme];

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
          <span className={cn("font-display text-3xl font-bold tracking-tight sm:text-4xl", t.price)}>
            {plan.price}
          </span>
          {plan.price !== BUY_NO_FEE_LABEL && (
            <span className="text-sm font-medium text-neutral-500">+ GST</span>
          )}
        </div>
        <p className="mt-3 text-sm leading-relaxed text-neutral-600">{plan.description}</p>
      </div>

      <div className="flex flex-1 flex-col px-6 pb-6">
        <div className="mb-5 h-px bg-neutral-100" />
        <ul className="flex-1 space-y-2.5">
          {plan.includes.map((feature) => (
            <li key={feature} className="flex items-center gap-2.5 text-sm text-neutral-700">
              <Check aria-hidden="true" className={cn("h-4 w-4 shrink-0", t.check)} />
              {feature}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-col gap-2.5">
          <a
            href={buildBuyPlanWhatsAppUrl(plan.name)}
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
