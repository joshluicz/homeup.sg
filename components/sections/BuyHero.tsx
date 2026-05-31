"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";

const WA = "https://wa.me/6580877015";
const ease = [0.22, 1, 0.36, 1] as const;

const fade = {
  hidden: { opacity: 0, y: 20 },
  show: (d: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: d, ease },
  }),
};

const points = [
  "Affordability, grants and financing guidance",
  "HDB, resale condo and new launch comparisons",
  "Negotiation and sell-and-buy coordination",
];

/** Residential exterior — warm, approachable hero backdrop */
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80";

export function BuyHero() {
  return (
    <section aria-label="Buying with HomeUP" className="bg-white">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-10 px-8 py-12 sm:px-12 lg:flex-row lg:items-start lg:gap-12 lg:py-16 xl:px-20">

        {/* Left — same rhythm as homepage Hero */}
        <div className="w-full shrink-0 lg:w-[44%] lg:pt-4">
          <motion.p
            custom={0} initial="hidden" animate="show" variants={fade}
            className="text-sm font-semibold uppercase tracking-widest text-primary-600"
          >
            Buying With HomeUP
          </motion.p>

          <motion.h1
            custom={0.1} initial="hidden" animate="show" variants={fade}
            className="mt-3 font-display font-extrabold leading-[1.06] tracking-tight text-neutral-900"
            style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)" }}
          >
            Buy with a clear plan.
            <br />
            <span className="text-primary-600">Not guesswork.</span>
          </motion.h1>

          <motion.p
            custom={0.18} initial="hidden" animate="show" variants={fade}
            className="mt-3 text-sm font-medium text-neutral-500"
          >
            A coordinated buying team — not a solo agent.
          </motion.p>

          <motion.p
            custom={0.26} initial="hidden" animate="show" variants={fade}
            className="mt-3 max-w-md text-sm font-normal leading-relaxed text-neutral-600"
          >
            From your first HDB to a condo upgrade or new launch, HomeUP guides
            every stage — financing, shortlisting, negotiation and timing your
            next move — so you buy with confidence.
          </motion.p>

          <motion.ul
            custom={0.32} initial="hidden" animate="show" variants={fade}
            className="mt-5 space-y-2"
          >
            {points.map((p) => (
              <li key={p} className="flex items-start gap-2 text-sm font-normal text-neutral-700">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" aria-hidden="true" />
                {p}
              </li>
            ))}
          </motion.ul>

          <motion.div
            custom={0.38} initial="hidden" animate="show" variants={fade}
            className="mt-6"
          >
            <Button size="lg" asChild className="w-full sm:w-auto">
              <a href={WA} target="_blank" rel="noopener noreferrer" className="justify-center gap-2">
                <WhatsAppIcon className="h-5 w-5 shrink-0" />
                Book a Free Consultation
              </a>
            </Button>
            <p className="mt-2 text-sm font-normal text-neutral-400">
              No commitment · Build a clear roadmap for your next move
            </p>
          </motion.div>
        </div>

        {/* Right — photo panel */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.25, ease }}
          className="w-full lg:flex-1"
        >
          <div className="relative overflow-hidden rounded-2xl" style={{ aspectRatio: "4/3" }}>
            <Image
              src={HERO_IMAGE}
              alt="Modern Singapore home"
              fill
              priority
              className="object-cover object-center"
              sizes="(max-width: 1024px) 100vw, 56vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />

            {/* Buying team chip — Tong Boon as senior advisor, not the whole pitch */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-xl border border-white/20 bg-white/95 px-4 py-3 shadow-md backdrop-blur-sm sm:right-auto sm:max-w-sm">
              <Image
                src="/images/agent-tong-boon.png"
                alt="Yeo Tong Boon"
                width={44}
                height={44}
                className="h-11 w-11 shrink-0 rounded-full border border-neutral-200 object-cover object-top"
              />
              <div className="min-w-0">
                <p className="text-sm font-bold text-neutral-900">HomeUP Buying Team</p>
                <p className="text-sm font-normal text-neutral-500">
                  Yeo Tong Boon · Senior Advisor
                </p>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
