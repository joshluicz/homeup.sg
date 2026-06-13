"use client";

import { Building2, Cpu, Home } from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { FadeInUp, StaggerContainer, StaggerItem } from "@/components/ui/motion-primitives";

const pillars = [
  {
    icon: Building2,
    title: "We operate at scale",
    body: "With 120+ active listings, HomeUP has built marketing systems and buyer networks that reduce cost per listing — savings passed directly to you.",
  },
  {
    icon: Home,
    title: "You host your own viewings",
    body: "HomeUP screens every enquiry and briefs you on what to expect. You host the tour — no agent travel time built into your fee.",
  },
  {
    icon: Cpu,
    title: "Streamlined, not shortcuts",
    body: "Digital tools and structured timelines replace manual admin. Same thorough service, at a fixed fee agreed upfront.",
  },
];

export function WhyCheaper() {
  return (
    <section aria-label="Why HomeUP can charge a fixed fee" className="section-padding bg-white">
      <div className="container-page">
        <FadeInUp className="section-header">
          <Eyebrow>Why Our Fee Is Lower</Eyebrow>
          <h2 className="section-title">Full service. Fixed fee. Here&#39;s how.</h2>
          <p className="section-lead">
            A lower fee doesn&#39;t mean less commitment. It means a smarter model — built
            around scale, efficiency, and putting sellers in charge of their own viewings.
          </p>
        </FadeInUp>

        <StaggerContainer className="mt-10 grid gap-6 md:grid-cols-3">
          {pillars.map((p) => {
            const Icon = p.icon;
            return (
              <StaggerItem key={p.title}>
                <div className="flex h-full flex-col rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
                  <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <h3 className="mb-2 text-sm font-bold text-neutral-900">{p.title}</h3>
                  <p className="text-sm font-normal leading-relaxed text-neutral-600">{p.body}</p>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}
