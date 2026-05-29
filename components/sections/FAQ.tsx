"use client";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { FadeInUp, StaggerContainer, StaggerItem } from "@/components/ui/motion-primitives";

const faqs = [
  {
    q: "How much does HomeUP charge to sell my home?",
    a: "HomeUP charges a transparent fixed fee: $1,999 for HDB, $4,999 for Condo, and $9,999 for Landed properties. All fees are GST-applicable. There are no surprise charges or percentage commissions.",
  },
  {
    q: "What does the fixed fee include?",
    a: "Every package includes financial calculations, timeline advising, professional marketing across major property portals, viewing arrangements, and full documentation support. HDB packages additionally cover HDB submission, while Condo and Landed packages include contract drafting.",
  },
  {
    q: "How much can I save compared to a typical 2% commission?",
    a: "On a $1M condo, a typical 2% commission is $20,000. HomeUP charges $4,999 — saving you over $15,000. Our past clients from HDB to Landed owners have saved an average of $10,000–$70,000 in agent commissions.",
  },
  {
    q: "Is HomeUP a licensed property agency?",
    a: "Yes. All HomeUP advisors are CEA-registered and operate under C & H Properties Pte Ltd (CEA: L3007139C). You can verify each agent's licence on the CEA public register.",
  },
  {
    q: "How long does it typically take to sell my home?",
    a: "HomeUP operates within a focused 3-month engagement. Many clients receive offers within weeks. The timeline depends on property type, pricing strategy, and market conditions — but our structured approach means no indefinite, open-ended listings.",
  },
  {
    q: "Can HomeUP help me sell and buy at the same time?",
    a: "Absolutely. Coordinated sell-and-buy planning is our speciality. We sequence your sale and purchase as one journey, reducing the risk of rushed decisions, bridging loans, or unnecessary temporary housing costs.",
  },
];

const ease = [0.22, 1, 0.36, 1] as const;

function FAQItem({ faq }: { faq: { q: string; a: string } }) {
  const [open, setOpen] = useState(false);

  return (
    <StaggerItem>
      <div className="border-b border-neutral-200 last:border-b-0">
        <button
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-4 py-5 text-left"
          onClick={() => setOpen((prev) => !prev)}
          type="button"
        >
          <span className="text-base font-semibold leading-snug text-neutral-900">
            {faq.q}
          </span>
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            className="shrink-0 text-primary-600"
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <ChevronDown aria-hidden="true" className="h-5 w-5" />
          </motion.span>
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="answer"
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              initial={{ height: 0, opacity: 0 }}
              style={{ overflow: "hidden" }}
              transition={{ duration: 0.3, ease }}
            >
              <p className="pb-5 text-sm leading-relaxed text-neutral-600">
                {faq.a}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </StaggerItem>
  );
}

export function FAQ() {
  return (
    <section aria-label="Frequently asked questions" className="section-padding bg-neutral-50">
      <div className="container-page">
        <FadeInUp className="section-header">
          <Eyebrow>Have Questions?</Eyebrow>
          <h2 className="section-title">Frequently Asked Questions</h2>
          <p className="section-lead">
            Everything you need to know about HomeUP&#39;s fixed-fee model
            before booking your free planning session.
          </p>
        </FadeInUp>

        <div className="mx-auto max-w-3xl rounded-xl border border-neutral-200 bg-neutral-0 px-6 shadow-sm">
          <StaggerContainer>
            {faqs.map((faq) => (
              <FAQItem faq={faq} key={faq.q} />
            ))}
          </StaggerContainer>
        </div>
      </div>
    </section>
  );
}
