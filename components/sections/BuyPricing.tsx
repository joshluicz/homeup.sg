"use client";
import { motion } from "framer-motion";
import { Home, Building2, Sparkles, Repeat, TrendingUp } from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { FadeInUp, StaggerContainer, StaggerItem } from "@/components/ui/motion-primitives";
import { SavingsSlider } from "@/components/ui/SavingsSlider";
import { BuyPlanCard } from "@/components/ui/BuyPlanCard";
import {
  BUY_PLANS,
  type BuyPropertyType,
} from "@/lib/data/buy-pricing";

const services = [
  {
    icon: Home,
    title: "HDB Purchase",
    desc: "Find the right flat with guidance on grants, financing and resale procedures.",
  },
  {
    icon: Building2,
    title: "Condo/Landed Purchase",
    desc: "Access market insights, project comparisons and negotiation support for resale properties.",
  },
  {
    icon: Sparkles,
    title: "New Launch Purchase",
    desc: "We assist you to purchase New Launch straight from developers. Buyer pays no commission.",
  },
  { icon: Repeat, title: "Sell & Buy Planning", desc: "Coordinate both transactions seamlessly to minimise risk and maximise flexibility." },
  {
    icon: TrendingUp,
    title: "Investor Advisory",
    desc: "Identify opportunities aligned with your investment goals and budget.",
  },
];

interface BuyPricingProps {
  filterType?: BuyPropertyType | null;
  showLearnMore?: boolean;
  defaultSliderType?: BuyPropertyType;
  showServices?: boolean;
  showSlider?: boolean;
}

export function BuyPricing({
  filterType = null,
  showLearnMore = false,
  defaultSliderType = "HDB",
  showServices = true,
  showSlider = true,
}: BuyPricingProps) {
  const plans = filterType ? BUY_PLANS.filter((p) => p.type === filterType) : BUY_PLANS;
  const gridClass = plans.length === 1 ? "mt-6 max-w-md mx-auto" : "mt-6 grid gap-4 sm:mt-10 sm:gap-6 md:grid-cols-3";

  return (
    <section aria-label="Buying services and pricing" id="buy-pricing" className="bg-neutral-50 py-12 sm:section-padding">
      <div className="container-page">
        {showServices && (
          <>
            <FadeInUp className="section-header mb-8 sm:mb-12">
              <Eyebrow>Buying Services</Eyebrow>
              <h2 className="section-title">What buying support does HomeUP offer?</h2>
              <p className="section-lead">
                HomeUP provides full buyer representation for HDB resale ($1,999 + GST),
                resale condo and landed (no fees), and new launch purchases
                (no fees), including affordability planning, shortlisting,
                viewings, negotiation, and documentation through to completion.
              </p>
            </FadeInUp>

            <StaggerContainer className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {services.map((s) => {
                const Icon = s.icon;
                return (
                  <StaggerItem key={s.title}>
                    <div className="flex h-full flex-col rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
                      <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <h3 className="text-sm font-bold text-neutral-900">{s.title}</h3>
                      <p className="mt-2 text-sm font-normal leading-relaxed text-neutral-600">
                        {s.desc}
                      </p>
                    </div>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </>
        )}

        <FadeInUp className={`section-header mb-8 ${showServices ? "mt-12 sm:mb-12 sm:mt-16 lg:mt-20" : ""}`}>
          <Eyebrow>Buying Packages</Eyebrow>
          <h2 className="section-title">How much does it cost to buy property with HomeUP?</h2>
          <p className="section-lead">
            HDB buyer representation is a fixed $1,999 + GST. Condo, landed, and new launch
            purchases have no fees. The seller or developer covers the agent fee under
            standard Singapore co-broke arrangements, so you pay nothing for representation.
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
                <BuyPlanCard
                  filterType={plan.type}
                  showLearnMore={showLearnMore}
                  learnMoreHref={plan.learnMoreHref}
                />
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <FadeInUp delay={0.2}>
          <p className="mt-6 text-center text-xs text-neutral-400">
            GST applicable on paid packages. No Fees packages are funded via standard
            co-broke arrangements.
          </p>
        </FadeInUp>

        {showSlider && (
          <FadeInUp delay={0.25}>
            <SavingsSlider mode="buy" defaultType={defaultSliderType} className="mt-8 sm:mt-12" />
          </FadeInUp>
        )}
      </div>
    </section>
  );
}
