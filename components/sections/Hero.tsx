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
    <div>
      <div
        ref={ref}
        className="rounded-2xl bg-primary-600 px-5 py-4 shadow-[0_4px_24px_rgba(14,133,62,0.28)] sm:px-6 sm:py-5"
      >
        <div className="flex items-center justify-center gap-6 sm:gap-8">
          <div className="shrink-0 text-center">
            <p className="font-display text-3xl font-extrabold text-white tabular-nums sm:text-4xl md:text-5xl">
              {total.toLocaleString()}+
              <span className="text-lg font-semibold sm:text-xl md:text-2xl">*</span>
            </p>
            <p className="mt-1 text-sm font-medium text-primary-100 sm:text-base">Transactions</p>
          </div>

          <div className="h-14 w-px shrink-0 bg-white/25 sm:h-16 md:h-20" aria-hidden="true" />

          <div className="flex flex-col gap-2 sm:gap-2.5">
            {breakdown.map((b) => (
              <span
                key={b.key}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 sm:px-4 sm:py-2"
              >
                <span className="font-display text-xl font-bold text-white tabular-nums sm:text-2xl md:text-3xl">
                  {breakdownValues[b.key].toLocaleString()}+
                </span>
                <span className="text-sm font-medium text-primary-100 sm:text-base">{b.label}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-1.5 text-center text-[10px] leading-snug text-neutral-400">
        * CEA records under Dennis, Tongboon, Edmund
      </p>
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
            className="font-display font-extrabold leading-[1.06] tracking-tight text-neutral-900"
            style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)" }}
          >
            Sell your home for more.
            <br />
            <span className="text-primary-600">Save on Commissions.</span>
          </motion.h1>

          <motion.p
            custom={0.08} initial="hidden" animate="show" variants={fade}
            className="mt-3 text-sm font-medium text-neutral-500"
          >
            Your family fixed-fee agent.
          </motion.p>

          <motion.p
            custom={0.14} initial="hidden" animate="show" variants={fade}
            className="mt-4 max-w-md text-base font-normal leading-relaxed text-neutral-600 sm:text-lg"
          >
            Most Singapore homeowners give away $10,000–$70,000 in commission.
            HomeUP charges a fixed fee for the same full service.
          </motion.p>

          <motion.div
            custom={0.22} initial="hidden" animate="show" variants={fade}
            className="mt-6"
          >
            <Button size="lg" asChild className="w-full sm:w-auto">
              <a href={WA} target="_blank" rel="noopener noreferrer" className="justify-center gap-2">
                <WhatsAppIcon className="h-5 w-5 shrink-0" />
                Book a Free Call
              </a>
            </Button>
            <p className="mt-2 text-sm font-normal text-neutral-400">
              No commitment · Free 30-min planning session
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

          <div className="mt-6">
            <StatsRow />
          </div>
        </motion.div>

      </div>
    </section>
  );
}
