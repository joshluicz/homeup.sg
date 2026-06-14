"use client";

import type { FaqItem } from "@/lib/data/faqs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { FaqContactHighlight } from "@/components/ui/faq-contact-highlight";
import { FadeInUp } from "@/components/ui/motion-primitives";
import {
  buildWhatsAppUrl,
  WHATSAPP_MESSAGES,
  type WhatsAppMessageKey,
} from "@/lib/whatsapp";

interface FAQSectionProps {
  items: FaqItem[];
  eyebrow?: string;
  title?: string;
  lead?: string;
  /** First N answers receive `.speakable-faq-answer` for voice/AEO schema hooks. */
  speakableAnswerCount?: number;
  /** Pre-filled WhatsApp message context for the contact CTA. */
  whatsappContext?: WhatsAppMessageKey;
}

export function FAQSection({
  items,
  eyebrow = "Common Questions",
  title = "Frequently Asked Questions",
  lead,
  speakableAnswerCount = 0,
  whatsappContext,
}: FAQSectionProps) {
  const whatsappUrl = whatsappContext
    ? buildWhatsAppUrl(WHATSAPP_MESSAGES[whatsappContext])
    : undefined;

  return (
    <section aria-label="Frequently asked questions" className="section-padding bg-neutral-50">
      <div className="container-page">
        <FadeInUp className="section-header">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 className="section-title">{title}</h2>
          {lead && <p className="section-lead">{lead}</p>}
        </FadeInUp>

        <FadeInUp delay={0.1} className="mx-auto mt-10 max-w-5xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
            <div className="min-w-0 flex-1">
              <Accordion
                type="single"
                collapsible
                className="divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm"
              >
                {items.map((item, i) => (
                  <AccordionItem key={i} value={`item-${i}`} className="border-b-0 px-6">
                    <AccordionTrigger className="py-5 text-left text-sm font-semibold text-neutral-900 transition-colors duration-150 hover:no-underline hover:text-primary-700 [&[data-state=open]]:text-primary-700">
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
            </div>

            {whatsappUrl && <FaqContactHighlight whatsappUrl={whatsappUrl} />}
          </div>
        </FadeInUp>
      </div>
    </section>
  );
}
