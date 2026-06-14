"use client";

import { CircleDollarSign, Handshake, Scale } from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { FadeInUp, StaggerContainer, StaggerItem } from "@/components/ui/motion-primitives";

const blocks = [
  {
    icon: CircleDollarSign,
    title: "Clear before you commit",
    body: "HDB purchases are supported at a fixed $1,999 + GST. Resale condo, landed, and new launch purchases are complimentary. The buyer pays no commission.",
  },
  {
    icon: Handshake,
    title: "Neutral advice",
    body: "Our team shortlists, compares, and negotiates with your interests first, because our fee isn't tied to how much you spend on the property.",
  },
  {
    icon: Scale,
    title: "Planned as one journey",
    body: "If you're selling and buying, both transactions are coordinated, reducing rushed moves, financial risk, and unnecessary compromises.",
  },
];

export function BuyFeeExplainer() {
  return (
    <section aria-label="How HomeUP buying fees work" className="section-padding bg-white">
      <div className="container-page">
        <FadeInUp className="section-header">
          <Eyebrow>Transparent Pricing</Eyebrow>
          <h2 className="section-title">You know the cost before you commit.</h2>
          <p className="section-lead">
            Whether you&apos;re buying an HDB flat, a resale condo, or a new launch,
            HomeUP&apos;s fees are clear upfront, with no hidden charges.
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
