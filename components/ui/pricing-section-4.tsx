"use client";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { FadeInUp, StaggerContainer, StaggerItem } from "@/components/ui/motion-primitives";
import { SavingsSlider } from "@/components/ui/SavingsSlider";
import { SellPlanCard } from "@/components/ui/SellPlanCard";
import { motion } from "motion/react";
import { SELL_PLANS, type SellPropertyType } from "@/lib/data/sell-pricing";

const COMPARISON_ROWS = [
  {
    type: "HDB Flat",
    examplePrice: "$500,000",
    typicalCommission: "$10,000",
    homeupFee: SELL_PLANS[0].price,
    savings: SELL_PLANS[0].typicalPrice - SELL_PLANS[0].price,
  },
  {
    type: "Condo / EC",
    examplePrice: "$1,200,000",
    typicalCommission: "$24,000",
    homeupFee: SELL_PLANS[1].price,
    savings: SELL_PLANS[1].typicalPrice - SELL_PLANS[1].price,
  },
  {
    type: "Landed Home",
    examplePrice: "$3,000,000",
    typicalCommission: "$60,000",
    homeupFee: SELL_PLANS[2].price,
    savings: SELL_PLANS[2].typicalPrice - SELL_PLANS[2].price,
  },
] as const;

function formatFee(amount: number) {
  return `$${amount.toLocaleString("en-SG")} + GST`;
}

function formatSavings(amount: number) {
  return `~$${amount.toLocaleString("en-SG")}`;
}

interface PricingSection4Props {
  id?: string;
  filterType?: SellPropertyType | null;
  showLearnMore?: boolean;
  defaultSliderType?: SellPropertyType;
  showSlider?: boolean;
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

  const gridClass = plans.length === 1 ? "mt-10 max-w-md mx-auto" : "mt-10 grid gap-6 md:grid-cols-3";

  return (
    <section
      aria-label="Fixed-fee pricing packages"
      id={id}
      className="section-padding bg-neutral-50"
    >
      <div className="container-page">
        <FadeInUp className="section-header">
          <Eyebrow>Transparent Fixed Fees</Eyebrow>
          <h2 className="section-title">How much does a property agent cost in Singapore?</h2>
          <p className="section-lead">
            Most agents charge 1–2% commission on your sale price. HomeUP charges one flat
            fee with the same full service — listing, marketing, viewings, negotiation, and
            documentation.
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
                />
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <FadeInUp delay={0.15} className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse overflow-hidden rounded-2xl border border-neutral-200 bg-white text-sm shadow-sm">
            <caption className="sr-only">
              HomeUP fixed fee compared to typical 2% agent commission in Singapore
            </caption>
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-left">
                <th scope="col" className="px-4 py-3 font-semibold text-neutral-900 sm:px-6">
                  Property type
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-neutral-900 sm:px-6">
                  Example sale price
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-neutral-900 sm:px-6">
                  Typical 2% commission
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-neutral-900 sm:px-6">
                  HomeUP fixed fee
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-primary-700 sm:px-6">
                  You save
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.type} className="border-b border-neutral-100 last:border-b-0">
                  <th scope="row" className="px-4 py-4 text-left font-semibold text-neutral-900 sm:px-6">
                    {row.type}
                  </th>
                  <td className="px-4 py-4 font-normal text-neutral-600 sm:px-6">{row.examplePrice}</td>
                  <td className="px-4 py-4 font-normal text-neutral-600 sm:px-6">{row.typicalCommission}</td>
                  <td className="px-4 py-4 font-semibold text-neutral-900 sm:px-6">
                    {formatFee(row.homeupFee)}
                  </td>
                  <td className="px-4 py-4 font-semibold text-primary-700 sm:px-6">
                    {formatSavings(row.savings)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-center text-xs font-normal text-neutral-400">
            Based on 2% commission vs HomeUP fixed fee before GST. Actual savings vary by sale price.
          </p>
        </FadeInUp>

        <FadeInUp delay={0.2}>
          <p className="mt-6 text-center text-xs text-neutral-400">
            GST applicable. All packages include the same dedicated team.
          </p>
        </FadeInUp>

        {showSlider && (
          <FadeInUp delay={0.25}>
            <SavingsSlider mode="sell" defaultType={defaultSliderType} />
          </FadeInUp>
        )}
      </div>
    </section>
  );
}
