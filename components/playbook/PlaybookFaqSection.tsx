"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { FaqEntry } from "@/lib/data/playbook";
import { cn } from "@/lib/utils";

type PlaybookFaqSectionProps = {
  items: FaqEntry[];
  title?: string;
  className?: string;
};

export function PlaybookFaqSection({
  items,
  title = "Frequently asked questions",
  className,
}: PlaybookFaqSectionProps) {
  const valid = items.filter((item) => item.q?.trim() && item.a?.trim());
  if (valid.length === 0) return null;

  return (
    <section className={cn("playbook-article-body border-t border-neutral-200 pt-10", className)}>
      <h2 className="font-display text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">
        {title}
      </h2>
      <Accordion type="single" collapsible className="mt-6">
        {valid.map((item, index) => (
          <AccordionItem
            key={`${index}-${item.q.slice(0, 24)}`}
            value={`faq-${index}`}
            className="border-neutral-200"
          >
            <AccordionTrigger className="py-5 text-left text-base font-semibold text-neutral-900 hover:no-underline">
              {item.q}
            </AccordionTrigger>
            <AccordionContent>
              <p className="speakable-faq-answer text-base leading-relaxed text-neutral-700">
                {item.a}
              </p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
