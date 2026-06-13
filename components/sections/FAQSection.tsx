"use client";

import type { FaqItem } from "@/lib/data/faqs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { FadeInUp } from "@/components/ui/motion-primitives";

interface FAQSectionProps {
  items: FaqItem[];
  eyebrow?: string;
  title?: string;
  lead?: string;
  /** First N answers receive `.speakable-faq-answer` for voice/AEO schema hooks. */
  speakableAnswerCount?: number;
}

export function FAQSection({
  items,
  eyebrow = "Common Questions",
  title = "Frequently Asked Questions",
  lead,
  speakableAnswerCount = 0,
}: FAQSectionProps) {
  return (
    <section aria-label="Frequently asked questions" className="section-padding bg-neutral-50">
      <div className="container-page">
        <FadeInUp className="section-header">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 className="section-title">{title}</h2>
          {lead && <p className="section-lead">{lead}</p>}
        </FadeInUp>

        <FadeInUp delay={0.1} className="mx-auto mt-10 max-w-3xl">
          <Accordion type="single" collapsible className="divide-y divide-neutral-200 rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
            {items.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-b-0 px-6">
                <AccordionTrigger className="py-5 text-left text-sm font-semibold text-neutral-900 hover:no-underline hover:text-primary-700 [&[data-state=open]]:text-primary-700 transition-colors duration-150">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent
                  className={`pb-5 text-sm leading-relaxed text-neutral-600${
                    i < speakableAnswerCount ? " speakable-faq-answer" : ""
                  }`}
                >
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </FadeInUp>
      </div>
    </section>
  );
}
