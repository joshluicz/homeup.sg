"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";
import NumberFlow from "@number-flow/react";
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

const STATS = [
  { target: 1000, label: "Transactions" },
  { target: 860,  label: "HDB" },
  { target: 260,  label: "Condo & Landed" },
];

function AnimatedStat({ target, label }: { target: number; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (inView) setValue(target);
  }, [inView, target]);

  return (
    <div ref={ref} className="flex flex-col items-center">
      <p className="font-display text-sm font-extrabold text-neutral-900 tabular-nums">
        <NumberFlow value={value} /><span>+</span>
      </p>
      <p className="mt-0.5 text-sm font-normal text-neutral-500">{label}</p>
    </div>
  );
}

function StatsRow() {
  return (
    <div className="flex items-center justify-center gap-6 sm:gap-10">
      {STATS.map((s, i) => (
        <div key={s.label} className="flex items-center gap-6 sm:gap-10">
          <AnimatedStat target={s.target} label={s.label} />
          {i < STATS.length - 1 && (
            <div className="h-8 w-px shrink-0 bg-neutral-200" aria-hidden="true" />
          )}
        </div>
      ))}
    </div>
  );
}

export function Hero() {
  return (
    <section
      aria-label="Fixed-fee property agents hero"
      className="bg-white"
    >
      <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-8 px-8 py-12 sm:px-12 lg:flex-row lg:items-start lg:gap-12 lg:py-16 xl:px-20">

        {/* ── Left: text content ── */}
        <div className="w-full shrink-0 lg:w-[44%] lg:pt-4">
          <motion.p
            custom={0} initial="hidden" animate="show" variants={fade}
            className="text-sm font-semibold uppercase tracking-widest text-primary-600"
          >
            Fixed-Fee Property Agents · Singapore
          </motion.p>

          <motion.h1
            custom={0.1} initial="hidden" animate="show" variants={fade}
            className="mt-3 font-display font-extrabold leading-[1.06] tracking-tight text-neutral-900"
            style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)" }}
          >
            Sell your home for more.
            <br />
            <span className="text-primary-600">Save on commissions.</span>
          </motion.h1>

          <motion.p
            custom={0.18} initial="hidden" animate="show" variants={fade}
            className="mt-3 text-sm font-medium text-neutral-500"
          >
            Your family fixed-fee agent.
          </motion.p>

          <motion.p
            custom={0.26} initial="hidden" animate="show" variants={fade}
            className="mt-3 max-w-md text-sm font-normal leading-relaxed text-neutral-600"
          >
            Most Singapore homeowners give away $10,000–$70,000 in commission.
            HomeUP charges a fixed fee — same full service, radically more honest.
          </motion.p>

          <motion.div
            custom={0.34} initial="hidden" animate="show" variants={fade}
            className="mt-6"
          >
            <Button size="lg" asChild className="w-full sm:w-auto">
              <a href={WA} target="_blank" rel="noopener noreferrer" className="justify-center gap-2">
                <WhatsAppIcon className="h-5 w-5 shrink-0" />
                Book a Free Call
              </a>
            </Button>
            <p className="mt-2 text-sm font-normal text-neutral-400">
              No commitment · Free 45-min planning session
            </p>
          </motion.div>
        </div>

        {/* ── Right: photo + stats (all screen sizes) ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.25, ease }}
          className="w-full lg:flex-1"
        >
          <Image
            src="/images/team-group.png"
            alt="The HomeUP team — five agents giving thumbs up"
            width={920}
            height={614}
            priority
            className="w-full object-contain"
            sizes="(max-width: 1024px) 100vw, 56vw"
          />

          {/* Stats — below photo on both mobile and desktop */}
          <div className="mt-6 border-t border-neutral-100 pt-5">
            <StatsRow />
          </div>
        </motion.div>

      </div>
    </section>
  );
}
