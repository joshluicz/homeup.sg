"use client";
import { cn } from "@/lib/utils";
import NumberFlow from "@number-flow/react";
import { Check } from "lucide-react";
import Image from "next/image";
import { motion } from "motion/react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { FadeInUp, StaggerContainer, StaggerItem } from "@/components/ui/motion-primitives";
import { SavingsSlider } from "@/components/ui/SavingsSlider";

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
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z" />
      </svg>
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    </span>
  );
}

const plans = [
  {
    name: "HDB Seller",
    tag: "HDB Flat",
    theme: "blue" as const,
    price: 1999,
    typicalPrice: 10000,
    buttonText: "Connect with HOMEUP agent",
  },
  {
    name: "Condo Seller",
    tag: "Condo / EC",
    theme: "green" as const,
    price: 4999,
    typicalPrice: 24000,
    buttonText: "Connect with HOMEUP agent",
  },
  {
    name: "Landed Seller",
    tag: "Landed Home",
    theme: "amber" as const,
    price: 9999,
    typicalPrice: 60000,
    buttonText: "Connect with HOMEUP agent",
  },
];

const themeStyles = {
  blue: {
    topBar: "bg-blue-500",
    header: "bg-blue-50",
    border: "border-blue-200",
    badge: "bg-blue-100 text-blue-800",
    price: "text-blue-700",
    check: "text-blue-600",
    cta: "bg-blue-600 text-white hover:bg-blue-700",
    shadow: "shadow-[0_4px_24px_rgba(59,130,246,0.12)]",
  },
  green: {
    topBar: "bg-primary-600",
    header: "bg-primary-50",
    border: "border-primary-300",
    badge: "bg-primary-100 text-primary-800",
    price: "text-primary-700",
    check: "text-primary-600",
    cta: "bg-primary-600 text-white hover:bg-primary-700",
    shadow: "shadow-[0_4px_32px_rgba(0,154,68,0.15)]",
  },
  amber: {
    topBar: "bg-amber-500",
    header: "bg-amber-50",
    border: "border-amber-200",
    badge: "bg-amber-100 text-amber-900",
    price: "text-amber-800",
    check: "text-amber-600",
    cta: "bg-amber-600 text-white hover:bg-amber-700",
    shadow: "shadow-[0_4px_24px_rgba(245,158,11,0.15)]",
  },
} as const;

export default function PricingSection4() {
  return (
    <section
      aria-label="Fixed-fee pricing packages"
      id="pricing"
      className="section-padding bg-neutral-50"
    >
      <div className="container-page">
        <FadeInUp className="section-header">
          <Eyebrow>Transparent Fixed Fees</Eyebrow>
          <h2 className="section-title">Plans that work for you</h2>
          <p className="section-lead">
            One flat fee. No surprise commissions. Typical agents charge around 2%
            commission. HOMEUP keeps it
            simple with a fixed fee and the same full service.
          </p>
        </FadeInUp>

        <StaggerContainer className="mt-10 grid gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const t = themeStyles[plan.theme];
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
                      <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold", t.badge)}>
                        {plan.tag}
                      </span>

                      <h3 className="mt-3 text-lg font-semibold text-neutral-900">
                        {plan.name}
                      </h3>

                      <div className="mt-3 flex items-baseline gap-1.5">
                        <span className={cn("font-display text-4xl font-bold tracking-tight", t.price)}>
                          $
                          <NumberFlow format={{ style: "decimal" }} value={plan.price} />
                        </span>
                        <span className="text-sm text-neutral-500">/ fixed fee</span>
                      </div>

                      <p className="mt-1.5 text-xs text-neutral-500">
                        Typical 2% agent fee: ~${plan.typicalPrice.toLocaleString()} (varies by agent)
                      </p>
                    </div>

                    <div className="flex flex-1 flex-col px-6 pb-6">
                      <div className="mb-5 h-px bg-neutral-100" />

                      <ul className="flex-1 space-y-2.5">
                        {PACKAGE_FEATURES.map((feature) => (
                          <li key={feature.id} className="flex items-start gap-2.5 text-sm text-neutral-700">
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

                      <a
                        href={WHATSAPP}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "mt-6 flex min-h-12 items-center justify-center rounded-lg px-3 py-2.5 text-center text-xs font-semibold leading-tight transition-all duration-200 sm:text-sm",
                          t.cta,
                        )}
                      >
                        {plan.buttonText}
                      </a>
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

        <FadeInUp delay={0.25}>
          <SavingsSlider />
        </FadeInUp>
      </div>
    </section>
  );
}
