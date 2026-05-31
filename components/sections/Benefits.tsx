"use client";
import {
  CalendarClock,
  ChartNoAxesColumnIncreasing,
  ClipboardCheck,
  Megaphone,
  MessagesSquare,
  PiggyBank,
} from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { FadeInUp, StaggerContainer, StaggerItem } from "@/components/ui/motion-primitives";
import { motion } from "framer-motion";

const benefits = [
  {
    title: "Save more with fixed fees",
    body: "Our past clients from HDB to Landed owners have saved an average of 10k-70k in Agent Commissions.",
    icon: PiggyBank,
  },
  {
    title: "Sell and Buy Planned Together",
    body: "Your sale and purchase are coordinated as one journey, reducing uncertainty, rushed moves, and unnecessary compromises.",
    icon: CalendarClock,
  },
  {
    title: "Clarity Before Commitment",
    body: "Understand your options, timing, and affordability upfront, so decisions are made calmly and confidently.",
    icon: ClipboardCheck,
  },
  {
    title: "Wider Visibility That Drives Real Interest",
    body: "Your home is marketed across major property platforms and channels, ensuring broad exposure to serious buyers, not just a single listing. That means more qualified enquiries, stronger viewing momentum, and a better chance of competitive offers without unrealistic pricing.",
    icon: Megaphone,
  },
  {
    title: "Regular Review, Not 'List and Hope'",
    body: "Market feedback is reviewed consistently, and the plan is refined when needed thoughtfully, not reactively, so you can make decisions based on real signals, not panic or guesswork.",
    icon: ChartNoAxesColumnIncreasing,
  },
  {
    title: "Responsive Follow-Through, Fewer Missed Buyers",
    body: "Structured processes and automation ensure enquiries, viewings, and offers are handled promptly and tracked properly, so opportunities aren't lost due to slow replies, missed follow-ups, or poor coordination.",
    icon: MessagesSquare,
  },
];

export function Benefits() {
  return (
    <section aria-label="Why homeowners choose HomeUP" className="section-padding bg-neutral-100">
      <div className="container-page">
        <FadeInUp className="section-header">
          <Eyebrow>Why Homeowners Choose HomeUP</Eyebrow>
          <h2 className="section-title">
            Designed for Homeowners Who Value Clarity and Coordinated Planning
          </h2>
          <p className="section-lead">
            With fixed fees and coordinated planning, decisions stay neutral,
            timelines stay smooth, with more of your equity going into your next
            home, not commissions.
          </p>
        </FadeInUp>

        <StaggerContainer className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <StaggerItem key={benefit.title}>
                <motion.div
                  className="card bg-neutral-0 h-full"
                  whileHover={{ y: -4, boxShadow: "var(--shadow-md)" }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                    <Icon aria-hidden="true" className="h-6 w-6" />
                  </div>
                  <h3 className="m-0 text-lg font-semibold text-neutral-900">
                    {benefit.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                    {benefit.body}
                  </p>
                </motion.div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}
