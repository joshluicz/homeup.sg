"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Check, Home, Building2, Sparkles, Repeat, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { FadeInUp, StaggerContainer, StaggerItem } from "@/components/ui/motion-primitives";
import { SavingsSlider } from "@/components/ui/SavingsSlider";
import {
  BUY_PLANS,
  BUY_THEME_STYLES,
  type BuyPropertyType,
} from "@/lib/data/buy-pricing";

const WHATSAPP = "https://wa.me/6580877015";

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
                Every buyer is different. Whether you need guidance on a single purchase, a
                concurrent sell-and-buy, or full end-to-end representation, we tailor the
                level of support that&apos;s right for you.
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
            Clear, upfront pricing — complimentary representation for condo, landed, and new
            launch purchases.
          </p>
        </FadeInUp>

        <StaggerContainer className={gridClass}>
          {plans.map((plan) => {
            const t = BUY_THEME_STYLES[plan.theme];
            return (
              <StaggerItem key={plan.name}>
                <motion.div
                  whileHover={{ y: -10 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full cursor-default"
                >
                  <div
                    className={cn(
                      "relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white",
                      t.border,
                      t.shadow,
                    )}
                  >
                    <div className={cn("h-1.5 w-full", t.topBar)} />

                    <div className={cn("p-5 sm:p-6", t.header)}>
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          t.badge,
                        )}
                      >
                        {plan.tag}
                      </span>

                      <h3 className="mt-3 text-base font-semibold text-neutral-900 sm:text-lg">
                        {plan.name}
                      </h3>

                      <div className="mt-2 flex flex-wrap items-baseline gap-x-1.5 sm:mt-3">
                        <span
                          className={cn(
                            "font-display text-2xl font-bold tracking-tight sm:text-3xl",
                            t.price,
                          )}
                        >
                          {plan.price}
                        </span>
                        {plan.price !== "Complimentary" && (
                          <span className="text-sm font-medium text-neutral-500">+ GST</span>
                        )}
                      </div>

                      <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                        {plan.description}
                      </p>
                    </div>

                    <div className="flex flex-1 flex-col px-5 pb-5 sm:px-6 sm:pb-6">
                      <div className="mb-5 h-px bg-neutral-100" />

                      <ul className="flex-1 space-y-2.5">
                        {plan.includes.map((feature) => (
                          <li
                            key={feature}
                            className="flex items-center gap-2.5 text-sm text-neutral-700"
                          >
                            <Check aria-hidden="true" className={cn("h-4 w-4 shrink-0", t.check)} />
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <div className="mt-5 flex flex-col gap-2.5 sm:mt-6">
                        <a
                          href={WHATSAPP}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "flex min-h-12 items-center justify-center rounded-lg px-3 py-2.5 text-center text-xs font-semibold leading-tight transition-all duration-200 sm:text-sm",
                            t.cta,
                          )}
                        >
                          {plan.buttonText}
                        </a>
                        {showLearnMore && (
                          <Link
                            href={plan.learnMoreHref}
                            className={cn(
                              "flex min-h-10 items-center justify-center rounded-lg border px-3 py-2.5 text-center text-xs font-semibold leading-tight transition-all duration-200 sm:text-sm",
                              t.ctaOutline,
                            )}
                          >
                            Learn more
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>

        <FadeInUp delay={0.2}>
          <p className="mt-6 text-center text-xs text-neutral-400">
            GST applicable on paid packages. Complimentary packages are funded via standard
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
