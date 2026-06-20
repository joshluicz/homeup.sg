"use client";

import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import { BuyPlanCard } from "@/components/ui/BuyPlanCard";
import type { BuyPageHero } from "@/lib/data/buy-pages";
import { BUY_TYPE_LABELS, type BuyPropertyType } from "@/lib/data/buy-pricing";

interface BuySubPageHeroProps {
  content: BuyPageHero;
  filterType: BuyPropertyType;
}

export function BuySubPageHero({ content, filterType }: BuySubPageHeroProps) {
  return (
    <section
      aria-label={`Buying ${BUY_TYPE_LABELS[filterType]}`}
      className="border-b border-neutral-100 bg-neutral-50"
    >
      <div className="container-page py-8 sm:py-10 lg:py-12">
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-sm font-normal text-neutral-500">
          <Link href="/buy" className="transition-colors hover:text-primary-600">
            Buy
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-neutral-300" aria-hidden="true" />
          <span className="font-medium text-neutral-800">{BUY_TYPE_LABELS[filterType]}</span>
        </nav>

        <div className="grid items-start gap-8 lg:grid-cols-[1fr_minmax(280px,360px)] lg:gap-10 xl:gap-12">
          <div className="min-w-0">
            <h1 className="font-display font-extrabold leading-[1.08] tracking-tight text-neutral-900 text-[clamp(1.5rem,4vw,2.25rem)]">
              {content.title}{" "}
              <span className="text-primary-600">{content.highlight}</span>
            </h1>
            {content.subtitle ? (
              <p className="mt-2 text-sm font-medium text-neutral-500">{content.subtitle}</p>
            ) : null}
            {content.body ? (
              <p className="mt-3 max-w-xl text-sm font-normal leading-relaxed text-neutral-600">
                {content.body}
              </p>
            ) : null}

            <ul className={`space-y-2 ${content.subtitle || content.body ? "mt-4" : "mt-3"}`}>
              {content.points.slice(0, 3).map((point) => (
                <li key={point} className="flex items-start gap-2 text-sm font-normal text-neutral-700">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" aria-hidden="true" />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:sticky lg:top-24">
            <p className="mb-3 text-sm font-semibold text-neutral-900">Your package</p>
            <BuyPlanCard filterType={filterType} />
            <p className="mt-3 text-sm font-normal text-neutral-400">{content.ctaNote}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
