"use client";

import { Building2, Home, Workflow } from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { FadeInUp, StaggerContainer, StaggerItem } from "@/components/ui/motion-primitives";

const pillars = [
  {
    icon: Building2,
    title: "Economies of scale",
    body: "HomeUP carries 120+ active listings at once. Marketing, buyer follow-up, and documentation run on shared systems, so each sale does not need the same overhead as a solo agent juggling a handful of homes.",
  },
  {
    icon: Home,
    title: "You host the viewings",
    body: "We screen enquiries, brief you on what to expect, and coordinate timing. You show buyers around your home. Our agents are not travelling to every viewing, and that is a big part of why a fixed fee works.",
  },
  {
    icon: Workflow,
    title: "Focus on what moves the sale",
    body: "Listing, negotiation, and completion paperwork are handled end to end. We skip the busywork that pads a percentage commission without helping you sell faster or for more.",
  },
];

export function WhyCheaper() {
  return (
    <section
      id="why-cheaper"
      aria-label="Why HomeUP can charge a fixed fee"
      className="scroll-mt-24 section-padding bg-white"
    >
      <div className="container-page">
        <FadeInUp className="section-header mx-0 max-w-3xl text-left">
          <Eyebrow>Why our fee is lower</Eyebrow>
          <h2 className="section-title">
            A lower fee does not mean a lighter service.
          </h2>
          <p className="section-lead mx-0 text-left">
            Traditional agents charge a percentage partly because every listing carries
            the same travel, admin, and marketing costs. HomeUP spreads those costs across
            a larger portfolio and removes the parts that do not need an agent in the room.
          </p>
        </FadeInUp>

        <StaggerContainer className="mt-10 grid gap-6 md:grid-cols-3">
          {pillars.map((p) => {
            const Icon = p.icon;
            return (
              <StaggerItem key={p.title}>
                <div className="flex h-full flex-col rounded-2xl border border-neutral-200 bg-neutral-50 p-6 sm:p-7">
                  <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <h3 className="mb-2 text-sm font-bold text-neutral-900">{p.title}</h3>
                  <p className="text-sm font-normal leading-relaxed text-neutral-600">
                    {p.body}
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
