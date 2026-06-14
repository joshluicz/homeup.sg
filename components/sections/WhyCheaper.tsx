"use client";

import { Building2, Home, Workflow } from "lucide-react";
import { motion } from "framer-motion";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { FadeInUp, StaggerContainer, StaggerItem } from "@/components/ui/motion-primitives";

const pillars = [
  {
    icon: Building2,
    title: "Economies of scale",
    body: "HomeUP carries 120+ active listings at once. Marketing, buyer follow-up, and documentation run on shared systems, so each sale does not need the same overhead as a solo agent juggling a handful of homes.",
    accent: "from-primary-600 to-primary-700",
    surface: "bg-[#eef5f0]/60",
  },
  {
    icon: Home,
    title: "You host the viewings",
    body: "We screen enquiries, brief you on what to expect, and coordinate timing. You show buyers around your home. Our agents are not travelling to every viewing, and that is a big part of why a fixed fee works.",
    accent: "from-primary-500 to-primary-600",
    surface: "bg-white",
  },
  {
    icon: Workflow,
    title: "Focus on what moves the sale",
    body: "Listing, negotiation, and completion paperwork are handled end to end. We skip the busywork that pads a percentage commission without helping you sell faster or for more.",
    accent: "from-primary-700 to-primary-800",
    surface: "bg-[#eef5f0]/40",
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
                <motion.div
                  className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#c5ddd0] p-6 shadow-[0_4px_24px_rgba(0,154,68,0.07)] sm:p-7 ${p.surface}`}
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div
                    className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${p.accent}`}
                    aria-hidden="true"
                  />
                  <div
                    className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary-600/10 blur-2xl transition-opacity duration-300 group-hover:bg-primary-600/15"
                    aria-hidden="true"
                  />
                  <span className="relative mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white shadow-brand-sm ring-4 ring-primary-600/10">
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <h3 className="relative mb-2 text-sm font-bold text-neutral-900">
                    {p.title}
                  </h3>
                  <p className="relative text-sm font-normal leading-relaxed text-neutral-600">
                    {p.body}
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
