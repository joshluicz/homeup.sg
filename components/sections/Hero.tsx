"use client";
import { useEffect, useRef, useState } from "react";
import { animate, motion, useInView } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";

const WA = "https://wa.me/6580877015";
const ease = [0.22, 1, 0.36, 1] as const;
const COUNT_DURATION = 2.5;

const fade = {
  hidden: { opacity: 0, y: 20 },
  show: (d: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: d, ease },
  }),
};

const breakdown = [
  { key: "hdb", target: 860, label: "HDB" },
  { key: "condo", target: 260, label: "Condo & Landed" },
] as const;

function StatsRow() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const [total, setTotal] = useState(0);
  const [hdb, setHdb] = useState(0);
  const [condo, setCondo] = useState(0);

  useEffect(() => {
    if (!inView) return;

    // Linear count-up — all three finish together at COUNT_DURATION
    const controls = [
      animate(0, 1000, {
        duration: COUNT_DURATION,
        ease: "linear",
        onUpdate: (v) => setTotal(Math.round(v)),
      }),
      animate(0, 860, {
        duration: COUNT_DURATION,
        ease: "linear",
        onUpdate: (v) => setHdb(Math.round(v)),
      }),
      animate(0, 260, {
        duration: COUNT_DURATION,
        ease: "linear",
        onUpdate: (v) => setCondo(Math.round(v)),
      }),
    ];

    return () => controls.forEach((c) => c.stop());
  }, [inView]);

  const breakdownValues = { hdb, condo };

  return (
    <div ref={ref} className="flex items-center justify-center gap-5">
      <div className="shrink-0 text-center">
        <p className="font-display text-sm font-extrabold text-neutral-900 tabular-nums">
          {total.toLocaleString()}+
        </p>
        <p className="mt-0.5 text-sm font-normal text-neutral-500">Transactions</p>
      </div>

      <div className="h-10 w-px shrink-0 bg-neutral-200" aria-hidden="true" />

      <div className="flex flex-col gap-1.5">
        {breakdown.map((b) => (
          <span
            key={b.key}
            className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1"
          >
            <span className="font-display text-sm font-bold text-neutral-900 tabular-nums">
              {breakdownValues[b.key].toLocaleString()}+
            </span>
            <span className="text-sm font-normal text-neutral-500">{b.label}</span>
          </span>
        ))}
      </div>
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

        <div className="w-full shrink-0 lg:w-[44%] lg:pt-4">
          <motion.h1
            custom={0} initial="hidden" animate="show" variants={fade}
            className="font-display leading-[1.08] tracking-tight text-neutral-900"
            style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)" }}
          >
            <span className="block font-semibold">
              <span className="text-primary-600">Fixed Fee</span> Agent
            </span>
            <span className="block font-bold">
              <span className="text-primary-600">Keep the Commission</span>
            </span>
            <span className="block font-extrabold">
              Sell Your Home for <span className="text-primary-600">More.</span>
            </span>
          </motion.h1>

          <motion.p
            custom={0.08} initial="hidden" animate="show" variants={fade}
            className="mt-4 max-w-md text-base font-normal leading-relaxed text-neutral-600 sm:text-lg"
          >
            Most Singapore homeowners give away $10,000–$70,000 in commission.
            HomeUP charges a fixed fee for the same full service.
          </motion.p>

          <motion.div
            custom={0.16} initial="hidden" animate="show" variants={fade}
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

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.25, ease }}
          className="w-full lg:flex-1"
        >
          <Image
            src="/images/team-group.png"
            alt="The HomeUP team, five agents giving thumbs up"
            width={920}
            height={614}
            priority
            className="w-full object-contain"
            sizes="(max-width: 1024px) 100vw, 56vw"
          />

          <div className="mt-6 border-t border-neutral-100 pt-5">
            <StatsRow />
          </div>
        </motion.div>

      </div>
    </section>
  );
}
