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
import { ListingCount } from "@/components/listings/ListingCount";
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
  /** Active listing count for dynamic FAQ answers. */
  listingCount?: number;
}

function FaqAnswer({ item, listingCount }: { item: FaqItem; listingCount?: number }) {
  if (item.listingCountVariant === "hosting-scale") {
    return (
      <>
        We keep costs down in two ways. You host viewings at your home, and we have{" "}
        <ListingCount initialCount={listingCount} suffix=" homes" /> listed at once so marketing
        work is shared. Your CEA-licensed advisor still handles pricing, negotiation, paperwork,
        and timeline planning.
      </>
    );
  }

  if (item.listingCountVariant === "shared-marketing") {
    return (
      <>
        We have <ListingCount initialCount={listingCount} suffix=" homes" /> listed at once, so
        listing and marketing work is shared. Sellers host their own viewings, so your advisor does
        not travel to every showing. We also run without a large traditional office setup. Those
        savings show up as a fixed fee instead of a 2% commission.
      </>
    );
  }

  return item.a;
}

function FaqAnswerBody({ item, listingCount }: { item: FaqItem; listingCount?: number }) {
  const answer = <FaqAnswer item={item} listingCount={listingCount} />;

  if (item.link) {
    return (
      <>
        {answer}{" "}
        <a
          href={item.link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary-600 underline underline-offset-2 transition-colors hover:text-primary-700"
        >
          {item.link.label}
        </a>
      </>
    );
  }

  return answer;
}

export function FAQSection({
  items,
  eyebrow = "Common Questions",
  title = "Frequently Asked Questions",
  lead,
  speakableAnswerCount = 0,
  whatsappContext,
  listingCount,
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
                      <FaqAnswerBody item={item} listingCount={listingCount} />
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
