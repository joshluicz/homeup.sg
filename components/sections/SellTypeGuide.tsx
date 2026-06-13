"use client";

import { Check } from "lucide-react";
import type { SellTypeGuideContent } from "@/lib/data/sell-pages";
import { FadeInUp } from "@/components/ui/motion-primitives";

interface SellTypeGuideProps {
  content: SellTypeGuideContent;
}

export function SellTypeGuide({ content }: SellTypeGuideProps) {
  return (
    <section aria-label={content.eyebrow} className="section-padding bg-white">
      <div className="container-page">
        <FadeInUp className="section-header">
          <p className="eyebrow">{content.eyebrow}</p>
          <h2 className="section-title">{content.title}</h2>
          <p className="section-lead">{content.lead}</p>
        </FadeInUp>

        <FadeInUp delay={0.1}>
          <ul className="mx-auto mt-8 max-w-3xl space-y-4">
            {content.points.map((point) => (
              <li key={point} className="flex items-start gap-3 text-sm font-normal text-neutral-700">
                <Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
                {point}
              </li>
            ))}
          </ul>
        </FadeInUp>
      </div>
    </section>
  );
}
