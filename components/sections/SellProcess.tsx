"use client";

import type { SellPropertyType } from "@/lib/data/sell-pricing";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { FadeInUp, StaggerContainer, StaggerItem } from "@/components/ui/motion-primitives";

const baseSteps = [
  {
    step: "01",
    title: "Planning consultation",
    body: "Review your financial position, outstanding CPF, estimated net proceeds, and selling timeline. Free and obligation-free.",
  },
  {
    step: "02",
    title: "List and market",
    body: "Your property is listed on PropertyGuru, SRX, 99.co, and HomeUP.sg — plus social channels for maximum buyer reach.",
  },
  {
    step: "03",
    title: "Viewings and offers",
    body: "Your dedicated agent coordinates all viewings, handles buyer enquiries, and presents offers with a clear assessment of terms and net proceeds.",
  },
];

const completionByType: Record<SellPropertyType, string> = {
  HDB: "HomeUP handles all sales documentation — OTP, contract, and HDB submission — through to a smooth handover.",
  Condo: "HomeUP handles contract drafting, negotiation, and all sales documentation through to completion.",
  Landed: "HomeUP handles contract drafting, negotiation, and all sales documentation through to completion.",
};

interface SellProcessProps {
  propertyType?: SellPropertyType | null;
}

export function SellProcess({ propertyType = null }: SellProcessProps) {
  const completionBody =
    propertyType != null
      ? completionByType[propertyType]
      : "HomeUP handles all sales documentation — OTP, contracts, and HDB submission where applicable — through to a smooth handover.";

  const steps = [
    ...baseSteps,
    {
      step: "04",
      title: "Documentation and completion",
      body: completionBody,
    },
  ];

  return (
    <section aria-label="How selling with HomeUP works" className="section-padding bg-neutral-50">
      <div className="container-page">
        <FadeInUp className="section-header">
          <Eyebrow>How It Works</Eyebrow>
          <h2 className="section-title">From first call to keys handed over</h2>
          <p className="section-lead">
            A clear, structured process — so you always know what happens next and when.
          </p>
        </FadeInUp>

        <StaggerContainer className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <StaggerItem key={s.step}>
              <div className="relative h-full rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <span className="font-display text-3xl font-extrabold text-primary-100">
                  {s.step}
                </span>
                <h3 className="mt-3 text-sm font-bold text-neutral-900">{s.title}</h3>
                <p className="mt-2 text-sm font-normal leading-relaxed text-neutral-600">
                  {s.body}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
