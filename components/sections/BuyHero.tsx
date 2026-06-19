"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import type { BuyPageHero } from "@/lib/data/buy-pages";
import { BUY_PAGE_GENERAL } from "@/lib/data/buy-pages";
import { BUY_HERO_ALT, BUY_HERO_IMAGE, BUY_HERO_IMAGE_CLASS } from "@/lib/constants/images";
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
          <div className="min-w-0 shrink-0 max-lg:w-full lg:w-[44%] lg:pt-4">
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
                  Book a Free Consultation
                </a>
              </Button>
              <p className="mt-2 text-sm font-normal text-neutral-400">{content.ctaNote}</p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.25, ease }}
            className="min-w-0 max-lg:w-full lg:flex-1"
          >
            <div className="relative overflow-hidden rounded-xl sm:rounded-2xl" style={{ aspectRatio: "4/3" }}>
              <Image
                src={BUY_HERO_IMAGE}
                alt={BUY_HERO_ALT}
                fill
                priority
                className={BUY_HERO_IMAGE_CLASS}
                sizes="(max-width: 1024px) 100vw, 56vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />

              <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2.5 rounded-xl border border-white/20 bg-white/95 px-3 py-2.5 shadow-md backdrop-blur-sm sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-sm sm:gap-3 sm:px-4 sm:py-3">
                <Image
                  src="/images/agent-tong-boon.png"
                  alt="Yeo Tong Boon"
                  width={44}
                  height={44}
                  className="h-10 w-10 shrink-0 rounded-full border border-neutral-200 object-cover object-top sm:h-11 sm:w-11"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-neutral-900 sm:text-sm">HomeUP Buying Team</p>
                  <p className="text-xs font-normal text-neutral-500 sm:text-sm">
                    Yeo Tong Boon · Senior Advisor
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
