"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SavingsSlider } from "@/components/ui/SavingsSlider";
import { SellPlanCard } from "@/components/ui/SellPlanCard";
import type { SellPageHero } from "@/lib/data/sell-pages";
import type { SellPropertyType } from "@/lib/data/sell-pricing";
import { SELL_PLANS } from "@/lib/data/sell-pricing";

const TYPE_BREADCRUMB: Record<SellPropertyType, string> = {
  HDB: "HDB Flat",
  Condo: "Condo / EC",
  Landed: "Landed Home",
};

interface SellSubPageHeroProps {
  content: SellPageHero;
  filterType: SellPropertyType;
}

export function SellSubPageHero({ content, filterType }: SellSubPageHeroProps) {
  const plan = SELL_PLANS.find((p) => p.type === filterType);

  return (
    <section
      aria-label={`Selling ${TYPE_BREADCRUMB[filterType]}`}
      className="border-b border-neutral-100 bg-neutral-50"
    >
      <div className="container-page py-8 sm:py-10 lg:py-12">
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-sm font-normal text-neutral-500">
          <Link href="/sell" className="transition-colors hover:text-primary-600">
            Sell
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-neutral-300" aria-hidden="true" />
          <span className="font-medium text-neutral-800">{TYPE_BREADCRUMB[filterType]}</span>
        </nav>

        <div className="grid items-start gap-8 lg:grid-cols-[1fr_minmax(280px,360px)] lg:gap-10 xl:gap-12">
          <div className="min-w-0">
            <h1 className="font-display font-extrabold leading-[1.08] tracking-tight text-neutral-900 text-[clamp(1.5rem,4vw,2.25rem)]">
              {content.title}{" "}
              <span className="text-primary-600">{content.highlight}</span>
            </h1>
            <p className="mt-2 text-sm font-medium text-neutral-500">{content.subtitle}</p>
            <p className="mt-3 max-w-xl text-sm font-normal leading-relaxed text-neutral-600">
              {content.body}
            </p>

            {plan && (
              <SavingsSlider
                mode="sell"
                defaultType={filterType}
                lockType
                variant="embedded"
                className="mt-6 sm:mt-8"
              />
            )}
          </div>

          <div className="lg:sticky lg:top-24">
            <p className="mb-3 text-sm font-semibold text-neutral-900">Your fixed fee</p>
            <SellPlanCard filterType={filterType} />
            <p className="mt-3 text-sm font-normal text-neutral-400">{content.ctaNote}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
