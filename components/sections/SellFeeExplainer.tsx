"use client";

import { CircleDollarSign, Gauge, Scale } from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { FadeInUp, StaggerContainer, StaggerItem } from "@/components/ui/motion-primitives";

const blocks = [
  {
    icon: CircleDollarSign,
    title: "Agreed upfront",
    body: "Your fee is set when you sign: $1,999, $4,999, or $9,999 + GST depending on property type. It does not rise if your home sells for more. No hidden costs.",
  },
  {
    icon: Gauge,
    title: "High efficiency",
    body: "We cover the most important parts of selling your home. Waste less time on things that don't matter.",
  },
  {
    icon: Scale,
    title: "Why it matters",
    body: "On a $1M home, 2% commission is around $20,000. HomeUP's fee stays fixed regardless of your sale price, so more of your equity stays with you.",
  },
];

export function SellFeeExplainer() {
  return (
    <section aria-label="How fixed fees work" className="section-padding bg-white">
      <div className="container-page">
        <FadeInUp className="section-header">
          <Eyebrow>Transparent Pricing</Eyebrow>
          <h2 className="section-title">You know the number before you sign.</h2>
          <p className="section-lead">
            Traditional agents charge a percentage of your sale price. HomeUP charges one
            flat fee, agreed upfront, with a process built to keep the work focused.
          </p>
        </FadeInUp>

        <StaggerContainer className="mt-10 grid gap-6 md:grid-cols-3">
          {blocks.map((block) => {
            const Icon = block.icon;
            return (
              <StaggerItem key={block.title}>
                <div className="card h-full bg-neutral-50">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                    <Icon aria-hidden="true" className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-bold text-neutral-900">{block.title}</h3>
                  <p className="mt-3 text-sm font-normal leading-relaxed text-neutral-600">
                    {block.body}
                  </p>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}
