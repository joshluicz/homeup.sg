"use client";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { FadeInUp, StaggerContainer, StaggerItem } from "@/components/ui/motion-primitives";

const packages = [
  {
    name: "HDBSeller Package",
    price: "$1,999",
    href: "/sell-hdb",
    features: [
      "Financial calculation",
      "Advising timeline",
      "Marketing (advertisement)",
      "Viewing arrangements",
      "Documentation",
      "Submission to HDB",
    ],
  },
  {
    name: "CondoSeller Package",
    price: "$4,999",
    href: "/sell-condo",
    featured: true,
    features: [
      "Financial calculation",
      "Advising timeline",
      "Marketing (advertisement)",
      "Viewing arrangements",
      "Documentation",
      "Drafting contracts",
    ],
  },
  {
    name: "LandedSeller Package",
    price: "$9,999",
    href: "/sell-landed",
    features: [
      "Financial calculation",
      "Advising timeline",
      "Marketing (advertisement)",
      "Viewing arrangements",
      "Documentation",
      "Drafting contracts",
    ],
  },
];

export function PricingCards() {
  return (
    <section aria-label="Affordable fixed fee services" className="section-padding" id="pricing">
      <div className="container-page">
        <FadeInUp className="section-header">
          <Eyebrow>Affordable Fixed Fee Services</Eyebrow>
          <h2 className="section-title">
            A smarter way to sell and upgrade with fixed-fee property agents in
            Singapore: transparent pricing, coordinated sell-buy planning, and
            strategy built for your family&#39;s future.
          </h2>
        </FadeInUp>

        <StaggerContainer className="grid gap-6 lg:grid-cols-3 lg:gap-8">
          {packages.map((pkg) => (
            <StaggerItem key={pkg.name}>
              <motion.div
                className="h-full"
                whileHover={{ y: -6 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <div
                  className={[
                    "card flex h-full flex-col gap-6 text-center",
                    pkg.featured
                      ? "border-transparent bg-[var(--gradient-brand)] text-neutral-0"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <div>
                    <p
                      className={[
                        "m-0 font-body text-xs font-semibold uppercase tracking-wider",
                        pkg.featured ? "text-primary-100" : "text-primary-600",
                      ].join(" ")}
                    >
                      {pkg.name}
                    </p>
                    <p
                      className={[
                        "mt-4 font-mono text-display-sm font-medium tracking-tight",
                        pkg.featured ? "text-accent-300" : "text-primary-600",
                      ].join(" ")}
                    >
                      {pkg.price}
                    </p>
                    <p
                      className={[
                        "mt-2 text-xs",
                        pkg.featured ? "text-primary-100" : "text-neutral-500",
                      ].join(" ")}
                    >
                      GST Applicable
                    </p>
                  </div>

                  <div
                    className={[
                      "h-px",
                      pkg.featured ? "bg-primary-700" : "bg-neutral-200",
                    ].join(" ")}
                  />

                  <ul className="m-0 flex flex-1 list-none flex-col gap-3 p-0 text-left">
                    {pkg.features.map((feature) => (
                      <li
                        className={[
                          "flex items-center gap-3 text-sm",
                          pkg.featured ? "text-primary-100" : "text-neutral-600",
                        ].join(" ")}
                        key={feature}
                      >
                        <span
                          className={[
                            "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                            pkg.featured
                              ? "bg-accent-300 text-primary-900"
                              : "bg-primary-600 text-neutral-0",
                          ].join(" ")}
                        >
                          <Check aria-hidden="true" className="h-3 w-3" />
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={
                      pkg.featured
                        ? "border-neutral-0 bg-neutral-0 text-primary-700 hover:border-primary-50 hover:bg-primary-50 hover:text-primary-800"
                        : ""
                    }
                    asChild
                    variant={pkg.featured ? "default" : "secondary"}
                  >
                    <a href={pkg.href}>Learn More</a>
                  </Button>
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <FadeInUp delay={0.2}>
          <p className="mt-8 text-center text-sm text-neutral-500">
            GST applicable. Same team. Same service. Same fixed-fee structure.
          </p>
        </FadeInUp>
      </div>
    </section>
  );
}
