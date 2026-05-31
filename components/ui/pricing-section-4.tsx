"use client";
import { cn } from "@/lib/utils";
import NumberFlow from "@number-flow/react";
import { Check } from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { FadeInUp, StaggerContainer, StaggerItem } from "@/components/ui/motion-primitives";
import { SavingsSlider } from "@/components/ui/SavingsSlider";

const WHATSAPP = "https://wa.me/6580877015";

const plans = [
  {
    name: "HDB Seller",
    description:
      "Full-service support for HDB homeowners ready to sell and plan their next move with complete transparency.",
    price: 1999,
    typicalPrice: 10000,
    buttonText: "Connect with HDB Specialist",
    buttonVariant: "outline" as const,
    includes: [
      "Financial calculation",
      "Advising timeline",
      "Marketing & advertising",
      "Viewing arrangements",
      "Full documentation",
      "HDB submission",
    ],
  },
  {
    name: "Condo Seller",
    description:
      "Best value for condo owners who want full transparency and maximum savings on agent commission.",
    price: 4999,
    typicalPrice: 24000,
    buttonText: "Connect with Condo Specialist",
    buttonVariant: "default" as const,
    popular: false,
    includes: [
      "Financial calculation",
      "Advising timeline",
      "Marketing & advertising",
      "Viewing arrangements",
      "Full documentation",
      "Contract drafting",
    ],
  },
  {
    name: "Landed Seller",
    description:
      "Comprehensive support for landed property owners, with the highest commission savings of any package.",
    price: 9999,
    typicalPrice: 60000,
    buttonText: "Connect with Landed Specialist",
    buttonVariant: "outline" as const,
    includes: [
      "Financial calculation",
      "Advising timeline",
      "Marketing & advertising",
      "Viewing arrangements",
      "Full documentation",
      "Contract drafting",
    ],
  },
];

const PricingSwitch = ({ onSwitch }: { onSwitch: (value: string) => void }) => {
  const [selected, setSelected] = useState("0");

  const handleSwitch = (value: string) => {
    setSelected(value);
    onSwitch(value);
  };

  return (
    <div className="flex justify-center">
      <div className="relative mx-auto flex w-fit rounded-full border border-neutral-200 bg-neutral-100 p-1">
        {(["0", "1"] as const).map((val, i) => (
          <button
            key={val}
            onClick={() => handleSwitch(val)}
            className={cn(
              "relative z-10 h-9 w-fit rounded-full px-5 text-sm font-semibold transition-colors",
              selected === val ? "text-neutral-900" : "text-neutral-500",
            )}
          >
            {selected === val && (
              <motion.span
                layoutId="pswitch"
                className="absolute inset-0 rounded-full border border-neutral-200 bg-white shadow-sm"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative">{i === 0 ? "Our Fixed Fee" : "vs 2% Typical"}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default function PricingSection4() {
  const [showTypical, setShowTypical] = useState(false);
  const pricingRef = useRef<HTMLDivElement>(null);

  const togglePricingPeriod = (value: string) =>
    setShowTypical(Number.parseInt(value) === 1);

  return (
    <div ref={pricingRef}>
      <section
        aria-label="Fixed-fee pricing packages"
        id="pricing"
        className="section-padding bg-neutral-50"
      >
        <div className="container-page">
          {/* Section header */}
          <FadeInUp className="section-header">
            <Eyebrow>Transparent Fixed Fees</Eyebrow>
            <h2 className="section-title">Plans that work for you</h2>
            <p className="section-lead">
              One flat fee. No surprise commissions. Toggle to see exactly how much
              you would pay a typical 2% agent vs&nbsp;HomeUP.
            </p>
          </FadeInUp>

          <FadeInUp delay={0.12}>
            <PricingSwitch onSwitch={togglePricingPeriod} />
          </FadeInUp>

          {/* Cards */}
          <StaggerContainer className="mt-10 grid gap-6 md:grid-cols-3">
            {plans.map((plan) => {
              const saving = plan.typicalPrice - plan.price;
              return (
                <StaggerItem key={plan.name}>
                  <motion.div
                    whileHover={{ y: -10 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full cursor-default"
                  >
                    <div
                      className={cn(
                        "relative flex h-full flex-col rounded-2xl border bg-white p-6",
                        plan.popular
                          ? "border-primary-400 shadow-[0_4px_32px_rgba(14,133,62,0.12)]"
                          : "border-neutral-200 shadow-sm",
                      )}
                    >
                      {plan.popular && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary-600 px-4 py-1 text-xs font-semibold text-white shadow-sm">
                          Most Popular
                        </span>
                      )}

                      {/* Plan name + price */}
                      <div>
                        <h3 className="text-lg font-semibold text-neutral-900">
                          {plan.name}
                        </h3>

                        <div className="mt-3 flex items-baseline gap-1.5">
                          <span className="font-display text-4xl font-bold tracking-tight text-neutral-900">
                            $
                            <NumberFlow
                              format={{ style: "decimal" }}
                              value={showTypical ? plan.typicalPrice : plan.price}
                            />
                          </span>
                          <span className="text-sm text-neutral-500">
                            {showTypical ? "/ typical 2%" : "/ fixed fee"}
                          </span>
                        </div>

                        {showTypical && (
                          <motion.p
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-1.5 text-sm font-semibold text-primary-600"
                          >
                            You save ${saving.toLocaleString()}
                          </motion.p>
                        )}

                        <p className="mt-3 text-sm leading-relaxed text-neutral-500">
                          {plan.description}
                        </p>
                      </div>

                      <div className="my-5 h-px bg-neutral-100" />

                      {/* Features */}
                      <ul className="flex-1 space-y-2.5">
                        {plan.includes.map((feature) => (
                          <li key={feature} className="flex items-center gap-2.5 text-sm text-neutral-700">
                            <Check
                              aria-hidden="true"
                              className="h-4 w-4 shrink-0 text-primary-600"
                            />
                            {feature}
                          </li>
                        ))}
                      </ul>

                      {/* CTA */}
                      <a
                        href={WHATSAPP}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "mt-6 block rounded-lg py-3 text-center text-sm font-semibold transition-all duration-200",
                          plan.popular
                            ? "bg-primary-600 text-white hover:bg-primary-700"
                            : "border border-neutral-200 text-neutral-800 hover:border-primary-400 hover:text-primary-600",
                        )}
                      >
                        {plan.buttonText}
                      </a>
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

          {/* Savings calculator */}
          <FadeInUp delay={0.25}>
            <SavingsSlider />
          </FadeInUp>
        </div>
      </section>
    </div>
  );
}
