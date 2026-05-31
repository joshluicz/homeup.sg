"use client";
import { motion } from "framer-motion";
import { Check, Home, Building2, Sparkles, Repeat, TrendingUp } from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { FadeInUp, StaggerContainer, StaggerItem } from "@/components/ui/motion-primitives";
import { SavingsSlider } from "@/components/ui/SavingsSlider";

const WHATSAPP = "https://wa.me/6580877015";

const services = [
  { icon: Home,       title: "HDB Purchase",         desc: "Find the right flat with guidance on grants, financing and resale procedures." },
  { icon: Building2,  title: "Resale Condo Purchase", desc: "Access market insights, project comparisons and negotiation support." },
  { icon: Sparkles,   title: "New Launch Purchase",   desc: "Receive unbiased project analysis and unit selection guidance." },
  { icon: Repeat,     title: "Sell & Buy Planning",   desc: "Coordinate both transactions seamlessly to minimise risk and maximise flexibility." },
  { icon: TrendingUp, title: "Investor Advisory",     desc: "Identify opportunities aligned with your investment goals and budget." },
];

const plans = [
  {
    name: "HDB Purchase",
    price: "$1,999",
    description: "Full guidance through grants, financing and the resale process for your next flat.",
    popular: false,
    buttonText: "Connect with HDB Specialist",
    includes: ["Affordability & grant planning", "Financing guidance", "Resale procedure support", "Negotiation & OTP"],
  },
  {
    name: "Resale Condo Purchase",
    price: "Complimentary",
    description: "Market insights, project comparisons and negotiation support — at no cost to you.",
    popular: false,
    buttonText: "Connect with Condo Specialist",
    includes: ["Market & project comparisons", "Unbiased shortlisting", "Viewing coordination", "Negotiation support"],
  },
  {
    name: "Landed Purchase",
    price: "Complimentary",
    description: "End-to-end representation for landed purchases, fully covered.",
    popular: false,
    buttonText: "Connect with Landed Specialist",
    includes: ["Tenure & zoning checks", "Valuation guidance", "Negotiation support", "Documentation"],
  },
];

export function BuyPricing() {
  return (
    <section aria-label="Buying services and pricing" id="buy-pricing" className="section-padding bg-neutral-50">
      <div className="container-page">
        {/* Services */}
        <FadeInUp className="section-header">
          <Eyebrow>Buying Services</Eyebrow>
          <h2 className="section-title">Support that fits your situation</h2>
          <p className="section-lead">
            Every buyer is different. Whether you need guidance on a single purchase, a
            concurrent sell-and-buy, or full end-to-end representation, we tailor the
            level of support that&apos;s right for you.
          </p>
        </FadeInUp>

        <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => {
            const Icon = s.icon;
            return (
              <StaggerItem key={s.title}>
                <div className="flex h-full flex-col rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                  <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="text-sm font-bold text-neutral-900">{s.title}</h3>
                  <p className="mt-2 text-sm font-normal leading-relaxed text-neutral-600">{s.desc}</p>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>

        {/* Pricing */}
        <FadeInUp className="section-header mt-20">
          <Eyebrow>Buying Packages</Eyebrow>
          <h2 className="section-title">Transparent fees for buyers</h2>
          <p className="section-lead">
            Clear, upfront pricing — with complimentary representation for condo and
            landed purchases.
          </p>
        </FadeInUp>

        <StaggerContainer className="mt-10 grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <StaggerItem key={plan.name}>
              <motion.div
                whileHover={{ y: -10 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="h-full cursor-default"
              >
                <div
                  className={[
                    "relative flex h-full flex-col rounded-2xl border bg-white p-6",
                    plan.popular
                      ? "border-primary-400 shadow-[0_4px_32px_rgba(14,133,62,0.12)]"
                      : "border-neutral-200 shadow-sm",
                  ].join(" ")}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary-600 px-4 py-1 text-xs font-semibold text-white shadow-sm">
                      Most Popular
                    </span>
                  )}

                  <h3 className="text-lg font-semibold text-neutral-900">{plan.name}</h3>

                  <div className="mt-3">
                    <span className="font-display text-3xl font-bold tracking-tight text-neutral-900">
                      {plan.price}
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-relaxed text-neutral-500">{plan.description}</p>

                  <div className="my-5 h-px bg-neutral-100" />

                  <ul className="flex-1 space-y-2.5">
                    {plan.includes.map((feature) => (
                      <li key={feature} className="flex items-center gap-2.5 text-sm text-neutral-700">
                        <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-primary-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <a
                    href={WHATSAPP}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={[
                      "mt-6 block rounded-lg py-3 text-center text-sm font-semibold transition-all duration-200",
                      plan.popular
                        ? "bg-primary-600 text-white hover:bg-primary-700"
                        : "border border-neutral-200 text-neutral-800 hover:border-primary-400 hover:text-primary-600",
                    ].join(" ")}
                  >
                    {plan.buttonText}
                  </a>
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <FadeInUp delay={0.2}>
          <p className="mt-6 text-center text-xs text-neutral-400">
            GST applicable. Complimentary packages are funded via standard co-broke arrangements.
          </p>
        </FadeInUp>

        {/* Fee calculator */}
        <FadeInUp delay={0.25}>
          <SavingsSlider mode="buy" />
        </FadeInUp>
      </div>
    </section>
  );
}
