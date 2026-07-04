"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { BuyHeroPanel } from "@/components/sections/BuyHeroPanel";
import type { BuyPageHero } from "@/lib/data/buy-pages";
import { BUY_PAGE_GENERAL } from "@/lib/data/buy-pages";
import { whatsAppUrlFor } from "@/lib/whatsapp";

const WA = whatsAppUrlFor("heroBuy");
const ease = [0.22, 1, 0.36, 1] as const;

const fade = {
  hidden: { opacity: 0, y: 20 },
  show: (d: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: d, ease },
  }),
};

interface BuyHeroProps {
  content?: BuyPageHero;
}

export function BuyHero({ content = BUY_PAGE_GENERAL.hero }: BuyHeroProps) {
  return (
    <section aria-label="Buying with HomeUP" className="bg-white pb-6 sm:pb-8">
      <div className="container-page pt-8 sm:pt-12 lg:pt-16">
        <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-start lg:gap-12">
          <div className="min-w-0 shrink-0 max-lg:w-full lg:w-[48%] lg:pt-4">
            <motion.h1
              custom={0}
              initial="hidden"
              animate="show"
              variants={fade}
              className="font-display font-extrabold leading-[1.08] tracking-tight text-neutral-900"
              style={{ fontSize: "clamp(1.75rem, 4vw, 3.2rem)" }}
            >
              {content.title}
              <br />
              <span className="text-primary-600">{content.highlight}</span>
            </motion.h1>

            <motion.p
              custom={0.08}
              initial="hidden"
              animate="show"
              variants={fade}
              className="mt-3 text-sm font-medium text-neutral-500"
            >
              {content.subtitle}
            </motion.p>

            <motion.p
              custom={0.16}
              initial="hidden"
              animate="show"
              variants={fade}
              className="mt-3 max-w-md text-sm font-normal leading-relaxed text-neutral-600"
            >
              {content.body}
            </motion.p>

            <motion.ul
              custom={0.24}
              initial="hidden"
              animate="show"
              variants={fade}
              className="mt-4 space-y-2 sm:mt-5"
            >
              {content.points.map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm font-normal text-neutral-700">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" aria-hidden="true" />
                  {p}
                </li>
              ))}
            </motion.ul>

            <motion.div custom={0.32} initial="hidden" animate="show" variants={fade} className="mt-5 sm:mt-6">
              <Button size="lg" asChild className="w-full sm:w-auto">
                <a href={WA} target="_blank" rel="noopener noreferrer" className="justify-center gap-2">
                  <WhatsAppIcon className="h-5 w-5 shrink-0" />
                  WhatsApp Us
                </a>
              </Button>
              <p className="mt-2 text-sm font-normal text-neutral-400">{content.ctaNote}</p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.25, ease }}
            className="min-w-0 max-lg:w-full lg:flex-1 lg:max-w-[52%]"
          >
            <BuyHeroPanel className="mx-auto w-full max-w-xl lg:max-w-none" showAdvisor priority />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
