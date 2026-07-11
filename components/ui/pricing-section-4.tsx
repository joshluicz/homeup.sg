"use client";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SectionBlendTop } from "@/components/ui/SectionBlend";
import { FadeInUp, StaggerContainer, StaggerItem } from "@/components/ui/motion-primitives";
import { SavingsSlider } from "@/components/ui/SavingsSlider";
import { SellPlanCard } from "@/components/ui/SellPlanCard";
import { motion } from "motion/react";
import { SELL_PLANS, type SellPropertyType } from "@/lib/data/sell-pricing";

const GST_RATE = 0.09;
const COMMISSION_RATE = 0.02;

function withGst(amount: number): number {
  return Math.round(amount * (1 + GST_RATE));
}

function formatSgd(amount: number): string {
  return `$${amount.toLocaleString("en-SG")}`;
}

/** Always show the marketing price — never the GST-inclusive figure. */
function formatHomeupFee(base: number): string {
  return `${formatSgd(base)}*`;
}

const COMPARISON_SOURCE = [
  { type: "HDB Flat", salePrice: 500_000, homeupBase: SELL_PLANS[0].price },
  { type: "Condo / EC", salePrice: 1_200_000, homeupBase: SELL_PLANS[1].price },
  { type: "Landed Home", salePrice: 3_000_000, homeupBase: SELL_PLANS[2].price },
] as const;

const COMPARISON_ROWS = COMPARISON_SOURCE.map((row) => {
  const typicalBase = Math.round(row.salePrice * COMMISSION_RATE);
  const typicalInclGst = withGst(typicalBase);
  const homeupInclGst = withGst(row.homeupBase);

  return {
    ...row,
    typicalBase,
    typicalInclGst,
    homeupInclGst,
    savings: typicalInclGst - homeupInclGst,
  };
});

interface PricingSection4Props {
  id?: string;
  filterType?: SellPropertyType | null;
  showLearnMore?: boolean;
  defaultSliderType?: SellPropertyType;
  showSlider?: boolean;
}

function ComparisonCards() {
  return (
    <div className="grid gap-4 md:hidden">
      {COMPARISON_ROWS.map((row) => (
        <article
          key={row.type}
          className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
        >
          <h4 className="text-sm font-bold text-neutral-900">{row.type}</h4>
          <p className="mt-1 text-sm font-normal text-neutral-500">
            Example sale: {formatSgd(row.salePrice)}
          </p>
          <dl className="mt-4 grid gap-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="font-normal text-neutral-600">Typical 2% (incl. GST)</dt>
              <dd className="font-semibold text-neutral-900">{formatSgd(row.typicalInclGst)}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="font-normal text-neutral-600">HomeUP fixed fee*</dt>
              <dd className="font-semibold text-neutral-900">{formatHomeupFee(row.homeupBase)}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-neutral-100 pt-3">
              <dt className="font-semibold text-primary-700">You save</dt>
              <dd className="font-bold text-primary-700">{formatSgd(row.savings)}</dd>
            </div>
          </dl>
        </article>
      ))}
    </div>
  );
}

function ComparisonTable() {
  return (
    <div className="hidden overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm md:block">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">
          HomeUP fixed fee compared to typical 2% agent commission in Singapore. HomeUP fees
          shown before GST; savings use GST-inclusive amounts.
        </caption>
        <thead>
          <tr className="border-b border-neutral-200 bg-neutral-50 text-left">
            <th scope="col" className="px-6 py-4 font-semibold text-neutral-900">
              Property type
            </th>
            <th scope="col" className="px-6 py-4 font-semibold text-neutral-900">
              Example sale price
            </th>
            <th scope="col" className="px-6 py-4 font-semibold text-neutral-900">
              Typical 2% fee
              <span className="mt-0.5 block text-xs font-normal text-neutral-500">
                incl. 9% GST
              </span>
            </th>
            <th scope="col" className="px-6 py-4 font-semibold text-neutral-900">
              HomeUP fixed fee*
              <span className="mt-0.5 block text-xs font-normal text-neutral-500">
                + 9% GST
              </span>
            </th>
            <th scope="col" className="bg-primary-50/80 px-6 py-4 font-semibold text-primary-800">
              You save
              <span className="mt-0.5 block text-xs font-normal text-primary-700">
                after GST on both
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {COMPARISON_ROWS.map((row) => (
            <tr key={row.type} className="border-b border-neutral-100 last:border-b-0">
              <th scope="row" className="px-6 py-5 text-left font-semibold text-neutral-900">
                {row.type}
              </th>
              <td className="px-6 py-5 font-normal text-neutral-600">
                {formatSgd(row.salePrice)}
              </td>
              <td className="px-6 py-5 font-normal text-neutral-600">
                {formatSgd(row.typicalInclGst)}
              </td>
              <td className="px-6 py-5 font-semibold text-neutral-900">
                {formatHomeupFee(row.homeupBase)}
              </td>
              <td className="bg-primary-50/50 px-6 py-5 font-bold text-primary-700">
                {formatSgd(row.savings)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PricingSection4({
  id = "pricing",
  filterType = null,
  showLearnMore = true,
  defaultSliderType = "HDB",
  showSlider = true,
}: PricingSection4Props) {
  const plans = filterType
    ? SELL_PLANS.filter((p) => p.type === filterType)
    : SELL_PLANS;

  const gridClass =
    plans.length === 1 ? "mt-6 max-w-md mx-auto" : "mt-6 grid gap-6 md:grid-cols-3";

  const reserveFootnoteSpace =
    plans.length > 1 && plans.some((p) => p.footnote);

  return (
    <section
      aria-label="Fixed-fee pricing packages"
      id={id}
      className="relative overflow-hidden section-padding bg-neutral-50"
    >
      <SectionBlendTop from="primary-50" />
      <div className="container-page">
        {showSlider && (
          <FadeInUp delay={0.06}>
            <SavingsSlider mode="sell" defaultType={defaultSliderType} className="mt-0" />
          </FadeInUp>
        )}

        <FadeInUp delay={0.08} className="mt-10 sm:mt-12">
          <p className="text-sm font-bold text-neutral-900">Our fixed fees</p>
          <p className="mt-1 text-sm font-normal text-neutral-500">
            What you pay when you choose HomeUP
          </p>
        </FadeInUp>

        <StaggerContainer className={gridClass}>
          {plans.map((plan) => (
            <StaggerItem key={plan.name}>
              <motion.div
                whileHover={{ y: -10 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="h-full cursor-default"
              >
                <SellPlanCard
                  filterType={plan.type}
                  showLearnMore={showLearnMore}
                  learnMoreHref={plan.learnMoreHref}
                  reserveFootnoteSpace={reserveFootnoteSpace}
                />
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <FadeInUp delay={0.12} className="mx-auto mt-14 max-w-3xl sm:mt-16">
          <h3 className="text-center font-display text-xl font-extrabold tracking-tight text-neutral-900 sm:text-2xl">
            Same service. Different fee model.
          </h3>
          <p className="mt-4 text-center text-sm leading-relaxed text-neutral-600 sm:text-base speakable-fixed-fee-definition">
            A fixed-fee agent charges one flat fee. You still get listing, marketing,
            negotiation, and full documentation. The only change is what you pay at the end.
          </p>
        </FadeInUp>

        <FadeInUp delay={0.18} className="mt-12 sm:mt-14">
          <div className="section-header mb-6">
            <Eyebrow>Compare the numbers</Eyebrow>
            <h3 className="section-title text-2xl sm:text-3xl">
              HomeUP vs Typical 2% Agent
            </h3>
          </div>

          <ComparisonCards />
          <ComparisonTable />

          <p className="mt-4 text-center text-[10px] font-normal leading-relaxed text-neutral-400">
            * HomeUP fixed fees shown before 9% GST. Savings = typical 2% commission (incl.
            GST) minus HomeUP fixed fee (incl. GST), based on the example sale prices shown.
          </p>
          <p className="mt-2 text-center text-[10px] font-normal leading-relaxed text-neutral-400">
            Typical 2% commission reflects common market practice among CEA-registered
            salespersons in Singapore. It is not a statutory or regulated rate.
          </p>
        </FadeInUp>

      </div>
    </section>
  );
}
