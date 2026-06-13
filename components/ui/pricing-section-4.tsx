"use client";
import { cn } from "@/lib/utils";
import NumberFlow from "@number-flow/react";
import { Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { FadeInUp, StaggerContainer, StaggerItem } from "@/components/ui/motion-primitives";
import { SavingsSlider } from "@/components/ui/SavingsSlider";
import {
  SELL_PLANS,
  SELL_THEME_STYLES,
  type SellPropertyType,
} from "@/lib/data/sell-pricing";

const WHATSAPP = "https://wa.me/6580877015";

const PACKAGE_FEATURES = [
  { id: "consultation", label: "Full agent services" },
  { id: "listing", label: "List on" },
  { id: "documentation", label: "Full documentation (e.g. OTP)" },
] as const;

const listingIconClass = "h-3.5 w-3.5 shrink-0 rounded-sm object-contain";

function ListingPlatformIcons() {
  return (
    <span className="ml-1.5 inline-flex flex-wrap items-center gap-1 text-neutral-500">
      <Image
        src="/images/portals/propertyguru.png"
        alt="PropertyGuru"
        width={14}
        height={14}
        className={listingIconClass}
      />
      <Image src="/images/portals/srx.png" alt="SRX" width={14} height={14} className={listingIconClass} />
      <Image src="/images/portals/99co.png" alt="99.co" width={14} height={14} className={listingIconClass} />
      <Image
        src="/images/homeup-logo-icon.svg"
        alt="HOMEUP"
        width={14}
        height={14}
        className={listingIconClass}
      />
    </span>
  );
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
          <h2 className="section-title">Plans that work for you</h2>
          <p className="section-lead">
            One flat fee. No surprise commissions. Typical agents charge around 2%
            commission. HOMEUP keeps it simple with a fixed fee and the same full
            service.
          </p>
        </FadeInUp>

        <StaggerContainer className={gridClass}>
          {plans.map((plan) => {
            const t = SELL_THEME_STYLES[plan.theme];
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

                    <div className={cn("p-6", t.header)}>
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          t.badge,
                        )}
                      >
                        {plan.tag}
                      </span>

                      <h3 className="mt-3 text-lg font-semibold text-neutral-900">{plan.name}</h3>

                      <div className="mt-3 flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
                        <span className={cn("font-display text-4xl font-bold tracking-tight", t.price)}>
                          $
                          <NumberFlow format={{ style: "decimal" }} value={plan.price} />
                        </span>
                        <span className="text-sm font-medium text-neutral-500">+ GST</span>
                        <span className="text-sm text-neutral-500">/ fixed fee</span>
                      </div>

                      <p className="mt-1.5 text-xs text-neutral-500">
                        Typical 2% agent fee: ~${plan.typicalPrice.toLocaleString()} + GST (varies by
                        agent)
                      </p>
                    </div>

                    <div className="flex flex-1 flex-col px-6 pb-6">
                      <div className="mb-5 h-px bg-neutral-100" />

                      <ul className="flex-1 space-y-2.5">
                        {PACKAGE_FEATURES.map((feature) => (
                          <li
                            key={feature.id}
                            className="flex items-start gap-2.5 text-sm text-neutral-700"
                          >
                            <Check
                              aria-hidden="true"
                              className={cn("mt-0.5 h-4 w-4 shrink-0", t.check)}
                            />
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
